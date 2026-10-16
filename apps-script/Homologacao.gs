// =====================================================================================
// Pier Gestão — CARGA DA HOMOLOGAÇÃO (somente para a planilha "PIER GESTÃO - HOMOLOGAÇÃO")
//
// Este arquivo NUNCA deve ser colado no Apps Script da planilha oficial.
// Ele troca os dados operacionais copiados da oficial por dados fictícios:
//   - esvazia Itens, Movimentacoes, Emprestimos, Contagens, OS, Demandas, Preventivas,
//     Pendencias, Auditoria e Acessos (fica só o cabeçalho; formatos, validações e proteções ficam);
//   - apaga as abas ocultas "Itens (cópia de …)";
//   - troca as listas de locais da aba Config por locais fictícios;
//   - cadastra 3 materiais fictícios com saldo inicial (Ajuste "Saldo inicial da carga de homologação");
//   - zera o estado interno do sistema (retrato de saldos, bloqueios, sessões…) sem tocar no segredo das senhas.
// Não altera Usuarios, Perfis, as pastas configuradas nem nenhum arquivo do Drive.
//
// Uso (pelo editor do Apps Script, nunca pelo site):
//   1. simularCargaHomologacao()   -> só lê, confere tudo e mostra no registro um código de confirmação (vale 15 min);
//   2. copie o código para a propriedade do script CONFIRMAR_CARGA;
//   3. executarCargaHomologacao()  -> confere tudo de novo e só então limpa e carrega.
// Travas: ID diferente da oficial, nome com "HOMOLOGAÇÃO", propriedade AMBIENTE = homologacao,
// propriedade HOMOLOG_PLANILHA_ID = ID desta planilha, contas só de teste, código de confirmação.
// Depois de concluída, a marca HOMOLOG_CARGA_FEITA impede uma segunda execução.
// Se parar no meio, simule e execute de novo: a rotina limpa tudo antes de carregar, sem duplicar nada.
// =====================================================================================

const HMG = {
  validadeMin: 15,
  operacao: 'HMG-CARGA-INICIAL',
  autor: { id: '', usuario: 'carga.homologacao', nome: 'Carga de homologação', perfil: '' },
  // abas esvaziadas (fica o cabeçalho)
  limpar: ['itens', 'movs', 'emp', 'cont', 'os', 'dem', 'prev', 'pend', 'audit', 'acessos'],
  // contas permitidas na aba Usuarios
  contas: {
    'admin.teste1': { perfil: 'Administração', ativo: true },
    'admin.teste2': { perfil: 'Administração', ativo: true },
    'manut.teste': { perfil: 'Manutenção', ativo: true },
    'limpeza.teste': { perfil: 'Limpeza', ativo: false, opcional: true }
  },
  locais: {
    'Manutenção': ['Almoxarifado Teste', 'Área Técnica Teste', 'Oficina Teste'],
    'Limpeza': ['Almoxarifado Teste', 'Área Técnica Teste']
  },
  materiais: [
    { id: 'iHMG0001', codigo: 'MAN-0001', nome: '[TESTE] Lâmpada LED 9W', categoria: 'Iluminação', tipoItem: 'Peça de reposição', qtd: 20, minimo: 5 },
    { id: 'iHMG0002', codigo: 'MAN-0002', nome: '[TESTE] Fita isolante 19 mm', categoria: 'Elétrica', tipoItem: 'Consumível', qtd: 10, minimo: 3 },
    { id: 'iHMG0003', codigo: 'MAN-0003', nome: '[TESTE] Disjuntor 20A', categoria: 'Elétrica', tipoItem: 'Peça de reposição', qtd: 15, minimo: 4 }
  ],
  // propriedades do estado do sistema que são zeradas (prefixos); SEG_SEGREDO e PASTA_* nunca entram aqui
  zerarPrefixos: ['SALDOS_', 'BLOQ_', 'IMPORT_', 'SESS_', 'LOGIN_'],
  zerarChaves: ['CONT_APLICANDO', 'RECUP_ESTADO', 'RECUP_ALERTAS', 'PREVENTIVAS_DIA'],
  preservar: ['SEG_SEGREDO', 'PASTA_FOTOS_OS', 'PASTA_NF', 'AMBIENTE', 'HOMOLOG_PLANILHA_ID']
};

