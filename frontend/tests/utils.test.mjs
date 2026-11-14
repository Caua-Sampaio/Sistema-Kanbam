import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mensagemWhatsapp, whatsappComMensagem } from '../src/utils.js';

test('link do WhatsApp leva a mensagem codificada', () => {
  const url = whatsappComMensagem({ telefone: '(15) 99999-0000', empresa: 'Clínica Lumi', dono: 'Dra. Renata', avaliacoes: 142 });
  assert.match(url, /^https:\/\/wa\.me\/5515999990000\?text=/);
  assert.ok(decodeURIComponent(url).includes('Dra. Renata'));
  assert.ok(decodeURIComponent(url).includes('142 avaliações'));
});

test('sem telefone não gera link', () => {
  assert.equal(whatsappComMensagem({ telefone: '' }), null);
});

test('sem dono nem avaliações usa saudação genérica e não cita avaliações', () => {
  const m = mensagemWhatsapp({ empresa: 'Loja', dono: '', avaliacoes: 0 });
  assert.ok(m.startsWith('Oi, tudo bem?'));
  assert.ok(!m.includes('avaliações'));
});
