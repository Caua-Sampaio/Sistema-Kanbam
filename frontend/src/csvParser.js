// Funções puras (sem dependências do navegador) para ler e validar CSV e texto colado
const MODELO =
  'Empresa;Dono(a);Avaliações;Horário;Telefone;Instagram;Status do site;Bairro;Nicho;Origem;Site\n' +
  'Clínica Exemplo;Dra. Ana;120;Seg-Sex 9h-18h;(15) 99999-0000;@clinicaexemplo;Sem site;Campolim;Estética;Instagram;\n';

const STATUS = ['Sem site', 'Possui site', 'Em construção', 'Não verificado'];
const PLACEHOLDERS = ['não encontrado', 'nao encontrado', 'não informado', 'nao informado', 'n/a', '-', '—'];

// Textos de preenchimento viram campo vazio
export const limpo = (t) => (PLACEHOLDERS.includes((t || '').trim().toLowerCase()) ? '' : (t || '').trim());

const norm = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Aceita variações de nome de coluna (com ou sem acento, "Dono(a)", "Link do site", etc.)
const ALIAS = {
  empresa: ['empresa', 'nome', 'nomedaempresa', 'clinica', 'razaosocial'],
  dono: ['dono', 'donoa', 'proprietario', 'proprietarioa', 'responsavel'],
  avaliacoes: ['avaliacoes', 'avaliacao', 'reviews', 'estrelas'],
  horario: ['horario', 'horarios', 'funcionamento'],
  telefone: ['telefone', 'celular', 'whatsapp', 'fone'],
  instagram: ['instagram', 'insta'],
  statusSite: ['statusdosite', 'statussite', 'status'],
  site: ['site', 'linkdosite', 'website', 'url'],
  bairro: ['bairro'],
  nicho: ['nicho', 'especialidade'],
  origem: ['origem', 'fonte'],
};

// Limites de tamanho aceitos pelo back-end: [máximo, nome exibido]
const LIMITES = {
  empresa: [160, 'Empresa'],
  bairro: [80, 'Bairro'],
  nicho: [60, 'Nicho'],
  origem: [60, 'Origem'],
  site: [2000, 'Link do site'],
};

// Pega só o total de avaliações. Aceita "468", "5,0 (468)" e "4.8/5 (120 avaliações)".
export function extrairAvaliacoes(texto) {
  const t = (texto || '').trim();
  const entreParenteses = t.match(/\(\s*([\d.]+)\s*(?:avalia\S*)?\s*\)/i);
  if (entreParenteses) return Number(entreParenteses[1].replace(/\D/g, '')) || 0;
  return /^[\d.\s]+$/.test(t) ? Number(t.replace(/\D/g, '')) || 0 : 0;
}

// Nota de 0 a 5 com casa decimal (ex.: "5,0", "4.8"). Números inteiros são tratados como total.
export function extrairNota(texto) {
  const m = (texto || '').trim().match(/^(\d+(?:[.,]\d+)?)/);
  if (!m) return null;
  const n = Number(m[1].replace(',', '.'));
  return /[.,]/.test(m[1]) && n >= 0 && n <= 5 ? n : null;
}

// Remove telefone e o status "Aberto/Fechado" que vêm colados no texto copiado do Maps
export function limparHorario(texto) {
  return (texto || '')
    .replace(/\(?\d{2}\)?\s?\d{4,5}-?\d{4}/g, '')
    .split('·')
    .map((p) => p.trim())
    .filter((p) => p && !/^(aberto|fechado)\b/i.test(p))
    .join(' · ');
}

// Lê CSV com separador ;, , ou tabulação (cópia direta do Excel/Sheets) e campos entre aspas
export function parseCsv(texto) {
  const txt = texto.replace(/^\uFEFF/, '');
  const primeira = txt.split('\n')[0] || '';
  const contagem = {
    ';': (primeira.match(/;/g) || []).length,
    ',': (primeira.match(/,/g) || []).length,
    '\t': (primeira.match(/\t/g) || []).length,
  };
  const sep = Object.keys(contagem).reduce((a, b) => (contagem[b] > contagem[a] ? b : a), ';');

  const linhas = [];
  let campo = '';
  let linha = [];
  let aspas = false;
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i];
    if (aspas) {
      if (c === '"' && txt[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === sep) { linha.push(campo); campo = ''; }
    else if (c === '\n') { linha.push(campo); linhas.push(linha); linha = []; campo = ''; }
    else if (c !== '\r') campo += c;
  }
  if (campo || linha.length) { linha.push(campo); linhas.push(linha); }
  return linhas.filter((l) => l.some((v) => v.trim() !== ''));
}

