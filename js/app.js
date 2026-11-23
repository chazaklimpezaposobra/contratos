// Formulário → PDF do contrato (tudo roda no navegador; nada é enviado para servidor).
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var form = $('#f'), frame = $('#frame'), status = $('#status');
  var RASCUNHO = 'chazak-contrato-rascunho';
  var fontes = null, logo = null;

  // ---------- fontes e logo para o PDF ----------
  function toB64(buf) { var b = new Uint8Array(buf), s = '', k = 0x8000; for (var i = 0; i < b.length; i += k) s += String.fromCharCode.apply(null, b.subarray(i, i + k)); return btoa(s); }
  function carregar() {
    var arq = ['Regular', 'SemiBold', 'ExtraBold'];
    return Promise.all(arq.map(function (n) { return fetch('fonts/Poppins-' + n + '.ttf').then(function (r) { return r.arrayBuffer(); }); }))
      .then(function (bufs) {
        var vfs = {}; arq.forEach(function (n, i) { vfs['Poppins-' + n + '.ttf'] = toB64(bufs[i]); });
        fontes = { vfs: vfs, fonts: {
          Poppins: { normal: 'Poppins-Regular.ttf', bold: 'Poppins-SemiBold.ttf', italics: 'Poppins-Regular.ttf', bolditalics: 'Poppins-SemiBold.ttf' },
          PoppinsXB: { normal: 'Poppins-ExtraBold.ttf', bold: 'Poppins-ExtraBold.ttf', italics: 'Poppins-ExtraBold.ttf', bolditalics: 'Poppins-ExtraBold.ttf' }
        } };
        return fetch('img/logo-chazak-preto.png').then(function (r) { return r.blob(); });
      })
      .then(function (blob) { return new Promise(function (ok) { var fr = new FileReader(); fr.onload = function () { logo = fr.result; ok(); }; fr.readAsDataURL(blob); }); });
  }

  // ---------- máscaras e valores ----------
  function soDig(v) { return (v || '').replace(/\D/g, ''); }
  var mask = {
    doc: function (v) { var d = soDig(v).slice(0, 14);
      if (d.length <= 11) return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      return d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2'); },
    tel: function (v) { var d = soDig(v).slice(0, 11); if (d.length <= 10) return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2'); return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2'); },
    cep: function (v) { return soDig(v).slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2'); }
  };
  $$('[data-mask]').forEach(function (el) { el.addEventListener('input', function () { el.value = mask[el.dataset.mask](el.value); }); });
  function valorNum() { var v = ($('#valor').value || '').replace(/[^\d,.]/g, ''); if (v.indexOf(',') >= 0) v = v.replace(/\./g, '').replace(',', '.'); var n = parseFloat(v); return isNaN(n) ? 0 : n; }
  function atualizaValores() {
    var v = valorNum(), m = Math.round(v * 50) / 100;
    $('#v1').textContent = window.brl(m); $('#v2').textContent = window.brl(Math.round((v - m) * 100) / 100);
    $('#vExt').textContent = v ? 'Por extenso: ' + window.extenso(v) + '.' : '';
  }
  $('#valor').addEventListener('input', atualizaValores);
  $('#valor').addEventListener('blur', function () { var v = valorNum(); if (v) this.value = v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); });

  // ---------- escopo ----------
  function addAmb(a) {
    var box = document.createElement('div'); box.className = 'amb' + (a.ativo ? '' : ' off');
    var head = document.createElement('div'); head.className = 'amb-head';
    var chk = document.createElement('input'); chk.type = 'checkbox'; chk.checked = !!a.ativo; chk.setAttribute('aria-label', 'Incluir ambiente');
    var nome = document.createElement('input'); nome.type = 'text'; nome.value = a.ambiente; nome.setAttribute('aria-label', 'Nome do ambiente');
    var del = document.createElement('button'); del.type = 'button'; del.className = 'icon-btn'; del.setAttribute('aria-label', 'Remover ambiente');
    del.innerHTML = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
    var ta = document.createElement('textarea'); ta.value = (a.itens || []).join('\n'); ta.setAttribute('aria-label', 'Itens do ambiente, um por linha'); ta.rows = Math.max(3, (a.itens || []).length);
    chk.addEventListener('change', function () { box.classList.toggle('off', !chk.checked); agenda(); });
    del.addEventListener('click', function () { box.remove(); agenda(); });
    head.appendChild(chk); head.appendChild(nome); head.appendChild(del); box.appendChild(head); box.appendChild(ta);
    $('#escopo').appendChild(box);
    return box;
  }
  $('#btn-amb').addEventListener('click', function () { var b = addAmb({ ambiente: 'Novo ambiente', ativo: true, itens: [] }); var i = $('input[type=text]', b); i.focus(); i.select(); });

  // ---------- CEP → endereço (ViaCEP) ----------
  var ultimoCep = '';
  function buscaCep() {
    var cep = soDig($('#cep').value), st = $('#cepStatus');
    if (cep.length !== 8) { if (!cep.length) st.textContent = 'Preenche o endereço sozinho'; return; }
    if (cep === ultimoCep) return; ultimoCep = cep;
    st.textContent = 'Buscando endereço…';
    fetch('https://viacep.com.br/ws/' + cep + '/json/')
      .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
      .then(function (e) {
        if (e.erro) { st.textContent = 'CEP não encontrado — preencha o endereço à mão.'; return; }
        var F = form.elements;
        if (e.logradouro) F.logradouro.value = e.logradouro;
        if (e.bairro) F.bairro.value = e.bairro;
        if (e.localidade) F.cidade.value = e.localidade;
        if (e.uf) F.uf.value = e.uf;
        ['logradouro', 'cidade'].forEach(function (n) { if (F[n].value.trim()) F[n].classList.remove('invalid'); });
        st.textContent = 'Endereço preenchido. Confira e coloque o número.';
        F.numeroEnd.focus(); agenda();
      })
      .catch(function () { ultimoCep = ''; st.textContent = 'Sem conexão com a busca de CEP — preencha à mão.'; });
  }
  $('#cep').addEventListener('input', buscaCep);

  // ---------- tipo de serviço "outro" ----------
  $('#tipoServico').addEventListener('change', function () { $('#outroWrap').hidden = this.value !== '__outro'; });

  // ---------- coleta ----------
  function v(n) { var el = form.elements[n]; return el ? (el.value || '').trim() : ''; }
  function coletar() {
    var ts = v('tipoServico') === '__outro' ? v('tipoOutro') : v('tipoServico');
    return {
      numero: v('numero'),
      cliente: { nome: v('nome'), doc: v('doc'), telefone: v('telefone'), email: v('email'), cep: v('cep'), logradouro: v('logradouro'), numero: v('numeroEnd'), complemento: v('complemento'), bairro: v('bairro'), cidade: v('cidade'), uf: v('uf').toUpperCase() },
      servico: { tipoServico: ts, tipoImovel: v('tipoImovel'), area: v('area'), inicio: v('inicio'), prazoDias: v('prazoDias'), equipe: v('equipe') },
      escopo: $$('#escopo .amb').filter(function (b) { return $('input[type=checkbox]', b).checked; }).map(function (b) {
        return { ambiente: $('input[type=text]', b).value.trim() || 'Ambiente', itens: $('textarea', b).value.split('\n').map(function (s) { return s.replace(/^[•\-\s]+/, '').trim(); }).filter(Boolean) };
      }),
      valor: valorNum(),
      formas: $$('#formas input:checked').map(function (c) { return c.value; }),
      observacoes: form.elements.observacoes.value,
      assinatura: { cidade: v('assCidade'), data: v('assData') },
      testemunhas: form.elements.testemunhas.checked
    };
  }

  // ---------- rascunho (só neste navegador) ----------
  function salvar() {
    try {
      var d = { campos: {}, escopo: $$('#escopo .amb').map(function (b) { return { ambiente: $('input[type=text]', b).value, ativo: $('input[type=checkbox]', b).checked, itens: $('textarea', b).value.split('\n') }; }), formas: $$('#formas input').map(function (c) { return c.checked; }) };
      $$('input[name], select[name], textarea[name]', form).forEach(function (el) { d.campos[el.name] = el.type === 'checkbox' ? el.checked : el.value; });
      localStorage.setItem(RASCUNHO, JSON.stringify(d));
    } catch (e) {}
  }
  function restaurar() {
    var d = null; try { d = JSON.parse(localStorage.getItem(RASCUNHO) || 'null'); } catch (e) {}
    if (!d) return false;
    Object.keys(d.campos || {}).forEach(function (k) { var el = form.elements[k]; if (!el) return; if (el.type === 'checkbox') el.checked = !!d.campos[k]; else el.value = d.campos[k]; });
    (d.escopo || []).forEach(function (a) { addAmb({ ambiente: a.ambiente, ativo: a.ativo, itens: (a.itens || []).filter(function (s) { return s.trim(); }) }); });
    $$('#formas input').forEach(function (c, i) { if (d.formas && i < d.formas.length) c.checked = d.formas[i]; });
    $('#outroWrap').hidden = $('#tipoServico').value !== '__outro';
    return true;
  }
  function hojeISO() { var t = new Date(); t.setMinutes(t.getMinutes() - t.getTimezoneOffset()); return t.toISOString().slice(0, 10); }
  // CHZ + dia, mês e ano do dia em que o contrato é feito. Ex.: CHZ-23112026
  function novoNumero() { var t = new Date(), z = function (n) { return String(n).padStart(2, '0'); }; return 'CHZ-' + z(t.getDate()) + z(t.getMonth() + 1) + t.getFullYear(); }
  // ---------- número do contrato: automático ou editado com o lápis ----------
  function numeroModo(manual) {
    var n = $('#numero');
    $('#numeroManual').value = manual ? '1' : '';
    n.readOnly = !manual;
    if (!manual || !n.value.trim()) n.value = novoNumero();
    $('#btn-editnum').hidden = manual; $('#btn-autonum').hidden = !manual;
    $('#numHint').textContent = manual ? 'Editado à mão — a seta volta para o automático' : 'Automático: CHZ + dia, mês e ano de hoje';
  }
  $('#btn-editnum').addEventListener('click', function () { numeroModo(true); var n = $('#numero'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); salvar(); });
  $('#btn-autonum').addEventListener('click', function () { numeroModo(false); agenda(); $('#btn-editnum').focus(); });

  function padrao() {
    form.reset(); $('#escopo').innerHTML = '';
    window.ESCOPO_PADRAO.forEach(addAmb);
    numeroModo(false); $('#assData').value = hojeISO(); $('#assCidade').value = window.CHAZAK.cidadeUF;
    form.elements.uf.value = 'SP'; $('#outroWrap').hidden = true;
    $$('.invalid').forEach(function (el) { el.classList.remove('invalid'); });
  }
  $('#btn-novo').addEventListener('click', function () {
    if (!confirm('Começar um contrato novo? Os dados preenchidos agora serão apagados.')) return;
    try { localStorage.removeItem(RASCUNHO); } catch (e) {}
    padrao(); atualizaValores(); gerarPrevia();
  });

  // ---------- validação ----------
  function validar() {
    var falta = [];
    $$('[data-req]', form).forEach(function (el) { var ok = !!el.value.trim(); el.classList.toggle('invalid', !ok); if (!ok) falta.push(el); });
    var vOk = valorNum() > 0; $('#valor').classList.toggle('invalid', !vOk); if (!vOk && falta.indexOf($('#valor')) < 0) falta.push($('#valor'));
    return falta;
  }
  $$('[data-req]', form).forEach(function (el) { el.addEventListener('input', function () { if (el.value.trim()) el.classList.remove('invalid'); }); });

  // ---------- PDF ----------
  function pdf() { return pdfMake.createPdf(window.montarContrato(coletar(), logo), null, fontes.fonts, fontes.vfs); }
  var urlAtual = null;
  function gerarPrevia() {
    if (!fontes) return;
    status.textContent = 'gerando…';
    pdf().getBlob(function (blob) {
      if (urlAtual) URL.revokeObjectURL(urlAtual);
      urlAtual = URL.createObjectURL(blob); frame.src = urlAtual + '#toolbar=1&navpanes=0';
      status.textContent = 'atualizada às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    });
  }
  var t = null;
  function agenda() { salvar(); clearTimeout(t); t = setTimeout(gerarPrevia, 900); }
  form.addEventListener('input', agenda); form.addEventListener('change', agenda);
  $('#btn-prev').addEventListener('click', gerarPrevia);

  function nomeArquivo() {
    var d = coletar(), n = (d.cliente.nome || 'cliente').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '_').replace(/^_|_$/g, '');
    return 'Contrato_Chazak_' + n + '_' + (d.numero || '').replace(/[^\w-]/g, '') + '.pdf';
  }
  function baixar() {
    var falta = validar();
    if (falta.length && !confirm('Faltam ' + falta.length + ' campo(s) obrigatório(s) (marcados em vermelho). Baixar mesmo assim, com espaços em branco?')) { falta[0].focus(); return; }
    pdf().download(nomeArquivo());
  }
  $('#btn-baixar').addEventListener('click', baixar); $('#btn-baixar2').addEventListener('click', baixar);

  // ---------- aviso de dados da Chazak ainda não preenchidos ----------
  var pend = Object.keys(window.CHAZAK).filter(function (k) { return /^\[.*\]$/.test(window.CHAZAK[k]); });
  if (pend.length) { var av = $('#aviso-dados'); av.hidden = false;
    av.innerHTML = '<strong>Dados da Chazak a completar:</strong> ' + pend.map(function (k) { return window.CHAZAK[k].replace(/[\[\]]/g, '').toLowerCase(); }).join(', ') + '. Eles ficam no arquivo <code>js/dados-chazak.js</code> e saem entre colchetes no contrato até serem preenchidos.'; }

  // ---------- início ----------
  if (!restaurar()) padrao();
  // número automático, a menos que tenha sido editado à mão (lápis)
  numeroModo($('#numeroManual').value === '1');
  atualizaValores();
  carregar().then(gerarPrevia).catch(function (e) { status.textContent = 'erro ao carregar fontes: ' + e.message; });
})();
