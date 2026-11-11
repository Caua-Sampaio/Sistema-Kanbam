export default function Dashboard({ leads, listas, colunas }) {
  const ativos = leads.filter((l) => listas.find((x) => x.id === l.listaId)?.ativa !== false);
  const total = ativos.length;
  const idGanho = colunas.find((c) => c.tipo === 'ganho')?.id;
  const ganhos = ativos.filter((l) => l.colunaId === idGanho).length;
  const semSite = ativos.filter((l) => l.statusSite === 'Sem site').length;
  const funil = colunas.map((c) => ({ nome: c.nome, valor: ativos.filter((l) => l.colunaId === c.id).length }));
  const max = Math.max(1, ...funil.map((f) => f.valor));
  const kpis = [
    ['Leads em listas ativas', total],
    ['Taxa de conversão', `${total ? ((ganhos / total) * 100).toFixed(1) : '0.0'}%`],
    ['Sem site', semSite],
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {kpis.map(([titulo, valor]) => (
          <div key={titulo} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-400">{titulo}</p>
            <p className="mt-2 text-3xl font-bold text-slate-100">{valor}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h3 className="mb-4 font-semibold text-slate-200">Funil do Kanban</h3>
        <div className="flex h-56 items-end gap-3">
          {funil.map((f) => (
            <div key={f.nome} className="flex h-full flex-1 flex-col justify-end text-center">
              <span className="mb-1 text-xs font-semibold text-slate-300">{f.valor}</span>
              <div className="rounded-t-md bg-indigo-500" style={{ height: `${(f.valor / max) * 85}%` }} />
              <span className="mt-2 text-[11px] text-slate-400">{f.nome}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
