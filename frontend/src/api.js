const BASE = '/api';

export const getToken = () => localStorage.getItem('token');
export const setToken = (t) => (t ? localStorage.setItem('token', t) : localStorage.removeItem('token'));

// Converte o erro do FastAPI em texto legível (inclui erros de validação por campo)
function mensagemErro(err, status) {
  if (typeof err.detail === 'string') return err.detail;
  if (Array.isArray(err.detail)) {
    return err.detail.slice(0, 3)
      .map((d) => `${d.loc?.slice(-1)[0] ?? 'campo'}: ${d.msg}`)
      .join(' · ');
  }
  return `Erro ${status}`;
}

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
  let res;
  try {
    res = await fetch(BASE + path, { method, headers, body: payload });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Confira se o back-end está rodando.');
  }
  if (res.status === 401 && !path.startsWith('/auth')) {
    setToken(null);
    window.location.reload();
    return null;
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(mensagemErro(err, res.status));
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
  bairro: l.bairro ?? '',
  nicho: l.nicho ?? '',
  origem: l.origem ?? '',
  site: l.site ?? '',
  nota: l.nota ?? null,
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
  restaurarLead: (id) => req(`/leads/${id}/restaurar`, { method: 'POST' }),
  excluirVarios: (ids) => req('/leads/excluir-em-lote', { method: 'POST', body: { ids } }),
  restaurarVarios: (ids) => req('/leads/restaurar-em-lote', { method: 'POST', body: { ids } }),
  criarContato: (leadId, nota, proximo) =>
    req(`/leads/${leadId}/contatos`, { method: 'POST', body: { nota, proximo_contato: proximo || null } }),
  editarContato: (id, nota, proximo) =>
    req(`/contatos/${id}`, { method: 'PUT', body: { nota, proximo_contato: proximo || null } }),
  excluirContato: (id) => req(`/contatos/${id}`, { method: 'DELETE' }),
  criarColuna: (nome) => req('/colunas', { method: 'POST', body: { nome } }),
  baixarBackup: async () => {
    const res = await fetch(`${BASE}/backup`, { headers: { Authorization: `Bearer ${getToken()}` } });
    if (!res.ok) throw new Error('Não foi possível gerar o backup.');
    return res.blob();
  },
};
