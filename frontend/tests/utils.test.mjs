import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MENSAGEM_COM_SITE, MENSAGEM_WHATSAPP, mensagemWhatsapp, separarDuplicados, whatsappComMensagem } from '../src/utils.js';

test('sem site, a mensagem é o texto de abordagem', () => {
  assert.equal(mensagemWhatsapp({}), MENSAGEM_WHATSAPP);
  assert.ok(MENSAGEM_WHATSAPP.startsWith('Olá! Tudo bem?'));
});

test('com site, a mensagem cita o link cadastrado', () => {
  const m = mensagemWhatsapp({ site: 'https://clinica.com.br' });
  assert.ok(m.includes('https://clinica.com.br'));
  assert.ok(!m.includes('{site}'));
  assert.equal(m, MENSAGEM_COM_SITE.replace('{site}', 'https://clinica.com.br'));
});

test('o link do WhatsApp leva exatamente a mensagem', () => {
  const url = whatsappComMensagem({ telefone: '(15) 99999-0000' });
  assert.match(url, /^https:\/\/wa\.me\/5515999990000\?text=/);
  assert.equal(decodeURIComponent(url.split('?text=')[1]), MENSAGEM_WHATSAPP);
});

test('sem telefone não gera link', () => {
  assert.equal(whatsappComMensagem({ telefone: '' }), null);
});

test('separarDuplicados reconhece telefone ou Instagram já cadastrados', () => {
  const existentes = [{ telefone: '(15) 99999-0001', instagram: '' }];
  const novos = [
    { empresa: 'A', telefone: '(15) 99999-0001', instagram: '' },
    { empresa: 'B', telefone: '(15) 98888-0002', instagram: '@b' },
    { empresa: 'C', telefone: '', instagram: '@B' },
  ];
  const { novos: n, repetidos } = separarDuplicados(novos, existentes);
  assert.deepEqual(n.map((l) => l.empresa), ['B']);
  assert.deepEqual(repetidos.map((l) => l.empresa), ['A', 'C']);
});
