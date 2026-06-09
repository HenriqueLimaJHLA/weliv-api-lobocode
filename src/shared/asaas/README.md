# Integração Asaas (gateway de pagamento)

Pagamentos via PIX, Boleto e Cartão de Crédito usando a API do Asaas.

## Variáveis de ambiente

Adicione ao seu `.env`:

```env
# Asaas (obrigatório para pagamentos)
ASAAS_API_KEY=sua_chave_api_asaas
ASAAS_CUSTOMER_ID=id_do_cliente_asaas

# Opcional: ambiente (sandbox ou produção)
ASAAS_ENVIRONMENT=sandbox

# Opcional: token enviado no header asaas-access-token pelo Asaas no webhook (recomendado em produção)
ASAAS_WEBHOOK_TOKEN=seu_token_secreto
```

## Endpoints

- **POST /payments/request** (autenticado): solicita pagamento (PIX, boleto ou cartão). Body: `{ "amount": number, "method": "pix" | "boleto" | "credit_card", "providerId?", "bookingId?" }`. Retorna QR/link conforme o método.
- **POST /asaas/webhooks/payments** (público): webhook do Asaas. Configure no painel Asaas a URL (ex: `https://seu-dominio.com/asaas/webhooks/payments`). Se `ASAAS_WEBHOOK_TOKEN` estiver definido, o header `asaas-access-token` deve ser enviado.

## Webhook em desenvolvimento

Use um túnel (ngrok, localtunnel) para expor o backend e configurar a URL no painel do Asaas.
