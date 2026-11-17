import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analisarCsv, csvParaLeads, extrairAvaliacoes, limparHorario, parseCsv, parsearLinhas } from '../src/csvParser.js';

test('parseCsv respeita aspas e separador ;', () => {
  assert.deepEqual(parseCsv('a;"b;c";d\n1;2;3\n'), [['a', 'b;c', 'd'], ['1', '2', '3']]);
});

test('parseCsv trata aspas escapadas e remove BOM', () => {
  assert.deepEqual(parseCsv('\uFEFFx;"diz ""oi"""\n'), [['x', 'diz "oi"']]);
});

test('csvParaLeads reconhece cabeçalhos com acento e campos novos', () => {
  const csv = 'Empresa;Dono(a);Avaliações;Horário;Telefone;Instagram;Status do site;Bairro;Nicho;Origem\n' +
    '"Clínica ""Sol""";Dra. Ana;120;9h;(15) 1;@sol;Possui site;Campolim;Estética;Instagram\n';
  const [l] = csvParaLeads(csv);
  assert.equal(l.empresa, 'Clínica "Sol"');
  assert.equal(l.avaliacoes, 120);
  assert.equal(l.statusSite, 'Possui site');
  assert.equal(l.bairro, 'Campolim');
  assert.equal(l.nicho, 'Estética');
  assert.equal(l.origem, 'Instagram');
});

test('csvParaLeads usa Sem site quando o status é desconhecido', () => {
  const [l] = csvParaLeads('Empresa;Status do site\nLoja;talvez\n');
  assert.equal(l.statusSite, 'Sem site');
});

test('csvParaLeads exige a coluna Empresa', () => {
  assert.throws(() => csvParaLeads('Dono;Telefone\nX;1'), /Empresa/);
});

test('parsearLinhas lê o formato colado com ponto e vírgula', () => {
  const [l] = parsearLinhas('Loja;Maria;5;9h;(15) 1;@loja;Sem site');
  assert.equal(l.empresa, 'Loja');
  assert.equal(l.avaliacoes, 5);
});

test('csvParaLeads trata "não encontrado" como campo vazio', () => {
  const [l] = csvParaLeads('Empresa;Dono(a);Telefone;Instagram\nClínica;não encontrado;(15) 1;não encontrado\n');
  assert.equal(l.dono, '');
  assert.equal(l.instagram, '');
  assert.equal(l.telefone, '(15) 1');
});

test('csvParaLeads lê a coluna Site sem confundir com Status do site', () => {
  const [l] = csvParaLeads('Empresa;Status do site;Site\nClínica;Possui site;www.clinica.com.br\n');
  assert.equal(l.statusSite, 'Possui site');
  assert.equal(l.site, 'www.clinica.com.br');
});

test('extrairAvaliacoes pega só o total, não a nota', () => {
  assert.equal(extrairAvaliacoes('5,0 (468)'), 468);
  assert.equal(extrairAvaliacoes('4.8/5 (120 avaliações)'), 120);
  assert.equal(extrairAvaliacoes('276'), 276);
  assert.equal(extrairAvaliacoes('(15.234)'), 15234);
  assert.equal(extrairAvaliacoes(''), 0);
});

test('limparHorario remove telefone e status do Maps', () => {
  assert.equal(limparHorario('Fechado · Abre seg. às 08:00 · (15) 98832-2319'), 'Abre seg. às 08:00');
  assert.equal(limparHorario('Seg-Sex 9h-18h'), 'Seg-Sex 9h-18h');
});

test('csvParaLeads importa avaliações e horário já limpos', () => {
  const [l] = csvParaLeads('Empresa;Avaliações;Horário;Telefone\nPatricia;5,0 (468);Fechado · Abre seg. às 08:00 · (15) 98832-2319;(15) 98832-2319\n');
  assert.equal(l.avaliacoes, 468);
  assert.equal(l.horario, 'Abre seg. às 08:00');
  assert.equal(l.telefone, '(15) 98832-2319');
});

test('parseCsv reconhece tabulação (cópia do Excel e do Sheets)', () => {
  assert.deepEqual(parseCsv('a\tb\n1\t2\n'), [['a', 'b'], ['1', '2']]);
});

test('cabeçalho do Sheets com tabulação e "Link do site" é lido corretamente', () => {
  const csv = 'Empresa\tDono(a)\tAvaliações\tHorário\tTelefone\tInstagram\tStatus do site\tLink do site\tBairro\tNicho\tOrigem\n' +
    'Clínica Sol\tDra. Ana\t5,0 (468)\tSeg-Sex 9h-18h\t(15) 98832-2319\t@sol\tPossui site\twww.clinicasol.com.br\tCampolim\tEstética\tGoogle Maps\n';
  const { leads, avisos } = analisarCsv(csv);
  assert.equal(leads.length, 1);
  assert.equal(leads[0].empresa, 'Clínica Sol');
  assert.equal(leads[0].avaliacoes, 468);
  assert.equal(leads[0].site, 'www.clinicasol.com.br');
  assert.equal(leads[0].statusSite, 'Possui site');
  assert.equal(avisos.filter((a) => a.tipo === 'erro').length, 0);
});

test('analisarCsv sinaliza erros e avisos por linha', () => {
  const csv = 'Empresa;Telefone;Status do site;Link do site\n' +
    ';(15) 99999-0001;Sem site;\n' +
    'Loja A;(15) 98888-0001;talvez;clinica invalida\n' +
    'Loja B;(15) 98888-0001;Sem site;\n' +
    'Loja C;(15) 12;Sem site;\n';
  const { leads, avisos } = analisarCsv(csv);
  assert.equal(leads.length, 2);
  const porLinha = (n) => avisos.filter((a) => a.linha === n).map((a) => a.tipo);
  assert.deepEqual(porLinha(2), ['erro']);
  assert.ok(porLinha(3).includes('aviso'));
  assert.deepEqual(porLinha(4), ['erro']);
  assert.ok(porLinha(5).includes('aviso'));
});

test('analisarCsv informa colunas ignoradas', () => {
  const { avisos } = analisarCsv('Empresa;Link Maps\nLoja;https://maps.google.com/x\n');
  assert.ok(avisos.some((a) => a.tipo === 'info' && a.mensagem.includes('Link Maps')));
});

test('analisarCsv corta campos acima do limite do back-end e avisa', () => {
  const longo = 'A'.repeat(170);
  const { leads, avisos } = analisarCsv('Empresa;Bairro\n' + longo + ';Centro\n');
  assert.equal(leads[0].empresa.length, 160);
  assert.ok(avisos.some((a) => a.tipo === 'aviso' && a.mensagem.includes('Empresa')));
});
