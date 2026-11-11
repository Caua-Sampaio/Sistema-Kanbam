const BASE = '/api';

export const getToken = () => localStorage.getItem('token');
export const setToken = (t) => (t ? localStorage.setItem('token', t) : localStorage.removeItem('token'));

async function req(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = new URLSearchParams(form);
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(BASE + path, { method, headers, body: payload });
  if (res.status === 401 && !path.startsWith('/auth')) {
    setToken(null);
    window.location.reload();
    return null;
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err.detail === 'string' ? err.detail : `Erro ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

// Converte o lead do front (camelCase) para o formato do back (snake_case)
const paraApi = (l) => ({
  empresa: l.empresa,
  dono: l.dono ?? '',
  avaliacoes: Number(l.avaliacoes) || 0,
  horario: l.horario ?? '',
  telefone: l.telefone ?? '',
  instagram: l.instagram ?? '',
  status_site: l.statusSite ?? 'Sem site',
  coluna_id: l.colunaId ?? 'prospectado',
  lista_id: l.listaId ?? null,
});

export const api = {
  login: (username, password) => req('/auth/login', { method: 'POST', form: { username, password } }),
  trocarSenha: (atual, nova) => req('/auth/senha', { method: 'POST', body: { atual, nova } }),
  dados: () => req('/dados'),
  criarLista: ({ nome, nicho, cidade, linhas }) =>
    req('/listas', { method: 'POST', body: { nome, nicho, cidade, linhas: linhas.map(paraApi) } }),
  salvarLead: (l) =>
    l.id ? req(`/leads/${l.id}`, { method: 'PUT', body: paraApi(l) }) : req('/leads', { method: 'POST', body: paraApi(l) }),
  moverLead: (id, colunaId) => req(`/leads/${id}/coluna?coluna_id=${encodeURIComponent(colunaId)}`, { method: 'PATCH' }),
  excluirLead: (id) => req(`/leads/${id}`, { method: 'DELETE' }),
  criarContato: (leadId, nota, proximo) =>
    req(`/leads/${leadId}/contatos`, { method: 'POST', body: { nota, proximo_contato: proximo || null } }),
  criarColuna: (nome) => req('/colunas', { method: 'POST', body: { nome } }),
};
