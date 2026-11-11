const GHOST = 'rounded-xl px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800';
const PRIMARIO = 'rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500';
const INP = 'rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none';

export default function Cabecalho({ aba, setAba, listas, listaId, setListaId, acoes }) {
  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-slate-800 bg-slate-900/90 px-4 py-3 backdrop-blur md:px-6 md:py-4">
      <h1 className="mr-auto text-lg font-bold">ProspecDash SaaS</h1>

      <nav className="flex gap-1 rounded-xl border border-slate-800 bg-slate-950 p-1">
        {[['kanban', 'Kanban'], ['tabela', 'Lista'], ['dashboard', 'Dashboard']].map(([id, label]) => (
          <button key={id} onClick={() => setAba(id)}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition md:px-4 ${aba === id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
            {label}
          </button>
        ))}
      </nav>

      <select value={listaId} onChange={(e) => setListaId(e.target.value)} className={INP}>
        <option value="todas">Todas as listas</option>
        {listas.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
      </select>

      <button onClick={acoes.novaColuna} className={GHOST}>+ Coluna</button>
      <button onClick={acoes.importar} className={GHOST}>Importar</button>
      <button onClick={acoes.exportar} className={GHOST}>CSV</button>
      <button onClick={acoes.backup} className={GHOST}>Backup</button>
      <button onClick={acoes.novoLead} className={PRIMARIO}>+ Lead</button>
      <button onClick={acoes.senha} className={GHOST}>Senha</button>
      <button onClick={acoes.sair} className="rounded-xl border border-slate-800 px-3 py-2 text-xs text-slate-400 hover:text-rose-400">Sair</button>
    </header>
  );
}
