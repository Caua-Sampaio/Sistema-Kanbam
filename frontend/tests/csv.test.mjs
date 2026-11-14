import { test } from 'node:test';
import assert from 'node:assert/strict';
import { csvParaLeads, parseCsv, parsearLinhas } from '../src/csvParser.js';

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
