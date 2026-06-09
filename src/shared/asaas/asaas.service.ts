import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ASAAS_SANDBOX_URL, ASAAS_PRODUCTION_URL } from './asaas.constants';
import type {
  AsaasPayment,
  AsaasPixQrCode,
  AsaasTransfer,
  CreatePaymentDto,
  CreateTransferDto,
} from './interfaces/asaas.interface';

@Injectable()
export class AsaasService implements OnModuleInit {
  private readonly logger = new Logger(AsaasService.name);
  private apiKey = '';
  private baseUrl = ASAAS_PRODUCTION_URL;
  private customerId = '';

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.apiKey =
      this.config.get<string>('ASAAS_API_KEY') ||
      this.config.get<string>('ASAAS_ACCESS_TOKEN') ||
      '';

    this.customerId = this.config.get<string>('ASAAS_CUSTOMER_ID') || '';

    const isProduction =
      this.config.get<string>('ASAAS_ENVIRONMENT') === 'production';

    this.baseUrl = isProduction ? ASAAS_PRODUCTION_URL : ASAAS_SANDBOX_URL;

    if (!this.apiKey) {
      this.logger.warn(
        'ASAAS_API_KEY não configurada. Integração Asaas desabilitada.',
      );
    } else {
      this.logger.log(
        `Asaas inicializado (${isProduction ? 'produção' : 'sandbox'})`,
      );
    }
  }

  isEnabled(): boolean {
    return Boolean(this.apiKey);
  }

  getCustomerId(): string {
    return this.customerId;
  }

  async createPayment(params: CreatePaymentDto): Promise<AsaasPayment | null> {
    this.ensureEnabled();
    const res = await fetch(`${this.baseUrl}/v3/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: this.apiKey,
      } as any,
      body: JSON.stringify({
        customer: params.customer,
        billingType: params.billingType,
        value: params.value,
        dueDate: params.dueDate,
        description: params.description ?? undefined,
        externalReference: params.externalReference ?? undefined,
      }),
    });
    if (!res.ok) {
      const bodyText = await res.text().catch(() => '');
      this.logger.error(
        `Erro ao criar pagamento Asaas: status=${res.status} body=${bodyText}`,
      );
      throw new Error('Falha ao criar pagamento no Asaas');
    }
    return (await res.json()) as AsaasPayment;
  }

  async getPaymentPixQrCode(paymentId: string): Promise<AsaasPixQrCode | null> {
    this.ensureEnabled();
    const res = await fetch(
      `${this.baseUrl}/v3/payments/${paymentId}/pixQrCode`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          access_token: this.apiKey,
        } as any,
      },
    );
    if (!res.ok) {
      const bodyText = await res.text().catch(() => '');
      this.logger.error(
        `Erro ao obter QRCode PIX Asaas: status=${res.status} body=${bodyText}`,
      );
      throw new Error('Falha ao obter QRCode PIX no Asaas');
    }
    return (await res.json()) as AsaasPixQrCode;
  }

  async getPayment(paymentId: string): Promise<AsaasPayment | null> {
    this.ensureEnabled();
    const res = await fetch(`${this.baseUrl}/v3/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        access_token: this.apiKey,
      } as any,
    });
    if (!res.ok) {
      const bodyText = await res.text().catch(() => '');
      this.logger.error(
        `Erro ao consultar pagamento Asaas: status=${res.status} body=${bodyText}`,
      );
      throw new Error('Falha ao consultar pagamento no Asaas');
    }
    return (await res.json()) as AsaasPayment;
  }

  /**
   * Cria transferência PIX ou TED (POST /v3/transfers).
   * Requer permissão TRANSFER:WRITE na conta Asaas.
   * Preferência: se pixAddressKey e pixAddressKeyType informados, usa PIX; senão bankAccount para TED.
   */
  async createTransfer(params: CreateTransferDto): Promise<AsaasTransfer> {
    this.ensureEnabled();
    const body: Record<string, unknown> = {
      value: params.value,
      scheduleDate: params.scheduleDate ?? undefined,
      description: params.description ?? undefined,
    };
    if (params.pixAddressKey && params.pixAddressKeyType) {
      let key = params.pixAddressKey.trim();
      if (params.pixAddressKeyType === 'CPF' || params.pixAddressKeyType === 'CNPJ') {
        key = key.replace(/\D/g, '').slice(0, 14);
      } else if (params.pixAddressKeyType === 'PHONE') {
        key = key.replace(/\D/g, '').slice(-11);
      }
      body.pixAddressKey = key;
      body.pixAddressKeyType = params.pixAddressKeyType;
    } else if (params.bankAccount) {
      body.bankAccount = {
        bank: { code: String(params.bankAccount.bank.code).padStart(3, '0').slice(0, 3) },
        ownerName: params.bankAccount.ownerName,
        cpfCnpj: params.bankAccount.cpfCnpj.replace(/\D/g, ''),
        agency: params.bankAccount.agency,
        account: params.bankAccount.account,
        accountDigit: params.bankAccount.accountDigit,
        bankAccountType: params.bankAccount.bankAccountType,
      };
    } else {
      throw new Error('Informe pixAddressKey + pixAddressKeyType ou bankAccount para a transferência.');
    }
    const res = await fetch(`${this.baseUrl}/v3/transfers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: this.apiKey,
      } as Record<string, string>,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const bodyText = await res.text().catch(() => '');
      this.logger.error(`Erro ao criar transferência Asaas: status=${res.status} body=${bodyText}`);
      throw new Error(bodyText || 'Falha ao criar transferência no Asaas');
    }
    return (await res.json()) as AsaasTransfer;
  }

  /**
   * Recupera uma transferência pelo id (GET /v3/transfers/:id).
   * Útil para obter transactionReceiptUrl após a transferência ser confirmada (DONE).
   */
  async getTransfer(transferId: string): Promise<AsaasTransfer> {
    this.ensureEnabled();
    const res = await fetch(`${this.baseUrl}/v3/transfers/${transferId}`, {
      method: 'GET',
      headers: {
        access_token: this.apiKey,
      } as Record<string, string>,
    });
    if (!res.ok) {
      const bodyText = await res.text().catch(() => '');
      this.logger.error(`Erro ao buscar transferência Asaas: status=${res.status} body=${bodyText}`);
      throw new Error(bodyText || 'Transferência não encontrada no Asaas');
    }
    return (await res.json()) as AsaasTransfer;
  }

  private ensureEnabled(): void {
    if (!this.apiKey) {
      throw new Error(
        'Integração Asaas não configurada. Defina ASAAS_API_KEY no ambiente.',
      );
    }
  }
}