// ---------------- verificações (só leitura) ----------------

function hmgNorm(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase(); }

// as quatro travas de ambiente
function hmgTravas(ss, props) {
  const erros = [];
  const id = ss.getId();
  if (id === PLANILHA_OFICIAL) erros.push('Esta é a PLANILHA OFICIAL. Nada será feito aqui.');
  if (hmgNorm(ss.getName()).indexOf('HOMOLOGACAO') < 0) erros.push('O nome da planilha ("' + ss.getName() + '") não contém "HOMOLOGAÇÃO".');
  if (props.getProperty('AMBIENTE') !== 'homologacao') erros.push('A propriedade do script AMBIENTE não está definida como "homologacao".');
  if (props.getProperty('HOMOLOG_PLANILHA_ID') !== id) erros.push('A propriedade do script HOMOLOG_PLANILHA_ID não é igual ao ID desta planilha (' + id + ').');
  return erros;
}

// cabeçalhos de todas as abas do sistema, sem criar nem mudar nada
function hmgCabecalhos(ss) {
  const erros = [];
  Object.keys(ABAS).forEach(k => {
    const def = ABAS[k];
    const sh = ss.getSheetByName(def.nome);
    if (!sh) { erros.push('Falta a aba ' + def.nome + ' (rode autorizar antes).'); return; }
    const n = sh.getLastColumn();
    const head = n ? sh.getRange(1, 1, 1, n).getValues()[0].map(h => String(h).trim()) : [];
    const faltam = def.cols.filter(c => head.indexOf(c[1]) < 0).map(c => c[1]);
    if (faltam.length) erros.push('Aba ' + def.nome + ': faltam as colunas ' + faltam.join(', ') + ' (rode autorizar antes).');
  });
  return erros;
}

