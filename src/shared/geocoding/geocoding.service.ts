import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type EnderecoParaGeocode = {
  address?: string | null;
  addressNumber?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
};

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly nominatimUrl = 'https://nominatim.openstreetmap.org/search';
  private readonly openMeteoUrl = 'https://geocoding-api.open-meteo.com/v1/search';
  private readonly userAgent: string;
  private readonly cachePorQuery = new Map<
    string,
    { latitude: number; longitude: number }
  >();

  constructor(private readonly configService: ConfigService) {
    this.userAgent = this.configService.get<string>(
      'GEOCODING_USER_AGENT',
      'lobocode-template/1.0 (contato via https://lobocode.com)',
    );
  }

  teveCampoEnderecoAlterado(payload: Record<string, unknown>): boolean {
    return this.payloadTemCampoEndereco(payload);
  }

  mesclarEnderecoPayloadComRow(
    payload: Record<string, unknown>,
    row: EnderecoParaGeocode | null,
  ): EnderecoParaGeocode {
    const keys: (keyof EnderecoParaGeocode)[] = [
      'address',
      'addressNumber',
      'city',
      'state',
      'zipCode',
    ];
    const out: EnderecoParaGeocode = {};
    for (const k of keys) {
      const kk = k as string;
      if (
        Object.prototype.hasOwnProperty.call(payload, kk) &&
        payload[kk] !== undefined
      ) {
        out[k] = payload[kk] as string | null | undefined;
      } else if (row?.[k] != null && String(row[k]).trim() !== '') {
        out[k] = row[k] as string | null;
      }
    }
    return out;
  }

  private normalizarTexto(value?: string | null): string | null {
    if (!value) return null;
    const v = value.trim();
    return v.length > 0 ? v : null;
  }

  private normalizarUf(value?: string | null): string | null {
    const v = this.normalizarTexto(value);
    if (!v) return null;
    return v.toUpperCase();
  }

  private normalizarCep(value?: string | null): string | null {
    const v = this.normalizarTexto(value);
    if (!v) return null;
    const digits = v.replace(/\D/g, '');
    if (digits.length === 8) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return v;
  }

  montarLinhaEndereco(parts: EnderecoParaGeocode): string | null {
    const address = this.normalizarTexto(parts.address);
    const addressNumber = this.normalizarTexto(parts.addressNumber);
    const city = this.normalizarTexto(parts.city);
    const state = this.normalizarUf(parts.state);
    const zipCode = this.normalizarCep(parts.zipCode);

    const chunks: string[] = [];
    if (address) chunks.push(address);
    if (addressNumber) {
      chunks.push(`Nº ${addressNumber}`);
    }
    if (city) chunks.push(city);
    if (state) chunks.push(state);
    if (zipCode) chunks.push(zipCode);
    chunks.push('Brasil');
    if (chunks.length < 2) return null;
    return chunks.join(', ');
  }

  /** true se o body trouxe algum campo de endereço (PATCH parcial). */
  payloadTemCampoEndereco(payload: Record<string, unknown>): boolean {
    const keys = ['address', 'addressNumber', 'city', 'state', 'zipCode'];
    return keys.some(
      (k) =>
        Object.prototype.hasOwnProperty.call(payload, k) &&
        payload[k] !== undefined,
    );
  }

  async buscarCoordenadasPorEndereco(
    parts: EnderecoParaGeocode,
  ): Promise<{ latitude: number; longitude: number } | null> {
    const queryCandidates = this.montarTentativasDeBusca(parts);
    if (queryCandidates.length === 0) return null;
    const controller = new AbortController();
    const timeoutMs = 12_000;
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
      let encontrouRateLimitNominatim = false;
      for (const query of queryCandidates) {
        const result = await this.buscarPrimeiroResultadoPorQuery(query, controller.signal);
        if (result === 'RATE_LIMIT') {
          encontrouRateLimitNominatim = true;
          break;
        }
        if (result) return result;
      }
      if (encontrouRateLimitNominatim) {
        this.logger.warn(
          'Nominatim com rate limit; tentando fallback por provedor alternativo.',
        );
      }
      return this.buscarCoordenadasViaOpenMeteo(parts, controller.signal);
    } catch (err) {
      this.logger.warn(`Geocoding falhou: ${String((err as Error).message)}`);
      return null;
    } finally {
      clearTimeout(t);
    }
  }

  static async aguardarRateLimit(ms: number): Promise<void> {
    await new Promise((r) => setTimeout(r, ms));
  }

  private montarTentativasDeBusca(parts: EnderecoParaGeocode): string[] {
    const address = this.normalizarTexto(parts.address);
    const addressNumber = this.normalizarTexto(parts.addressNumber);
    const city = this.normalizarTexto(parts.city);
    const state = this.normalizarUf(parts.state);
    const zipCode = this.normalizarCep(parts.zipCode);
    const queries = new Set<string>();
    const push = (chunks: Array<string | null>) => {
      const items = chunks.filter((item): item is string => Boolean(item));
      if (items.length >= 2) {
        queries.add([...items, 'Brasil'].join(', '));
      }
    };
    push([address, addressNumber ? `Nº ${addressNumber}` : null, city, state, zipCode]);
    push([address, city, state, zipCode]);
    push([address, city, state]);
    push([zipCode, city, state]);
    push([zipCode, state]);
    push([city, state]);
    push([city]);
    return Array.from(queries);
  }

  private async buscarPrimeiroResultadoPorQuery(
    query: string,
    signal: AbortSignal,
  ): Promise<{ latitude: number; longitude: number } | 'RATE_LIMIT' | null> {
    const cacheKey = `nominatim:${query}`;
    const cached = this.cachePorQuery.get(cacheKey);
    if (cached) return cached;
    const url = `${this.nominatimUrl}?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': this.userAgent,
        'Accept-Language': 'pt-BR',
      },
      signal,
    });
    if (!res.ok) {
      this.logger.warn(`Nominatim status ${res.status} para query: ${query}`);
      if (res.status === 429) {
        return 'RATE_LIMIT';
      }
      return null;
    }
    const body = (await res.json()) as Array<{ lat?: string; lon?: string }>;
    const first = body[0];
    if (!first?.lat || !first?.lon) return null;
    const latitude = parseFloat(first.lat);
    const longitude = parseFloat(first.lon);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;
    this.logger.log(`Geocoding resolvido com query de fallback: ${query}`);
    const coords = { latitude, longitude };
    this.cachePorQuery.set(cacheKey, coords);
    return coords;
  }

  private async buscarCoordenadasViaOpenMeteo(
    parts: EnderecoParaGeocode,
    signal: AbortSignal,
  ): Promise<{ latitude: number; longitude: number } | null> {
    const city = this.normalizarTexto(parts.city);
    const state = this.normalizarUf(parts.state);
    const zipCode = this.normalizarCep(parts.zipCode)?.replace(/\D/g, '') || null;
    const queries = new Set<string>();
    if (city && state) queries.add(`${city}, ${state}`);
    if (city) queries.add(city);
    if (zipCode) queries.add(zipCode);
    for (const query of Array.from(queries)) {
      const cacheKey = `openmeteo:${query}`;
      const cached = this.cachePorQuery.get(cacheKey);
      if (cached) return cached;
      const url = `${this.openMeteoUrl}?name=${encodeURIComponent(query)}&count=1&language=pt&format=json`;
      const res = await fetch(url, { signal });
      if (!res.ok) {
        this.logger.warn(`OpenMeteo status ${res.status} para query: ${query}`);
        continue;
      }
      const body = (await res.json()) as {
        results?: Array<{ latitude?: number; longitude?: number; country_code?: string }>;
      };
      const first = Array.isArray(body.results) ? body.results[0] : null;
      if (!first) continue;
      if (first.country_code && first.country_code !== 'BR') continue;
      const latitude = Number(first.latitude);
      const longitude = Number(first.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
      const coords = { latitude, longitude };
      this.cachePorQuery.set(cacheKey, coords);
      this.logger.log(`Geocoding resolvido via OpenMeteo: ${query}`);
      return coords;
    }
    return null;
  }
}
