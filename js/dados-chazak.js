// =====================================================================
//  DADOS FIXOS DA CHAZAK — aparecem em todos os contratos.
//  Para alterar, edite só os textos entre aspas.
//  Campos entre [colchetes] ainda precisam ser preenchidos.
// =====================================================================
window.CHAZAK = {
  nomeFantasia: 'Chazak Limpeza Pós-Obra',
  razaoSocial:  '[RAZÃO SOCIAL]',
  cnpj:         '[CNPJ]',
  endereco:     '[ENDEREÇO COMPLETO DA EMPRESA]',
  cidadeUF:     'Jundiaí/SP',
  responsavel:  '[NOME DO RESPONSÁVEL]',
  telefone:     '(11) 93085-3352',
  email:        '',
  site:         'chazaklimpezaposobra.github.io',
  foro:         'Jundiaí/SP'   // comarca do foro do contrato
};

// Ambientes e itens que já vêm sugeridos no formulário (dá para editar em cada contrato).
window.ESCOPO_PADRAO = [
  { ambiente: 'Quartos', ativo: true, itens: [
    'Limpeza completa dos quartos',
    'Limpeza interna e externa dos guarda-roupas, conforme acesso e condições do mobiliário',
    'Limpeza de sapateiras',
    'Limpeza de janelas, vidros e esquadrias',
    'Limpeza e acabamento dos pisos'
  ]},
  { ambiente: 'Banheiros', ativo: true, itens: [
    'Limpeza de azulejos e rejuntes',
    'Limpeza de pisos',
    'Remoção de limo, cimento e sujeiras acumuladas',
    'Limpeza de louças, metais e box',
    'Limpeza geral das superfícies do ambiente'
  ]},
  { ambiente: 'Cozinha', ativo: true, itens: [
    'Limpeza interna e externa de armários',
    'Limpeza de azulejos',
    'Limpeza de bancadas e pias',
    'Limpeza do fogão',
    'Limpeza geral das superfícies e piso'
  ]},
  { ambiente: 'Sala', ativo: true, itens: [
    'Limpeza de janelas, vidros e esquadrias',
    'Limpeza de pisos',
    'Limpeza de armários e móveis planejados',
    'Limpeza geral do ambiente'
  ]},
  { ambiente: 'Área de serviço', ativo: false, itens: [
    'Limpeza de tanque, bancadas e armários',
    'Limpeza de pisos e azulejos'
  ]},
  { ambiente: 'Área externa / varanda', ativo: false, itens: [
    'Lavagem de pisos externos',
    'Limpeza de guarda-corpos e vidros',
    'Remoção de respingos de tinta e cimento'
  ]},
  { ambiente: 'Limpeza grossa (geral)', ativo: false, itens: [
    'Remoção de entulho leve, pó pesado e restos de obra',
    'Remoção de respingos de cimento, massa e tinta'
  ]}
];
