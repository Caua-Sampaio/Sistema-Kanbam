import { useEffect, useState } from 'react';
import { api, getToken, setToken } from './api';
import Login from './components/Login';
import Kanban from './components/Kanban';
import Dashboard from './components/Dashboard';
import { ImportModal, LeadModal } from './components/Modais';

export default function App() {
  // Todos os hooks ficam antes de qualquer retorno condicional
  const [logado, setLogado] = useState(!!getToken());
  const [dados, setDados] = useState({ listas: [], leads: [], colunas: [] });
  const [aba, setAba] = useState('kanban');
  const [listaId, setListaId] = useState('todas');
  const [edicao, setEdicao] = useState(null);
  const [importando, setImportando] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = () => api.dados().then((d) => d && setDados(d)).catch((e) => setErro(e.message));
  useEffect(() => { if (logado) carregar(); }, [logado]);

  if (!logado) return <Login onLogin={() => setLogado(true)} />;

  const executar = (acao) => acao().then(carregar).catch((e) => setErro(e.message));
  const sair = () => { setToken(null); setLogado(false); };
  const novaColuna = () => {
    const nome = window.prompt('Nome da nova coluna:');
    if (nome?.trim()) executar(() => api.criarColuna(nome.trim()));
  };
  const moverLead = (id, colunaId) => {
    setDados((d) => ({ ...d, leads: d.leads.map((l) => (l.id === id ? { ...l, colunaId } : l)) }));
    executar(() => api.moverLead(id, colunaId));
  };
  const excluirLead = (id) => {
    if (window.confirm('Excluir este lead?')) executar(() => api.excluirLead(id));
  };
  const leads = listaId === 'todas' ? dados.leads : dados.leads.filter((l) => l.listaId === listaId);
  const BTN_GHOST = 'rounded-xl px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-slate-800 bg-slate-900/90 px-6 py-4 backdrop-blur">
        <h1 className="mr-auto text-lg font-bold">ProspecDash SaaS</h1>

        <nav className="flex gap-1 rounded-xl border border-slate-800 bg-slate-950 p-1">
          {[['kanban', 'Kanban'], ['dashboard', 'Dashboard']].map(([id, label]) => (
            <button key={id} onClick={() => setAba(id)}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${aba === id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
              {label}
            </button>
          ))}
        </nav>

        <select value={listaId} onChange={(e) => setListaId(e.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300">
          <option value="todas">Todas as listas</option>
          {dados.listas.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
        </select>

        <button onClick={novaColuna} className={BTN_GHOST}>+ Coluna</button>
        <button onClick={() => setImportando(true)} className={BTN_GHOST}>Importar lista</button>
        <button onClick={() => setEdicao({})} className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500">+ Lead</button>
        <button onClick={sair} className="rounded-xl border border-slate-800 px-3 py-2 text-xs text-slate-400 hover:text-rose-400">Sair</button>
      </header>

      {erro && (
        <div className="mx-6 mt-4 flex justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
          <span>{erro}</span>
          <button onClick={() => setErro('')}>×</button>
        </div>
      )}

      <main className="p-6">
        {aba === 'kanban' ? (
          <Kanban colunas={dados.colunas} leads={leads} listas={dados.listas}
            onMover={moverLead} onEditar={setEdicao} onExcluir={excluirLead} />
        ) : (
          <Dashboard leads={dados.leads} listas={dados.listas} colunas={dados.colunas} />
        )}
      </main>

      {edicao && (
        <LeadModal lead={edicao} listas={dados.listas} colunas={dados.colunas}
          listaPadrao={listaId !== 'todas' ? listaId : dados.listas[0]?.id}
          onSalvar={(l) => executar(async () => { await api.salvarLead(l); setEdicao(null); })}
          onFechar={() => setEdicao(null)} />
      )}
      {importando && (
        <ImportModal
          onImportar={(p) => executar(async () => { await api.criarLista(p); setImportando(false); })}
          onFechar={() => setImportando(false)} />
      )}
    </div>
  );
}