// Lê e valida o arquivo. Retorna os leads válidos e uma lista de avisos por linha.
// Tipos: 'erro' (linha ignorada), 'aviso' (linha importada, mas revise) e 'info'.
export function analisarCsv(texto) {
  const [cabecalho, ...corpo] = parseCsv(texto);
  if (!cabecalho) throw new Error('O arquivo está vazio.');

  const chaves = cabecalho.map(norm);
  const pos = {};
  for (const campo of Object.keys(ALIAS)) pos[campo] = chaves.findIndex((k) => ALIAS[campo].includes(k));
  if (pos.empresa < 0) {
    throw new Error('Não encontrei a coluna "Empresa" na primeira linha. Verifique se o cabeçalho está presente.');
  }

  const avisos = [];
  const ignoradas = cabecalho.filter((nome, i) => nome.trim() && !Object.values(pos).includes(i));
  if (ignoradas.length) avisos.push({ tipo: 'info', mensagem: `Colunas ignoradas: ${ignoradas.join(', ')}.` });

  const vistos = new Set();
  const leads = [];

  corpo.forEach((row, idx) => {
    const linha = idx + 2; // a linha 1 é o cabeçalho
    const get = (campo) => (pos[campo] >= 0 ? limpo(row[pos[campo]]) : '');

    const empresa = get('empresa');
    if (!empresa) {
      avisos.push({ linha, tipo: 'erro', mensagem: 'Empresa vazia. Linha ignorada.' });
      return;
    }

    const telefone = get('telefone');
    const digitos = telefone.replace(/\D/g, '');
    const instagram = get('instagram').toLowerCase();
    const chaves = [digitos.length >= 8 ? 'tel:' + digitos : null, instagram ? 'ig:' + instagram : null].filter(Boolean);
    if (chaves.some((c) => vistos.has(c))) {
      avisos.push({ linha, tipo: 'erro', mensagem: `${empresa}: telefone ou Instagram repetido no arquivo. Linha ignorada.` });
      return;
    }
    chaves.forEach((c) => vistos.add(c));

    const statusBruto = get('statusSite');
    let statusSite = 'Sem site';
    if (statusBruto) {
      const reconhecido = STATUS.find((s) => norm(s) === norm(statusBruto));
      if (reconhecido) statusSite = reconhecido;
      else avisos.push({ linha, tipo: 'aviso', mensagem: `Status "${statusBruto}" não reconhecido. Será usado "Sem site".` });
    }

    const site = get('site');
    if (site && !/^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(\/\S*)?$/i.test(site)) {
      avisos.push({ linha, tipo: 'aviso', mensagem: `Link do site "${site}" parece inválido.` });
    }

    if (telefone && digitos.length < 10) {
      avisos.push({ linha, tipo: 'aviso', mensagem: `Telefone "${telefone}" parece incompleto.` });
    }

    const avaliacoesBruto = get('avaliacoes');
    const avaliacoes = extrairAvaliacoes(avaliacoesBruto);
    const nota = extrairNota(avaliacoesBruto);
    if (avaliacoesBruto && avaliacoes === 0 && nota === null) {
      avisos.push({ linha, tipo: 'aviso', mensagem: `Avaliações "${avaliacoesBruto}" não reconhecidas. Será usado 0.` });
    }

    leads.push({
      empresa,
      dono: get('dono'),
      avaliacoes,
      horario: limparHorario(get('horario')),
      telefone,
      instagram: get('instagram'),
      statusSite,
      site,
      bairro: get('bairro'),
      nicho: get('nicho'),
      origem: get('origem'),
      nota,
    });
    const atual = leads[leads.length - 1];
    for (const [campo, [max, rotulo]] of Object.entries(LIMITES)) {
      if (atual[campo].length > max) {
        avisos.push({ linha, tipo: 'aviso', mensagem: `${rotulo} com mais de ${max} caracteres. O texto foi cortado.` });
        atual[campo] = atual[campo].slice(0, max);
      }
    }
  });

  return { leads, avisos };
}

export function csvParaLeads(texto) {
  return analisarCsv(texto).leads;
}

// Formato colado sem cabeçalho: empresa;dono;avaliacoes;horario;telefone;instagram;statusSite
export function parsearLinhas(texto) {
  return texto.split('\n').map((l) => l.trim()).filter(Boolean).map((linha) => {
    const c = linha.split(';').map((x) => (x || '').trim());
    return {
      empresa: c[0] || '', dono: c[1] || '', avaliacoes: Number(c[2]) || 0,
      horario: c[3] || '', telefone: c[4] || '', instagram: c[5] || '',
      statusSite: STATUS.includes(c[6]) ? c[6] : 'Sem site',
      site: '', bairro: '', nicho: '', origem: '',
    };
  }).filter((r) => r.empresa);
}

export function baixarModelo() {
  const url = URL.createObjectURL(new Blob(['\uFEFF' + MODELO], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'modelo-leads.csv';
  a.click();
  URL.revokeObjectURL(url);
}