// Usuarios e Perfis: só contas de teste, senhas já protegidas, sem telefone, com ID fixo
function hmgContas(ss) {
  const erros = [], avisos = [], resumo = [];
  const shU = ss.getSheetByName('Usuarios');
  if (!shU) return { erros: ['Falta a aba Usuarios.'], avisos, resumo };
  const vals = shU.getDataRange().getValues();
  const head = vals[0].map(h => String(h).trim());
  const col = {};
  USUARIOS_CAB.concat(['Telefone', COL_ID_CONTA]).forEach(l => { col[l] = head.indexOf(l); });
  USUARIOS_CAB.forEach(l => { if (col[l] < 0) erros.push('Aba Usuarios: falta a coluna ' + l + '.'); });
  if (col[COL_ID_CONTA] < 0) erros.push('Aba Usuarios: falta a coluna ' + COL_ID_CONTA + ' (rode autorizar antes).');
  if (erros.length) return { erros, avisos, resumo };
  const vistos = {}, ids = {};
  for (let i = 1; i < vals.length; i++) {
    const r = vals[i];
    const bruto = String(r[col['Usuário']]).trim();
    if (!bruto) continue;
    const u = bruto.toLowerCase();
    const linha = 'Usuarios, linha ' + (i + 1);
    if (!/^[a-z0-9._@-]{2,40}$/.test(u)) {
      // texto de ajuda da própria aba (frase com espaços) não é login
      if (/\s/.test(bruto) && bruto.length > 40) continue;
      erros.push(linha + ': "' + bruto + '" não é um login válido (use letras minúsculas, números, ponto, traço, sublinhado ou @).'); continue;
    }
    const regra = HMG.contas[u];
    if (!regra) { erros.push(linha + ': o login "' + u + '" não está na lista de contas de teste permitidas.'); continue; }
    if (vistos[u]) { erros.push(linha + ': o login "' + u + '" aparece duas vezes.'); continue; }
    vistos[u] = true;
    const perfil = String(r[col['Perfil']]).trim();
    const ativo = String(r[col['Ativo']]).trim().toLowerCase().indexOf('n') !== 0;
    const senha = String(r[col['Senha']]).trim();
    const tel = col['Telefone'] >= 0 ? String(r[col['Telefone']]).replace(/\D/g, '') : '';
    const uid = String(r[col[COL_ID_CONTA]]).trim();
    if (regra.ativo && !ativo) erros.push(linha + ': "' + u + '" precisa estar ativo (Ativo = Sim).');
    if (!regra.ativo && ativo) erros.push(linha + ': "' + u + '" precisa estar desativado (Ativo = Não).');
    if (regra.ativo && perfil !== regra.perfil) erros.push(linha + ': "' + u + '" precisa ter o perfil ' + regra.perfil + ' (está "' + perfil + '").');
    if (!regra.ativo && perfil !== regra.perfil) avisos.push(linha + ': "' + u + '" está com o perfil "' + perfil + '"; o recomendado é ' + regra.perfil + '.');
    if (tel) erros.push(linha + ': "' + u + '" tem telefone preenchido. Apague para não enviar WhatsApp a ninguém.');
    if (senha && !ehHash(senha)) erros.push(linha + ': a senha de "' + u + '" ainda está em texto. Rode autorizar antes (ela vira código).');
    if (regra.ativo && !senha) erros.push(linha + ': "' + u + '" está sem senha.');
    if (!uid) erros.push(linha + ': "' + u + '" está sem ID da conta (rode autorizar antes).');
    else if (ids[uid]) erros.push(linha + ': ID da conta repetido em "' + u + '" e "' + ids[uid] + '".');
    else ids[uid] = u;
    resumo.push(u + ' (' + perfil + ', ' + (ativo ? 'ativo' : 'desativado') + ')');
  }
  Object.keys(HMG.contas).forEach(u => { if (!HMG.contas[u].opcional && !vistos[u]) erros.push('Falta a conta de teste "' + u + '" na aba Usuarios.'); });

  const shP = ss.getSheetByName('Perfis');
  if (!shP) erros.push('Falta a aba Perfis.');
  else {
    const pv = shP.getDataRange().getValues();
    const ph = pv[0].map(h => String(h).trim());
    const faltam = PERMISSOES.filter(p => ph.indexOf(p[1]) < 0).map(p => p[1]);
    if (faltam.length) erros.push('Aba Perfis: faltam as colunas ' + faltam.join(', ') + ' (rode autorizar antes).');
    const nomes = pv.slice(1).map(r => String(r[0]).trim());
    [PERFIL_TOTAL, 'Manutenção'].forEach(n => { if (nomes.indexOf(n) < 0) erros.push('Aba Perfis: falta o perfil ' + n + '.'); });
  }
  return { erros, avisos, resumo };
}

// propriedades obrigatórias e pastas de teste (só leitura do Drive)
function hmgPropriedades(props) {
  const erros = [], avisos = [], resumo = [];
  if (!props.getProperty('SEG_SEGREDO')) erros.push('Falta a propriedade SEG_SEGREDO (sem ela as senhas de teste não funcionam). Rode autorizar e entre uma vez no site.');
  [['PASTA_FOTOS_OS', 'fotos das OS'], ['PASTA_NF', 'notas fiscais']].forEach(([k, rot]) => {
    const id = props.getProperty(k);
    if (!id) { erros.push('Falta a propriedade ' + k + ' (pasta de teste das ' + rot + ').'); return; }
    try {
      const f = DriveApp.getFolderById(id);
      if (f.isTrashed()) { erros.push('A pasta de teste das ' + rot + ' (' + k + ') está na lixeira.'); return; }
      let n = 0; const it = f.getFiles(); while (it.hasNext() && n < 1000) { it.next(); n++; }
      resumo.push('Pasta das ' + rot + ': "' + f.getName() + '" (' + n + ' arquivo(s)) — não é alterada.');
      if (n) avisos.push('A pasta de teste das ' + rot + ' tem ' + n + ' arquivo(s). Confira se são só de teste; a rotina não mexe neles.');
    } catch (e) { erros.push('Não foi possível abrir a pasta de teste das ' + rot + ' (' + k + '): ' + e.message); }
  });
  if (props.getProperty('LIBERAR_ACIONADOR_OFICIAL')) avisos.push('A propriedade LIBERAR_ACIONADOR_OFICIAL existe nesta cópia; ela não é necessária na homologação.');
  return { erros, avisos, resumo };
}

