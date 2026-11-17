const STATUS = ['Sem site', 'Possui site', 'Em construção', 'Não verificado'];
const INP = 'rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none';

export default function Filtros({ filtros, setFiltros, total }) {
  const set = (k) => (e) =>
    setFiltros({ ...filtros, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 bg-slate-900/50 px-4 py-3 md:gap-3 md:px-6">
      <input className={INP + ' w-full sm:w-56'} placeholder="Buscar nome, dono, telefone…" value={filtros.busca} onChange={set('busca')} />
      <input className={INP + ' w-28'} placeholder="Bairro" value={filtros.bairro} onChange={set('bairro')} />
      <input className={INP + ' w-28'} placeholder="Nicho" value={filtros.nicho} onChange={set('nicho')} />
      <input className={INP + ' w-28'} placeholder="Origem" value={filtros.origem} onChange={set('origem')} />
      <select className={INP} value={filtros.status} onChange={set('status')}>
        <option value="todos">Todos os status</option>
        {STATUS.map((s) => <option key={s}>{s}</option>)}
      </select>
      <input type="number" min="0" className={INP + ' w-28'} placeholder="★ mínimo" value={filtros.minAval} onChange={set('minAval')} />
      <label className="flex items-center gap-2 text-xs text-slate-300">
        <input type="checkbox" checked={filtros.soRetornos} onChange={set('soRetornos')} /> Só retornos pendentes
      </label>
      <span className="ml-auto text-xs text-slate-400">{total} leads</span>
    </div>
  );
}
