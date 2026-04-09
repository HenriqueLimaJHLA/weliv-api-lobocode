#!/bin/bash

echo "🔍 Testando configuração do Nginx..."
echo "=================================="

# Testar sintaxe da configuração
echo "1. Testando sintaxe da configuração..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuração válida!"
else
    echo "❌ Erro na configuração!"
    exit 1
fi

echo ""
echo "2. Verificando se o Nginx está rodando..."
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx está rodando"
else
    echo "❌ Nginx não está rodando"
    echo "   Para iniciar: sudo systemctl start nginx"
fi

echo ""
echo "3. Verificando portas em uso..."
echo "   Porta 80 (HTTP):"
netstat -tlnp | grep :80 || echo "   ❌ Porta 80 não está em uso"
echo "   Porta 443 (HTTPS):"
netstat -tlnp | grep :443 || echo "   ❌ Porta 443 não está em uso"

echo ""
echo "4. Verificando serviços..."
echo "   Frontend (porta 42100 - weliv):"
netstat -tlnp | grep :42100 || echo "   ❌ Angular não está rodando na porta 42100"
echo "   Backend (porta 30100 - weliv):"
netstat -tlnp | grep :30100 || echo "   ❌ NestJS não está rodando na porta 30100"

echo ""
echo "5. Testando conectividade..."
echo "   Testando localhost:30100 (backend weliv)..."
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:30100/health || echo "   ❌ Backend não responde"

echo "   Testando localhost:42100 (frontend weliv)..."
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:42100 || echo "   ❌ Frontend não responde"

echo ""
echo "6. Verificando certificados SSL..."
if [ -f "/etc/letsencrypt/live/api.weliv.com.br/fullchain.pem" ]; then
    echo "✅ Certificado SSL para api.weliv.com.br encontrado"
else
    echo "❌ Certificado SSL para api.weliv.com.br não encontrado"
fi

if [ -f "/etc/letsencrypt/live/api.api.weliv.com.br/fullchain.pem" ]; then
    echo "✅ Certificado SSL para api.api.weliv.com.br encontrado"
else
    echo "❌ Certificado SSL para api.api.weliv.com.br não encontrado"
fi

echo ""
echo "🎯 Próximos passos:"
echo "1. Certifique-se de que o Angular está rodando na porta 42100 (weliv)"
echo "2. Certifique-se de que o NestJS está rodando na porta 30100 (weliv)"
echo "3. Reinicie o Nginx: sudo systemctl reload nginx"
echo "4. Teste acessando: https://api.weliv.com.br"
echo "5. Teste a API: https://api.weliv.com.br/api/health"