// fotografia do estado: quantas linhas por aba, abas extras, cópias ocultas e propriedades
function hmgEstado(ss, props) {
  const nomesSistema = Object.keys(ABAS).map(k => ABAS[k].nome).concat(['Usuarios', 'Perfis', 'Config']);
  const linhasPorAba = {}, copias = [], outras = [];
  ss.getSheets().forEach(sh => {
    const nome = sh.getName();
    if (nome.indexOf('Itens (cópia de') === 0) { copias.push(nome); return; }
    if (nomesSistema.indexOf(nome) < 0) { outras.push(nome); return; }
    linhasPorAba[nome] = Math.max(0, sh.getLastRow() - 1);
  });
  const todas = props.getProperties();
  const chaves = Object.keys(todas);
  const zerar = chaves.filter(hmgZerarChave).sort();
  const config = [];
  const cfg = ss.getSheetByName('Config');
  if (cfg && cfg.getLastRow() > 1) cfg.getRange(2, 1, cfg.getLastRow() - 1, 1).getValues().forEach(r => { if (String(r[0]).trim()) config.push(String(r[0]).trim()); });
  return { linhasPorAba, copias: copias.sort(), outras: outras.sort(), zerar, config };
}
function hmgZerarChave(k) {
  if (HMG.preservar.indexOf(k) >= 0 || k.indexOf('HOMOLOG_') === 0 || k === 'CONFIRMAR_CARGA') return false;
  return HMG.zerarChaves.indexOf(k) >= 0 || HMG.zerarPrefixos.some(p => k.indexOf(p) === 0);
}
function hmgAssinatura(ss, est) {
  const txt = JSON.stringify([ss.getId(), est.linhasPorAba, est.copias, est.outras]);
  const d = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, txt);
  return d.map(b => ('0' + (b & 255).toString(16)).slice(-2)).join('').slice(0, 16);
}

// todas as verificações juntas
function hmgVerificar() {
  const ss = SpreadsheetApp.getActive();
  const props = PropertiesService.getScriptProperties();
  const erros = hmgTravas(ss, props);
  const avisos = [];
  // com uma trava de ambiente falhando, não lê mais nada
  if (erros.length) return { ok: false, erros, avisos, ss, props };
  hmgCabecalhos(ss).forEach(e => erros.push(e));
  const c = hmgContas(ss), p = hmgPropriedades(props);
  c.erros.concat(p.erros).forEach(e => erros.push(e));
  c.avisos.concat(p.avisos).forEach(a => avisos.push(a));
  const est = hmgEstado(ss, props);
  return { ok: !erros.length, erros, avisos, ss, props, est, contas: c.resumo, pastas: p.resumo };
}

