/**
 * Interfaces para respostas da API Asaas v3
 */

export interface AsaasWallet {
  id: string;
  name?: string;
  balance?: number;
  [key: string]: unknown;
}

export interface AsaasPayment {
  id: string;
  dateCreated: string;
  customer: string;
  paymentLink?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  invoiceNumber?: string;
  value: number;
  netValue?: number;
  billingType:
    | 'PIX'
    | 'BOLETO'
    | 'CREDIT_CARD'
    | 'DEBIT_CARD'
    | 'UNDEFINED';
  status: string;
  dueDate: string;
  externalReference?: string;
  [key: string]: unknown;
}

export interface AsaasPixQrCode {
  encodedImage: string;
  payload: string;
  expirationDate: string;
  [key: string]: unknown;
}

export interface AsaasTransfer {
  id: string;
  value: number;
  status: string;
  /** URL do comprovante; disponível após a transferência ser confirmada (DONE). */
  transactionReceiptUrl?: string | null;
  [key: string]: unknown;
}

export type AsaasPixKeyType = 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'EVP' | 'RANDOM';

/** Conta bancária para transferência TED (Asaas API) */
export interface AsaasTransferBankAccount {
  bank: { code: string };
  ownerName: string;
  cpfCnpj: string;
  agency: string;
  account: string;
  accountDigit: string;
  bankAccountType: 'CONTA_CORRENTE' | 'CONTA_POUPANCA';
}

/** DTO para criar transferência PIX ou TED via Asaas POST /v3/transfers */
export interface CreateTransferDto {
  value: number; // em reais
  /** Para PIX: chave e tipo. Preferir sobre bankAccount se ambos preenchidos. */
  pixAddressKey?: string;
  pixAddressKeyType?: AsaasPixKeyType;
  /** Para TED: dados da conta. Usado se pixAddressKey não informado. */
  bankAccount?: AsaasTransferBankAccount;
  scheduleDate?: string | null; // YYYY-MM-DD ou null = imediato
  description?: string;
}

export interface CreatePaymentDto {
  customer: string;
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'DEBIT_CARD';
  value: number;
  dueDate: string; // YYYY-MM-DD
  description?: string;
  externalReference?: string;
}
