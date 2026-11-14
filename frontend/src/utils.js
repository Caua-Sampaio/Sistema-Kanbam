export function hoje() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatarData(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

// Data do próximo retorno, definida no último contato do lead
export function proximoRetorno(leadId, contatos) {
  const ultimo = contatos
    .filter((c) => c.leadId === leadId)
    .sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1))[0];
  return ultimo?.proximoContato ?? null;
}

// Gera link wa.me a partir do telefone (assume Brasil quando faltar o 55)
export function whatsappLink(telefone) {
  let d = (telefone || '').replace(/\D/g, '');
  if (d.length < 10) return null;
  if (!d.startsWith('55')) d = '55' + d;
  return `https://wa.me/${d}`;
}

export function baixarArquivo(blob, nome) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

export function baixarCsv(leads, colunas, listas) {
  const nomeCol = (id) => colunas.find((c) => c.id === id)?.nome ?? '';
  const nomeLista = (id) => listas.find((l) => l.id === id)?.nome ?? '';
  const cab = ['Empresa', 'Dono(a)', 'Avaliações', 'Horário', 'Telefone', 'Instagram', 'Status do site',
    'Bairro', 'Nicho', 'Origem', 'Coluna', 'Lista', 'Próximo retorno'];
  const linhas = leads.map((l) => [l.empresa, l.dono, l.avaliacoes, l.horario, l.telefone, l.instagram,
    l.statusSite, l.bairro, l.nicho, l.origem, nomeCol(l.colunaId), nomeLista(l.listaId), formatarData(l.retorno)]);
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = '\uFEFF' + [cab, ...linhas].map((r) => r.map(esc).join(';')).join('\n');
  baixarArquivo(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'leads.csv');
}

// Nome usado nas mensagens de WhatsApp. Troque aqui se for enviar com outro nome.
export const REMETENTE = 'Cauã';

// Mensagem curta, pessoal e com uma pergunta de baixa pressão (o que converte em resposta)
export function mensagemWhatsapp(lead, remetente = REMETENTE) {
  const saudacao = lead.dono ? `Oi, ${lead.dono}! ` : 'Oi, tudo bem? ';
  const aval = lead.avaliacoes > 0 ? ` com ${lead.avaliacoes} avaliações de clientes` : '';
  return `${saudacao}Meu nome é ${remetente}. Vi o perfil da ${lead.empresa} no Google Maps${aval}, ` +
    `e a reputação de vocês é muito boa. Percebi que ainda não tem um site próprio. ` +
    `Eu crio sites para clínicas da região, com agendamento pelo WhatsApp e aparecendo no Google, ` +
    `para trazer mais clientes. Posso te mostrar um exemplo rápido, sem compromisso?`;
}

// Link wa.me já com a mensagem preenchida; abre direto no app do WhatsApp
export function whatsappComMensagem(lead) {
  const base = whatsappLink(lead.telefone);
  return base ? `${base}?text=${encodeURIComponent(mensagemWhatsapp(lead))}` : null;
}
