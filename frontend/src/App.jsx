import { useEffect, useState } from 'react';
import { api, getToken, setToken } from './api';
import Login from './components/Login';
import Kanban from './components/Kanban';
import Tabela from './components/Tabela';
import Dashboard from './components/Dashboard';
import { DetalheModal, ImportModal, LeadModal, SenhaModal } from './components/Modais';
import { baixarCsv, hoje, proximoRetorno } from './utils';

const STATUS = ['Sem site', 'Possui site', 'Em construção'];
const INP = 'rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none';
const GHOST = 'rounded-xl px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800';
const PRIMARIO = 'rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500';

export default function App() {
  // Todos os hooks ficam antes de qualquer retorno condicional
  const [logado, setLogado] = useState(!!getToken());
  const [dados, setDados] = useState({ listas: [], leads: [], colunas: [], contatos: [] });
  const [aba, setAba] = useState('kanban');
  const [filtros, setFiltros] = useState({ busca: '', status: 'todos', listaId: 'todas', minAval: '', soRetornos: false });
  const [edicao, setEdicao] = useState(null);
  const [detalhe, setDetalhe] = useState(null); // id do lead aberto
  const [importando, setImportando] = useState(false);
  const [trocandoSenha, setTrocandoSenha] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = () => api.dados().then((d) => d && setDados(d)).catch((e) => setErro(e.message));
  useEffect(() => { if (logado) carregar(); }, [logado]);

  if (!logado) return <Login onLogin={() => setLogado(true)} />;

  const executar = (acao) => acao().then(carregar).catch((e) => setErro(e.message));
  const sair = () => { setToken(null); setLogado(false); };
  const set = (k) => (e) => setFiltros({ ...filtros, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const hojeStr = hoje();
  const comRetorno = dados.leads.map((l) => ({ ...l, retorno: proximoRetorno(l.id, dados.contatos) }));
  const leads = comRetorno.filter((l) => {
    const t = filtros.busca.trim().toLowerCase();
    return (filtros.listaId === 'todas' || l.listaId === filtros.listaId)
      && (filtros.status === 'todos' || l.statusSite === filtros.status)
      && (!filtros.minAval || l.avaliacoes >= Number(filtros.minAval))
      && (!filtros.soRetornos || (l.retorno && l.retorno <= hojeStr))
      && (!t || [l.empresa, l.dono, l.telefone, l.instagram].some((v) => (v || '').toLowerCase().includes(t)));
  });
  const detalheLead = detalhe ? comRetorno.find((l) => l.id === detalhe) : null;

  const moverLead = (id, colunaId) => {
    setDados((d) => ({ ...d, leads: d.leads.map((l) => (l.id === id ? { ...l, colunaId } : l)) }));
    executar(() => api.moverLead(id, colunaId));
  };
  const excluirLead = (id) => {
    if (!window.confirm('Excluir este lead e o histórico de contatos?')) return;
    setDetalhe(null);
    executar(() => api.excluirLead(id));
  };
  const novaColuna = () => {
    const nome = window.prompt('Nome da nova coluna:');
    if (nome?.trim()) executar(() => api.criarColuna(nome.trim()));
  };
  const importar = async (p) => {
    try {
      const r = await api.criarLista(p);
      setImportando(false);
      window.alert(`${r.importados} leads importados. ${r.duplicados} duplicados ignorados.`);
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-slate-800 bg-slate-900/90 px-6 py-4 backdrop-blur">
        <h1 className="mr-auto text-lg font-bold">ProspecDash SaaS</h1>

        <nav className="flex gap-1 rounded-xl border border-slate-800 bg-slate-950 p-1">
          {[['kanban', 'Kanban'], ['tabela', 'Lista Completa'], ['dashboard', 'Dashboard']].map(([id, label]) => (
            <button key={id} onClick={() => setAba(id)}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${aba === id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
              {label}
            </button>
          ))}
        </nav>

        <select value={filtros.listaId} onChange={set('listaId')} className={INP}>
          <option value="todas">Todas as listas</option>
          {dados.listas.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
        </select>

        <button onClick={novaColuna} className={GHOST}>+ Coluna</button>
        <button onClick={() => setImportando(true)} className={GHOST}>Importar lista</button>
        <button onClick={() => baixarCsv(leads, dados.colunas, dados.listas)} className={GHOST}>Exportar CSV</button>
        <button onClick={() => setEdicao({})} className={PRIMARIO}>+ Lead</button>
        <button onClick={() => setTrocandoSenha(true)} className={GHOST}>Senha</button>
        <button onClick={sair} className="rounded-xl border border-slate-800 px-3 py-2 text-xs text-slate-400 hover:text-rose-400">Sair</button>
      </header>

      <div className="flex flex-wrap items-center gap-3 border-b border-slate-800 bg-slate-900/50 px-6 py-3">
        <input className={INP + ' w-64'} placeholder="Buscar nome, dono, telefone, Instagram…" value={filtros.busca} onChange={set('busca')} />
        <select className={INP} value={filtros.status} onChange={set('status')}>
          <option value="todos">Todos os status</option>
          {STATUS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <input type="number" min="0" className={INP + ' w-32'} placeholder="★ mínimo" value={filtros.minAval} onChange={set('minAval')} />
        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input type="checkbox" checked={filtros.soRetornos} onChange={set('soRetornos')} /> Só retornos pendentes
        </label>
        <span className="ml-auto text-xs text-slate-400">{leads.length} leads</span>
      </div>

      {erro && (
        <div className="mx-6 mt-4 flex justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
          <span>{erro}</span>
          <button onClick={() => setErro('')}>×</button>
        </div>
      )}

      <main className="p-6">
        {aba === 'kanban' && (
          <Kanban colunas={dados.colunas} leads={leads} listas={dados.listas}
            onMover={moverLead} onDetalhe={(l) => setDetalhe(l.id)} onExcluir={excluirLead} />
        )}
        {aba === 'tabela' && (
          <Tabela leads={leads} listas={dados.listas} colunas={dados.colunas} onDetalhe={(l) => setDetalhe(l.id)} />
        )}
        {aba === 'dashboard' && (
          <Dashboard leads={comRetorno} listas={dados.listas} colunas={dados.colunas} />
        )}
      </main>

      {detalheLead && (
        <DetalheModal lead={detalheLead} contatos={dados.contatos} listas={dados.listas} colunas={dados.colunas}
          onNota={(nota, proximo) => executar(() => api.criarContato(detalheLead.id, nota, proximo))}
          onEditar={() => { setEdicao(detalheLead); setDetalhe(null); }}
          onExcluir={() => excluirLead(detalheLead.id)}
          onFechar={() => setDetalhe(null)} />
      )}
      {edicao && (
        <LeadModal lead={edicao} listas={dados.listas} colunas={dados.colunas}
          listaPadrao={filtros.listaId !== 'todas' ? filtros.listaId : dados.listas[0]?.id}
          onSalvar={(l) => executar(async () => { await api.salvarLead(l); setEdicao(null); })}
          onFechar={() => setEdicao(null)} />
      )}
      {importando && <ImportModal onImportar={importar} onFechar={() => setImportando(false)} />}
      {trocandoSenha && (
        <SenhaModal
          onSalvar={async (atual, nova) => {
            await api.trocarSenha(atual, nova);
            setTrocandoSenha(false);
            window.alert('Senha alterada com sucesso.');
          }}
          onFechar={() => setTrocandoSenha(false)} />
      )}
    </div>
  );
}
