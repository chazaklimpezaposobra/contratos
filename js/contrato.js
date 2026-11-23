// Monta o contrato (definição do pdfmake) a partir dos dados do formulário.
(function () {
  var LIME = '#B5FB13', INK = '#0D0D0D', GRAY = '#555555', SOFT = '#F3F3F1', LINE = '#D9D9D6';

  // ---------- utilidades ----------
  function brl(v) { return 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function dataBR(iso) { if (!iso) return '____/____/______'; var p = iso.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  function dataExtenso(iso) {
    var meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
    if (!iso) return '____ de ______________ de ______';
    var p = iso.split('-'); return Number(p[2]) + ' de ' + meses[Number(p[1]) - 1] + ' de ' + p[0];
  }
  function ou(v, vazio) { v = (v == null ? '' : String(v)).trim(); return v || (vazio || '______________________'); }

  // valor por extenso em reais
  function extenso(valor) {
    var u = ['','um','dois','três','quatro','cinco','seis','sete','oito','nove','dez','onze','doze','treze','quatorze','quinze','dezesseis','dezessete','dezoito','dezenove'];
    var d = ['','','vinte','trinta','quarenta','cinquenta','sessenta','setenta','oitenta','noventa'];
    var c = ['','cento','duzentos','trezentos','quatrocentos','quinhentos','seiscentos','setecentos','oitocentos','novecentos'];
    function ate999(n) {
      if (n === 0) return ''; if (n === 100) return 'cem';
      var s = [], ce = Math.floor(n / 100), r = n % 100;
      if (ce) s.push(c[ce]);
      if (r) { if (r < 20) s.push(u[r]); else { var de = Math.floor(r / 10), un = r % 10; s.push(un ? d[de] + ' e ' + u[un] : d[de]); } }
      return s.join(' e ');
    }
    function inteiro(n) {
      if (n === 0) return 'zero';
      var grupos = [], nomes = [['',''],['mil','mil'],['milhão','milhões'],['bilhão','bilhões']], i = 0;
      while (n > 0) { grupos.push(n % 1000); n = Math.floor(n / 1000); }
      var partes = [];
      for (i = grupos.length - 1; i >= 0; i--) {
        var g = grupos[i]; if (!g) continue;
        var t = (i === 1 && g === 1) ? 'mil' : ate999(g) + (i ? ' ' + nomes[i][g === 1 ? 0 : 1] : '');
        partes.push({ t: t, g: g });
      }
      var out = '';
      partes.forEach(function (p, k) {
        if (k === 0) out = p.t;
        else out += ((k === partes.length - 1 && (p.g < 100 || p.g % 100 === 0)) ? ' e ' : ' ') + p.t;
      });
      return out;
    }
    valor = Math.round(Number(valor || 0) * 100);
    var reais = Math.floor(valor / 100), cent = valor % 100, txt = '';
    if (reais) txt = inteiro(reais) + (reais === 1 ? ' real' : ((reais % 1000000 === 0) ? ' de reais' : ' reais'));
    if (cent) txt += (txt ? ' e ' : '') + inteiro(cent) + (cent === 1 ? ' centavo' : ' centavos');
    return txt || 'zero reais';
  }

  // ---------- blocos visuais ----------
  function titulo(n, t) {
    return { _titulo: true, margin: [0, 14, 0, 6], table: { widths: [4, '*'], body: [[{ text: '', fillColor: LIME }, { text: [{ text: 'CLÁUSULA ' + n + 'ª — ', color: GRAY }, t.toUpperCase()], style: 'clausula', margin: [8, 2, 0, 2] }]] }, layout: 'noBorders' };
  }
  function p(t, extra) { var o = { text: t, style: 'corpo', margin: [0, 0, 0, 6] }; if (extra) for (var k in extra) o[k] = extra[k]; return o; }
  function tabelaDados(linhas) {
    return {
      table: { widths: [130, '*'], body: linhas.map(function (l) {
        return [{ text: l[0].toUpperCase(), style: 'rotulo', fillColor: SOFT, margin: [8, 6, 8, 6] }, { text: l[1], style: 'corpo', alignment: 'left', margin: [8, 6, 8, 6] }];
      }) },
      layout: { hLineColor: function () { return LINE; }, vLineColor: function () { return LINE; }, hLineWidth: function () { return 0.7; }, vLineWidth: function () { return 0.7; } }
    };
  }
  function parte(rotulo, linhas) {
    return { stack: [{ text: rotulo, style: 'rotuloParte' }].concat(linhas.filter(Boolean).map(function (l) { return { text: l, style: 'corpo', alignment: 'left', margin: [0, 1, 0, 0] }; })), margin: [0, 0, 0, 0] };
  }

  window.montarContrato = function (d, logoDataUrl) {
    var C = window.CHAZAK, cli = d.cliente, s = d.servico;
    var endereco = [ou(cli.logradouro, '') + (cli.numero ? ', ' + cli.numero : ''), cli.complemento, cli.bairro, [cli.cidade, cli.uf].filter(Boolean).join('/'), cli.cep ? 'CEP ' + cli.cep : ''].filter(function (x) { return x && String(x).trim(); }).join(' — ');
    endereco = endereco || '______________________________________________';
    var metade = Math.round(Number(d.valor || 0) * 50) / 100, resto = Math.round((Number(d.valor || 0) - metade) * 100) / 100;
    var formas = (d.formas && d.formas.length) ? d.formas.join(', ').replace(/, ([^,]*)$/, ' ou $1') : '______________________';
    var prazo = s.prazoDias ? (s.prazoDias + (Number(s.prazoDias) === 1 ? ' dia' : ' dias')) : '____ dia(s)';
    var escopo = (d.escopo || []).filter(function (a) { return a.itens && a.itens.length; });

    var content = [];
    // cabeçalho
    content.push({
      columns: [
        logoDataUrl ? { image: logoDataUrl, width: 150 } : { text: 'CHAZAK', style: 'h1', width: 150 },
        { width: '*', stack: [
          { text: 'CONTRATO Nº', style: 'rotulo', alignment: 'right' },
          { text: ou(d.numero, '—'), style: 'numero', alignment: 'right' },
          { text: 'WhatsApp ' + C.telefone, style: 'pequeno', alignment: 'right', margin: [0, 6, 0, 0] }
        ] }
      ]
    });
    content.push({ canvas: [{ type: 'rect', x: 0, y: 0, w: 495, h: 4, color: LIME }], margin: [0, 14, 0, 16] });
    content.push({ text: 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS', style: 'h1' });
    content.push({ text: ou(s.tipoServico, 'Limpeza pós-obra'), style: 'sub', margin: [0, 2, 0, 16] });

    // partes
    content.push({ columns: [
      parte('CONTRATADA', [
        { text: C.razaoSocial, bold: true },
        'Nome fantasia: ' + C.nomeFantasia,
        'CNPJ: ' + C.cnpj,
        C.endereco,
        'Telefone/WhatsApp: ' + C.telefone,
        C.email ? 'E-mail: ' + C.email : null
      ]),
      parte('CONTRATANTE', [
        { text: ou(cli.nome), bold: true },
        (cli.doc && cli.doc.replace(/\D/g, '').length > 11 ? 'CNPJ: ' : (cli.doc && cli.doc.replace(/\D/g, '').length === 11 ? 'CPF: ' : 'CPF/CNPJ: ')) + ou(cli.doc),
        'Telefone: ' + ou(cli.telefone),
        // e-mail não tem espaço para quebrar linha: diminui a letra se for muito comprido
        cli.email ? { text: 'E-mail: ' + cli.email, fontSize: Math.min(9.5, 228 / (('E-mail: ' + cli.email).length * 0.5)) } : null
      ])
    ], columnGap: 24, margin: [0, 0, 0, 14] });
    content.push(p('As partes acima identificadas têm entre si justo e contratado o presente Contrato de Prestação de Serviços, que se regerá pelas cláusulas e condições a seguir.'));

    // resumo
    content.push({ text: 'RESUMO DO SERVIÇO', style: 'secao', margin: [0, 8, 0, 6] });
    content.push(tabelaDados([
      ['Local do serviço', endereco],
      ['Tipo de imóvel', ou(s.tipoImovel)],
      ['Tipo de serviço', ou(s.tipoServico)],
      ['Área aproximada', s.area ? s.area + ' m²' : '______ m²'],
      ['Início previsto', dataBR(s.inicio)],
      ['Prazo estimado', prazo + (s.equipe ? ' — equipe de ' + s.equipe + (Number(s.equipe) === 1 ? ' profissional' : ' profissionais') : '')],
      ['Valor total', brl(d.valor)]
    ]));

    var n = 1;
    // 1 objeto
    content.push(titulo(n++, 'Do objeto'));
    content.push(p('O presente contrato tem por objeto a prestação, pela CONTRATADA, de serviços de ' + ou(s.tipoServico, 'limpeza pós-obra').toLowerCase() + ' no imóvel ' + ou(s.tipoImovel, '').toLowerCase() + ' localizado em ' + endereco + ', com área aproximada de ' + (s.area ? s.area + ' m²' : '____ m²') + ', conforme o escopo descrito na cláusula seguinte.'));

    // 2 escopo
    content.push(titulo(n++, 'Do escopo dos serviços'));
    if (escopo.length) {
      content.push(p('Estão incluídos neste contrato os seguintes serviços:'));
      escopo.forEach(function (a) {
        content.push({ text: a.ambiente, style: 'ambiente', margin: [0, 4, 0, 2] });
        content.push({ ul: a.itens, style: 'corpo', alignment: 'left', margin: [8, 0, 0, 4], markerColor: INK });
      });
    } else content.push(p('______________________________________________________________________'));
    content.push(p('Parágrafo único. Serviços não descritos acima não estão incluídos neste contrato. A CONTRATADA utilizará produtos e técnicas adequados a cada tipo de superfície e acabamento.', { margin: [0, 6, 0, 6] }));

    // 3 prazo
    content.push(titulo(n++, 'Do prazo'));
    content.push(p('Os serviços terão início previsto em ' + dataBR(s.inicio) + ', com prazo estimado de conclusão de ' + prazo + ', conforme as condições do imóvel e o escopo descrito neste contrato.'));
    content.push(p('Parágrafo único. O prazo poderá ser prorrogado em caso de falta de acesso ao imóvel, falta de água ou energia elétrica, presença de outras equipes ou obra em andamento no local, ou alterações no serviço solicitadas pelo CONTRATANTE.'));

    // 4 valor e pagamento
    content.push(titulo(n++, 'Do valor e das condições de pagamento'));
    content.push(p([ 'Pelos serviços contratados, o CONTRATANTE pagará à CONTRATADA o valor total de ', { text: brl(d.valor), bold: true }, ' (' + extenso(d.valor) + '), da seguinte forma:' ]));
    content.push({ table: { widths: ['*', 110], body: [
      [{ text: 'PARCELA', style: 'rotulo', fillColor: SOFT, margin: [8, 5, 8, 5] }, { text: 'VALOR', style: 'rotulo', fillColor: SOFT, alignment: 'right', margin: [8, 5, 8, 5] }],
      [{ text: [{ text: '50% de adiantamento', bold: true }, ', na assinatura deste contrato'], style: 'corpo', margin: [8, 5, 8, 5] }, { text: brl(metade), style: 'corpo', bold: true, alignment: 'right', margin: [8, 5, 8, 5] }],
      [{ text: [{ text: '50% restantes', bold: true }, ', na finalização dos serviços'], style: 'corpo', margin: [8, 5, 8, 5] }, { text: brl(resto), style: 'corpo', bold: true, alignment: 'right', margin: [8, 5, 8, 5] }]
    ] }, layout: { hLineColor: function () { return LINE; }, vLineColor: function () { return LINE; }, hLineWidth: function () { return 0.7; }, vLineWidth: function () { return 0.7; } }, margin: [0, 2, 0, 8] });
    content.push(p('Formas de pagamento aceitas: ' + formas + '.'));
    content.push(p('Parágrafo único. Os serviços serão iniciados após a confirmação do pagamento do adiantamento. O pagamento final deverá ser feito na entrega do serviço, após a vistoria prevista neste contrato.'));

    // 5 alterações (cláusula pedida)
    content.push(titulo(n++, 'Das alterações no serviço'));
    content.push(p([ 'Qualquer alteração ou acréscimo na limpeza solicitado pelo CONTRATANTE ', { text: 'após a assinatura deste contrato e o início dos serviços', bold: true }, ' será orçado pela CONTRATADA e, uma vez aprovado pelo CONTRATANTE, ', { text: 'o valor correspondente será acrescentado ao pagamento final', bold: true }, ', junto com a parcela de 50% devida na finalização.' ]));
    content.push(p('Parágrafo único. Alterações que aumentem o tempo de execução também poderão alterar o prazo previsto na cláusula 3ª.'));

    // 6 obrigações contratada
    content.push(titulo(n++, 'Das obrigações da CONTRATADA'));
    content.push({ ol: [
      'Executar os serviços com equipe treinada, produtos e equipamentos próprios e adequados a cada superfície;',
      'Zelar pelo imóvel e pelos acabamentos durante a execução, comunicando ao CONTRATANTE qualquer dano ou defeito preexistente encontrado;',
      'Cumprir o escopo e o prazo acordados, informando o CONTRATANTE sobre qualquer imprevisto.'
    ], type: 'lower-alpha', style: 'corpo', margin: [8, 0, 0, 6] });

    // 7 obrigações contratante
    content.push(titulo(n++, 'Das obrigações do CONTRATANTE'));
    content.push({ ol: [
      'Garantir o acesso da equipe ao imóvel nas datas e horários combinados;',
      'Disponibilizar água e energia elétrica no local durante a execução dos serviços;',
      'Informar previamente à CONTRATADA sobre superfícies, materiais ou objetos que exijam cuidado especial;',
      'Efetuar os pagamentos nos valores e prazos previstos neste contrato.'
    ], type: 'lower-alpha', style: 'corpo', margin: [8, 0, 0, 6] });

    // 8 entrega
    content.push(titulo(n++, 'Da entrega e vistoria'));
    content.push(p('Ao final dos serviços, o CONTRATANTE, ou pessoa por ele indicada, fará a vistoria do imóvel junto com a CONTRATADA. Ajustes apontados no ato da vistoria, dentro do escopo contratado, serão realizados sem custo adicional.'));

    // 9 cancelamento
    content.push(titulo(n++, 'Do cancelamento'));
    content.push(p('Em caso de desistência do CONTRATANTE após o início dos serviços, será devido o valor proporcional aos serviços já executados, sendo o adiantamento utilizado para esse fim. Cancelamentos ou remarcações antes do início deverão ser comunicados com, no mínimo, 48 (quarenta e oito) horas de antecedência.'));

    // observações
    if (d.observacoes && d.observacoes.trim()) {
      content.push(titulo(n++, 'Das condições específicas'));
      d.observacoes.split(/\n+/).forEach(function (l) { if (l.trim()) content.push(p(l.trim())); });
    }

    // foro
    content.push(titulo(n++, 'Do foro'));
    content.push(p('As partes elegem o foro da Comarca de ' + C.foro + ' para dirimir quaisquer dúvidas oriundas deste contrato. E, por estarem justas e contratadas, assinam o presente em 2 (duas) vias de igual teor.'));

    // assinaturas
    function assinatura(nome, papel, doc) {
      return { stack: [
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 220, y2: 0, lineWidth: 0.8, lineColor: INK }], margin: [0, 40, 0, 4] },
        { text: nome, style: 'corpo', alignment: 'left', bold: true },
        { text: papel + (doc ? '  •  ' + doc : ''), style: 'pequeno' }
      ] };
    }
    var ass = [
      { text: ou(d.assinatura.cidade, C.cidadeUF) + ', ' + dataExtenso(d.assinatura.data) + '.', style: 'corpo', margin: [0, 18, 0, 0] },
      { columns: [assinatura(ou(cli.nome), 'CONTRATANTE', cli.doc), assinatura(C.razaoSocial, 'CONTRATADA', 'CNPJ ' + C.cnpj)], columnGap: 40 }
    ];
    if (d.testemunhas) ass.push({ columns: [assinatura('Testemunha 1', 'Nome / CPF', ''), assinatura('Testemunha 2', 'Nome / CPF', '')], columnGap: 40 });
    content.push({ stack: ass, unbreakable: true });

    // título de cláusula nunca fica sozinho no fim da página: vai junto com o bloco seguinte
    var final = [];
    for (var i = 0; i < content.length; i++) {
      var el = content[i];
      if (el._titulo && i + 1 < content.length) {
        delete el._titulo;
        var prox = content[++i], grupo = [el, prox];
        // no escopo, leva também o primeiro ambiente
        if (prox.text === 'Estão incluídos neste contrato os seguintes serviços:' && content[i + 1] && content[i + 2]) { grupo.push(content[++i], content[++i]); }
        final.push({ stack: grupo, unbreakable: true });
      } else { delete el._titulo; final.push(el); }
    }
    content = final;

    return {
      pageSize: 'A4',
      pageMargins: [50, 50, 50, 60],
      info: { title: 'Contrato ' + (d.numero || '') + ' — ' + (cli.nome || ''), author: C.nomeFantasia, subject: 'Contrato de prestação de serviços de limpeza pós-obra' },
      content: content,
      footer: function (page, pages) {
        return { margin: [50, 18, 50, 0], columns: [
          { text: C.nomeFantasia + '  •  ' + C.telefone, style: 'pequeno' },
          { text: 'Contrato ' + ou(d.numero, '') + '  •  página ' + page + ' de ' + pages, style: 'pequeno', alignment: 'right' }
        ] };
      },
      defaultStyle: { font: 'Poppins', fontSize: 9.5, color: INK, lineHeight: 1.25 },
      styles: {
        h1: { font: 'PoppinsXB', fontSize: 19, characterSpacing: -0.2 },
        sub: { fontSize: 10.5, color: GRAY },
        numero: { font: 'PoppinsXB', fontSize: 13 },
        secao: { font: 'PoppinsXB', fontSize: 11 },
        clausula: { font: 'PoppinsXB', fontSize: 10 },
        ambiente: { bold: true, fontSize: 10 },
        rotulo: { bold: true, fontSize: 8, characterSpacing: 0.6, color: INK },
        rotuloParte: { font: 'PoppinsXB', fontSize: 8.5, characterSpacing: 1, color: GRAY, margin: [0, 0, 0, 3] },
        corpo: { fontSize: 9.5, alignment: 'justify' },
        pequeno: { fontSize: 7.5, color: GRAY }
      }
    };
  };
  window.brl = brl; window.extenso = extenso;
})();
