# Contratos Chazak

Gerador de contratos de prestação de serviços da **Chazak Limpeza Pós-Obra**.
Preencha o formulário e baixe o contrato pronto em PDF.

**Usar:** https://chazaklimpezaposobra.github.io/contratos/

## Como funciona

- Tudo roda no navegador. **Nenhum dado de cliente é enviado ou salvo neste repositório.**
- O que você digita fica guardado só no navegador do aparelho (rascunho), até clicar em **Novo contrato**.
- O PDF sai com o logo, os dados fixos da Chazak e as cláusulas, incluindo:
  - pagamento de **50% de adiantamento** na assinatura e **50% na finalização**;
  - **alterações** pedidas após a assinatura e o início dos serviços são **somadas ao pagamento final**.

## Onde mudar cada coisa

| O quê | Arquivo |
|---|---|
| Dados da Chazak (razão social, CNPJ, endereço, telefone, foro) | `js/dados-chazak.js` |
| Ambientes e itens sugeridos no escopo | `js/dados-chazak.js` (`ESCOPO_PADRAO`) |
| Texto das cláusulas e layout do PDF | `js/contrato.js` |
| Formulário | `index.html` e `js/app.js` |

> O texto do contrato é um modelo. Vale uma revisão por um advogado antes do uso definitivo.