function hmgRelatorio(v, titulo) {
  const L = ['=== ' + titulo + ' ==='];
  if (v.ss) L.push('Planilha: ' + v.ss.getName() + ' (' + v.ss.getId() + ')');
  if (v.erros.length) { L.push('', 'PROBLEMAS (nada foi feito):'); v.erros.forEach(e => L.push(' - ' + e)); }
  if (v.avisos && v.avisos.length) { L.push('', 'Avisos:'); v.avisos.forEach(e => L.push(' - ' + e)); }
  if (v.est) {
    L.push('', 'Linhas que serão apagadas (o cabeçalho fica):');
    HMG.limpar.forEach(k => { const n = ABAS[k].nome; L.push(' - ' + n + ': ' + (v.est.linhasPorAba[n] || 0)); });
    L.push('Abas ocultas de cópia que serão apagadas: ' + (v.est.copias.length ? v.est.copias.join(', ') : 'nenhuma'));
    L.push('Abas desconhecidas (não são tocadas): ' + (v.est.outras.length ? v.est.outras.join(', ') : 'nenhuma'));
    L.push('Config: ' + (v.est.config.join(', ') || 'vazia') + ' — só as linhas "Locais - …" são trocadas.');
    L.push('Propriedades de estado que serão apagadas: ' + (v.est.zerar.length ? v.est.zerar.length + ' (' + v.est.zerar.slice(0, 8).join(', ') + (v.est.zerar.length > 8 ? '…' : '') + ')' : 'nenhuma'));
    L.push('Preservadas: SEG_SEGREDO, PASTA_FOTOS_OS, PASTA_NF, AMBIENTE, HOMOLOG_PLANILHA_ID, Usuarios, Perfis e arquivos do Drive.');
  }
  if (v.contas && v.contas.length) L.push('Contas: ' + v.contas.join('; '));
  if (v.pastas) v.pastas.forEach(x => L.push(x));
  L.push('', 'Materiais que serão cadastrados (setor Manutenção):');
  HMG.materiais.forEach(m => L.push(' - ' + m.codigo + ' ' + m.nome + ': saldo inicial ' + m.qtd + ' un, mínimo ' + m.minimo));
  return L.join('\n');
}

// ---------------- 1. simulação: não grava nada além do código de confirmação ----------------

function simularCargaHomologacao() {
  const v = hmgVerificar();
  const props = v.props || PropertiesService.getScriptProperties();
  const feita = props.getProperty('HOMOLOG_CARGA_FEITA');
  if (feita && !v.erros.length) v.erros.push('A carga já foi feita (' + feita + '). Para repetir de propósito, apague a propriedade HOMOLOG_CARGA_FEITA.');
  const andamento = props.getProperty('HOMOLOG_CARGA_ANDAMENTO');
  if (andamento) (v.avisos = v.avisos || []).push('Uma execução anterior parou no meio (' + andamento + '). Executar de novo é seguro: limpa tudo antes de carregar.');
  let txt = hmgRelatorio(v, 'SIMULAÇÃO DA CARGA DE HOMOLOGAÇÃO (nada foi alterado)');
  if (!v.erros.length) {
    // só as travas de ambiente aprovadas permitem guardar o código (único dado gravado pela simulação)
    const codigo = 'HMG-' + Utilities.getUuid().replace(/-/g, '').slice(0, 6).toUpperCase();
    props.setProperty('HOMOLOG_SIMULACAO', JSON.stringify({ codigo, em: Date.now(), assinatura: hmgAssinatura(v.ss, v.est) }));
    txt += '\n\nTudo conferido. Código de confirmação: ' + codigo + ' (vale ' + HMG.validadeMin + ' minutos).' +
      '\nPara executar: crie a propriedade do script CONFIRMAR_CARGA com esse código e rode executarCargaHomologacao.';
  }
  Logger.log(txt);
  return txt;
}

// ---------------- 2. execução ----------------

