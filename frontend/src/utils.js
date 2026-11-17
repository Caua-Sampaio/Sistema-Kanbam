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
    'Bairro', 'Nicho', 'Origem', 'Site', 'Coluna', 'Lista', 'Próximo retorno'];
  const linhas = leads.map((l) => [l.empresa, l.dono, l.avaliacoes, l.horario, l.telefone, l.instagram,
    l.statusSite, l.bairro, l.nicho, l.origem, l.site, nomeCol(l.colunaId), nomeLista(l.listaId), formatarData(l.retorno)]);
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = '\uFEFF' + [cab, ...linhas].map((r) => r.map(esc).join(';')).join('\n');
  baixarArquivo(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'leads.csv');
}

// Mensagem enviada pelo botão de WhatsApp. Edite aqui para mudar a abordagem.
export const MENSAGEM_WHATSAPP = `Olá! Tudo bem?

Estava olhando o seu negócio e notei uma coisa que pode estar custando clientes para você. Quando alguém procura clínicas de estética na internet e não encontra um site que transmita confiança, a escolha costuma ir para quem aparece melhor.

Eu crio sites que fazem o cliente chamar no WhatsApp sem precisar pensar duas vezes. Página pensada para celular, contato em um toque e uma cara profissional que combina com a sua marca.

Preparei uma ideia inicial de como o site da clínica poderia ficar. Quer que eu te mostre?`;

// Usada quando o lead já tem site. O placeholder {site} recebe o link cadastrado.
export const MENSAGEM_COM_SITE = `Olá! Tudo bem?

Vi o site de vocês ({site}) e gostei da proposta. Trabalho com sites para clínicas de estética e percebi algumas oportunidades para ele converter mais visitas em contatos pelo WhatsApp, como um botão de contato em destaque e uma versão mais rápida no celular.

Se fizer sentido, posso te mostrar uma sugestão de melhoria, sem compromisso?`;

export function mensagemWhatsapp(lead = {}) {
  if (lead.site) return MENSAGEM_COM_SITE.replace('{site}', lead.site);
  return MENSAGEM_WHATSAPP;
}

// Link wa.me já com a mensagem preenchida; abre direto no app do WhatsApp
export function whatsappComMensagem(lead) {
  const base = whatsappLink(lead.telefone);
  return base ? `${base}?text=${encodeURIComponent(mensagemWhatsapp(lead))}` : null;
}

// Chaves usadas para reconhecer um contato já cadastrado (mesma regra do back-end)
const soDigitos = (t) => (t || '').replace(/\D/g, '');
export function chavesDeContato(lead) {
  const tel = soDigitos(lead.telefone);
  const ig = (lead.instagram || '').trim().toLowerCase();
  return [tel.length >= 8 ? 'tel:' + tel : null, ig ? 'ig:' + ig : null].filter(Boolean);
}

// Separa os leads novos dos que já existem no sistema ou se repetem no próprio arquivo
export function separarDuplicados(novosLeads, existentes) {
  const usados = new Set(existentes.flatMap(chavesDeContato));
  const novos = [];
  const repetidos = [];
  for (const lead of novosLeads) {
    const chaves = chavesDeContato(lead);
    if (chaves.some((c) => usados.has(c))) {
      repetidos.push(lead);
    } else {
      novos.push(lead);
      chaves.forEach((c) => usados.add(c));
    }
  }
  return { novos, repetidos };
}
