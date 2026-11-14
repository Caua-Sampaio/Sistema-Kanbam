// Funções puras (sem dependências do navegador) para ler CSV e colar linhas
const MODELO =
  'Empresa;Dono(a);Avaliações;Horário;Telefone;Instagram;Status do site;Bairro;Nicho;Origem\n' +
  'Clínica Exemplo;Dra. Ana;120;Seg-Sex 9h-18h;(15) 99999-0000;@clinicaexemplo;Sem site;Campolim;Estética;Instagram\n';

const STATUS = ['Sem site', 'Possui site', 'Em construção'];

const PLACEHOLDERS = ['não encontrado', 'nao encontrado', 'não informado', 'nao informado', 'n/a', '-', '—'];
// Textos de preenchimento viram campo vazio
export const limpo = (t) => (PLACEHOLDERS.includes((t || '').trim().toLowerCase()) ? '' : (t || '').trim());

const norm = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Aceita variações de nome de coluna (com ou sem acento, "Dono(a)", "Status do site", etc.)
const ALIAS = {
  empresa: ['empresa', 'nome', 'nomedaempresa', 'clinica', 'razaosocial'],
  dono: ['dono', 'donoa', 'proprietario', 'proprietarioa', 'responsavel'],
  avaliacoes: ['avaliacoes', 'avaliacao', 'reviews', 'estrelas'],
  horario: ['horario', 'horarios', 'funcionamento'],
  telefone: ['telefone', 'celular', 'whatsapp', 'fone'],
  instagram: ['instagram', 'insta'],
  statusSite: ['statusdosite', 'statussite', 'status', 'site'],
  bairro: ['bairro'],
  nicho: ['nicho', 'especialidade'],
  origem: ['origem', 'fonte'],
};

// Lê CSV com separador ; ou , e campos entre aspas (com "" para aspas internas)
export function parseCsv(texto) {
  const txt = texto.replace(/^\uFEFF/, '');
  const primeira = txt.split('\n')[0] || '';
  const sep = (primeira.match(/;/g) || []).length >= (primeira.match(/,/g) || []).length ? ';' : ',';
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

export function csvParaLeads(texto) {
  const [cabecalho, ...corpo] = parseCsv(texto);
  if (!cabecalho) return [];
  const chaves = cabecalho.map(norm);
  const pos = {};
  for (const campo of Object.keys(ALIAS)) pos[campo] = chaves.findIndex((k) => ALIAS[campo].includes(k));
  if (pos.empresa < 0) throw new Error('Não encontrei a coluna "Empresa" no arquivo.');

  const valor = (row, campo) => (pos[campo] >= 0 ? limpo(row[pos[campo]]) : '');

  return corpo
    .map((row) => {
      const st = valor(row, 'statusSite');
      return {
        empresa: valor(row, 'empresa'),
        dono: valor(row, 'dono'),
        avaliacoes: Number(valor(row, 'avaliacoes').replace(/\D/g, '')) || 0,
        horario: valor(row, 'horario'),
        telefone: valor(row, 'telefone'),
        instagram: valor(row, 'instagram'),
        statusSite: STATUS.find((s) => norm(s) === norm(st)) || 'Sem site',
        bairro: valor(row, 'bairro'),
        nicho: valor(row, 'nicho'),
        origem: valor(row, 'origem'),
      };
    })
    .filter((r) => r.empresa);
}

// Formato colado no campo de texto: empresa;dono;avaliacoes;horario;telefone;instagram;statusSite
export function parsearLinhas(texto) {
  return texto.split('\n').map((l) => l.trim()).filter(Boolean).map((linha) => {
    const c = linha.split(';').map((x) => (x || '').trim());
    return {
      empresa: c[0] || '', dono: c[1] || '', avaliacoes: Number(c[2]) || 0,
      horario: c[3] || '', telefone: c[4] || '', instagram: c[5] || '',
      statusSite: STATUS.includes(c[6]) ? c[6] : 'Sem site',
      bairro: '', nicho: '', origem: '',
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