function executarCargaHomologacao() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('O sistema está ocupado com outra gravação. Tente de novo em alguns segundos.');
  try {
    const v = hmgVerificar();
    const props = v.props || PropertiesService.getScriptProperties();
    const parar = msg => { const t = hmgRelatorio(Object.assign({}, v, { erros: v.erros.concat(msg ? [msg] : []) }), 'CARGA NÃO EXECUTADA'); Logger.log(t); throw new Error('Carga não executada. ' + (msg || v.erros[0])); };
    if (!v.ok) parar('');
    const feita = props.getProperty('HOMOLOG_CARGA_FEITA');
    if (feita) parar('A carga já foi feita (' + feita + '). Para repetir de propósito, apague a propriedade HOMOLOG_CARGA_FEITA.');
    let sim = null; try { sim = JSON.parse(props.getProperty('HOMOLOG_SIMULACAO') || 'null'); } catch (e) {}
    const conf = String(props.getProperty('CONFIRMAR_CARGA') || '').trim().toUpperCase();
    if (!sim) parar('Rode simularCargaHomologacao antes.');
    if (!conf) parar('Falta a confirmação manual: crie a propriedade CONFIRMAR_CARGA com o código da simulação.');
    if (conf !== sim.codigo) parar('O código em CONFIRMAR_CARGA não é o da última simulação.');
    if (Date.now() - sim.em > HMG.validadeMin * 60e3) parar('O código da simulação venceu (vale ' + HMG.validadeMin + ' minutos). Simule de novo.');
    if (hmgAssinatura(v.ss, v.est) !== sim.assinatura) parar('A planilha mudou depois da simulação. Simule de novo e confira.');
    // confirmação usada uma vez só
    props.deleteProperty('CONFIRMAR_CARGA');
    props.deleteProperty('HOMOLOG_SIMULACAO');
    const res = hmgAplicar(v.ss, props);
    Logger.log(res);
    return res;
  } finally {
    lock.releaseLock();
  }
}

function hmgEtapa(props, etapa) {
  props.setProperty('HOMOLOG_CARGA_ANDAMENTO', JSON.stringify({ etapa, em: agoraSeg() }));
  if (FALHA_SIMULADA === 'hmg_' + etapa) throw new Error('Falha simulada na etapa ' + etapa);
}

