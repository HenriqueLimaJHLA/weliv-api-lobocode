import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { GeocodingService } from './geocoding.service';

const INTERVALO_NOMINATIM_MS = 1100;

@Injectable()
export class GeocodingStartupService implements OnApplicationBootstrap {
  private readonly logger = new Logger(GeocodingStartupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geocoding: GeocodingService,
    private readonly config: ConfigService,
  ) {}

  onApplicationBootstrap(): void {
    const desativado =
      this.config.get<string>('GEOCODING_BACKFILL_ON_STARTUP') === 'false';
    if (desativado) {
      this.logger.log(
        'Backfill geocoding na inicialização desativado (GEOCODING_BACKFILL_ON_STARTUP=false).',
      );
      return;
    }
    void this.executarBackfillCompleto().catch((err) => {
      this.logger.error(
        `Backfill geocoding falhou: ${String((err as Error).message)}`,
        (err as Error).stack,
      );
    });
  }

  private async executarBackfillCompleto(): Promise<void> {
    this.logger.log('Backfill geocoding em segundo plano (empresas pendentes).');
    let empresasOk = 0;
    const companies = await this.prisma.company.findMany({
      where: {
        deletedAt: null,
        OR: [{ latitude: null }, { longitude: null }],
        AND: [
          {
            OR: [{ address: { not: null } }, { city: { not: null } }],
          },
        ],
      },
      select: {
        id: true,
        address: true,
        addressNumber: true,
        city: true,
        state: true,
        zipCode: true,
      },
      orderBy: { updatedAt: 'asc' },
    });
    for (const c of companies) {
      const coords = await this.geocoding.buscarCoordenadasPorEndereco(c);
      if (coords) {
        await this.prisma.company.update({
          where: { id: c.id },
          data: { latitude: coords.latitude, longitude: coords.longitude },
        });
        empresasOk += 1;
      }
      await GeocodingService.aguardarRateLimit(INTERVALO_NOMINATIM_MS);
    }
    this.logger.log(
      `Backfill geocoding concluído: ${empresasOk}/${companies.length} empresas com coords.`,
    );
  }
}
