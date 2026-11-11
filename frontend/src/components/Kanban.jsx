import { formatarData, hoje, whatsappLink } from '../utils';

const CORES = {
  'Sem site': 'bg-red-500/15 text-red-300',
  'Possui site': 'bg-emerald-500/15 text-emerald-300',
  'Em construção': 'bg-amber-500/15 text-amber-300',
};

export default function Kanban({ colunas, leads, listas, onMover, onDetalhe, onExcluir }) {
  const nomeLista = (id) => listas.find((l) => l.id === id)?.nome ?? '—';
  const hojeStr = hoje();

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {colunas.map((col) => {
        const cards = leads.filter((l) => l.colunaId === col.id);
        return (
          <section key={col.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (id) onMover(id, col.id); }}
            className="flex w-72 shrink-0 flex-col rounded-2xl border border-slate-800 bg-slate-900/50 p-3">
            <header className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">{col.nome}</h2>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-bold text-indigo-400">{cards.length}</span>
            </header>
            <div className="flex flex-col gap-3">
              {cards.map((l) => {
                const atrasado = l.retorno && l.retorno <= hojeStr;
                const wa = whatsappLink(l.telefone);
                return (
                  <article key={l.id} draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', l.id)}
                    onClick={() => onDetalhe(l)}
                    className={`cursor-pointer rounded-xl border bg-slate-900 p-3.5 shadow-md hover:border-indigo-500/50 ${atrasado ? 'border-rose-500/60' : 'border-slate-800'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-xs font-semibold leading-tight text-slate-100">{l.empresa}</h3>
                      <button onClick={(e) => { e.stopPropagation(); onExcluir(l.id); }}
                        className="text-xs text-slate-500 hover:text-red-400" aria-label="Excluir">✕</button>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">{l.dono}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300">★ {l.avaliacoes}</span>
                      <span className={`rounded px-1.5 py-0.5 font-medium ${CORES[l.statusSite] ?? ''}`}>{l.statusSite}</span>
                    </div>
                    {l.retorno && (
                      <p className={`mt-2 text-[10px] font-medium ${atrasado ? 'text-rose-400' : 'text-sky-400'}`}>
                        Retorno {formatarData(l.retorno)}{atrasado ? ' · pendente' : ''}
                      </p>
                    )}
                    <p className="mt-2 truncate text-[10px] text-slate-500">{nomeLista(l.listaId)}</p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{l.telefone}</span>
                      {wa && (
                        <a href={wa} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                          className="font-medium text-emerald-400 hover:underline">WhatsApp</a>
                      )}
                    </div>
                  </article>
                );
              })}
              {cards.length === 0 && (
                <p className="rounded-xl border-2 border-dashed border-slate-800 py-6 text-center text-xs text-slate-500">Solte um lead aqui</p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