// Limpa e carrega. Cada etapa pode ser repetida: a limpeza vem antes e a carga usa IDs fixos.
function hmgAplicar(ss, props) {
  const apagado = {};
  hmgEtapa(props, 'limpeza');
  // 1. dados operacionais: apaga só o conteúdo das linhas (cabeçalho, formatos, validações e proteções ficam)
  HMG.limpar.forEach(k => {
    const sh = ss.getSheetByName(ABAS[k].nome);
    const n = sh.getLastRow() - 1;
    apagado[ABAS[k].nome] = Math.max(0, n);
    if (n > 0) sh.getRange(2, 1, n, Math.max(1, sh.getLastColumn())).clearContent();
  });
  // 2. abas ocultas com cópias de segurança da aba Itens (dados reais)
  let copias = 0;
  ss.getSheets().forEach(sh => { if (sh.getName().indexOf('Itens (cópia de') === 0) { ss.deleteSheet(sh); copias++; } });
  SpreadsheetApp.flush();

  hmgEtapa(props, 'estado');
  // 3. estado interno do sistema (o segredo das senhas, as pastas e as travas ficam)
  const todas = props.getProperties();
  let zeradas = 0;
  Object.keys(todas).forEach(k => { if (hmgZerarChave(k)) { props.deleteProperty(k); zeradas++; } });
  // impede que a lista real de pendências embutida no código seja recriada na aba vazia
  props.setProperty('PEND_SEMEADA', 'homologacao ' + hoje());

  hmgEtapa(props, 'locais');
  // 4. locais fictícios na aba Config (as outras linhas da Config não mudam)
  const cfg = abaConfig();
  Object.keys(HMG.locais).forEach(setor => {
    const chave = 'Locais - ' + setor;
    const vals = cfg.getDataRange().getValues();
    let row = 0;
    for (let i = 0; i < vals.length; i++) if (String(vals[i][0]).trim() === chave) row = i + 1;
    if (!row) row = Math.max(cfg.getLastRow(), 1) + 1;
    cfg.getRange(row, 1, 1, 3).setNumberFormat('@').setValues([[chave, HMG.locais[setor].join('\n'), 'Locais fictícios da homologação (setor ' + setor + ').']]);
  });

  hmgEtapa(props, 'materiais');
  // 5. materiais fictícios e o lançamento do saldo inicial (a aba já está vazia: nada duplica)
  const ti = tabela('itens'), tm = tabela('movs');
  if (ti.sh.getLastRow() > 1 || tm.sh.getLastRow() > 1) throw new Error('Itens ou Movimentacoes não estão vazias; a carga parou para não duplicar. Simule e execute de novo.');
  const ag = agora(), seg = agoraSeg(), dia = hoje();
  const itens = HMG.materiais.map(m => ({
    id: m.id, codigo: m.codigo, nome: m.nome, categoria: m.categoria, tipoItem: m.tipoItem, unidade: 'un', local: HMG.locais['Manutenção'][0],
    qtd: m.qtd, minimo: m.minimo, obs: 'Material fictício da homologação.', criadoEm: ag, atualizadoEm: ag, setor: 'Manutenção'
  }));
  const movs = HMG.materiais.map((m, i) => ({
    id: 'MHMG000' + (i + 1), data: dia, tipo: TIPOS.ajuste, itemId: m.id, itemCodigo: m.codigo, itemNome: m.nome, qtd: m.qtd, unidade: 'un', delta: m.qtd,
    responsavel: HMG.autor.nome, motivo: 'Saldo inicial da carga de homologação', obs: 'Carga de dados fictícios da homologação (' + HMG.operacao + ').',
    registradoPor: HMG.autor.nome, criadoEm: seg, operacao: HMG.operacao, saldoAnterior: 0, saldoFinal: m.qtd, aprovadoPor: HMG.autor.nome
  }));
  gravarVarias(ti, itens);
  gravarVarias(tm, movs);
  SpreadsheetApp.flush();

  hmgEtapa(props, 'verificacao');
  // 6. retrato dos saldos: a verificação automática começa coerente com a carga
  atualizarRetrato();
  // 7. conferência final antes de marcar como feita
  const it2 = linhas(tabela('itens')), mv2 = linhas(tabela('movs'));
  const problemas = [];
  if (it2.length !== HMG.materiais.length) problemas.push('Itens tem ' + it2.length + ' linha(s)');
  if (mv2.length !== HMG.materiais.length) problemas.push('Movimentacoes tem ' + mv2.length + ' linha(s)');
  HMG.materiais.forEach(m => {
    const it = it2.find(x => x.id === m.id);
    if (!it || Number(it.qtd) !== m.qtd) problemas.push(m.codigo + ' com saldo ' + (it ? it.qtd : 'ausente'));
    if (mv2.filter(x => x.itemId === m.id && Number(x.delta) === m.qtd).length !== 1) problemas.push(m.codigo + ' sem o lançamento de saldo inicial');
  });
  const ret = lerRetrato() || {};
  HMG.materiais.forEach(m => { if (Number(ret[m.id]) !== m.qtd) problemas.push('retrato de ' + m.codigo + ' não confere'); });
  ['emp', 'cont', 'os', 'dem', 'prev', 'pend', 'acessos'].forEach(k => { if (ss.getSheetByName(ABAS[k].nome).getLastRow() > 1) problemas.push('aba ' + ABAS[k].nome + ' não ficou vazia'); });
  if (!props.getProperty('SEG_SEGREDO')) problemas.push('SEG_SEGREDO sumiu');
  if (problemas.length) throw new Error('A conferência final encontrou: ' + problemas.join('; ') + '. Simule e execute de novo.');

  const resumo = 'Apagados: ' + Object.keys(apagado).map(n => n + ' ' + apagado[n]).join(', ') + '; ' + copias + ' aba(s) de cópia; ' + zeradas + ' propriedade(s) de estado. ' +
    'Cadastrados: ' + HMG.materiais.map(m => m.codigo + ' (' + m.qtd + ')').join(', ') + ', com o lançamento "Saldo inicial da carga de homologação".';
  auditar(HMG.autor, 'Carga de homologação', resumo, 'OK');
  props.setProperty('HOMOLOG_CARGA_FEITA', agoraSeg());
  props.deleteProperty('HOMOLOG_CARGA_ANDAMENTO');
  return '=== CARGA DE HOMOLOGAÇÃO CONCLUÍDA ===\n' + resumo;
}
