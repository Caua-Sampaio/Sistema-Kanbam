import { formatarData, hoje, whatsappLink } from '../utils';

const COLUNAS_TABELA = ['Empresa', 'Dono(a)', 'Telefone', 'Instagram', '★', 'Status do site', 'Coluna', 'Lista', 'Retorno'];

export default function Tabela({ leads, listas, colunas, onDetalhe }) {
  const nomeCol = (id) => colunas.find((c) => c.id === id)?.nome ?? '—';
  const nomeLista = (id) => listas.find((l) => l.id === id)?.nome ?? '—';
  const hojeStr = hoje();

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
      <table className="w-full border-collapse text-left text-xs">
        <thead className="bg-slate-950/80 text-[10px] uppercase tracking-wider text-slate-400">
          <tr>{COLUNAS_TABELA.map((t) => <th key={t} className="p-3 font-semibold">{t}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-800 text-slate-300">
          {leads.map((l) => {
            const wa = whatsappLink(l.telefone);
            const atrasado = l.retorno && l.retorno <= hojeStr;
            return (
              <tr key={l.id} onClick={() => onDetalhe(l)} className="cursor-pointer hover:bg-slate-800/40">
                <td className="p-3 font-semibold text-slate-100">{l.empresa}</td>
                <td className="p-3 text-slate-400">{l.dono || '—'}</td>
                <td className="p-3">
                  {wa ? (
                    <a href={wa} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                      className="text-emerald-400 hover:underline">{l.telefone}</a>
                  ) : (l.telefone || '—')}
                </td>
                <td className="p-3 text-indigo-400">{l.instagram || '—'}</td>
                <td className="p-3 text-amber-400">{l.avaliacoes}</td>
                <td className="p-3">{l.statusSite}</td>
                <td className="p-3">{nomeCol(l.colunaId)}</td>
                <td className="p-3 text-slate-400">{nomeLista(l.listaId)}</td>
                <td className={`p-3 ${atrasado ? 'font-medium text-rose-400' : 'text-sky-400'}`}>
                  {l.retorno ? formatarData(l.retorno) : '—'}
                </td>
              </tr>
            );
          })}
          {leads.length === 0 && (
            <tr><td colSpan={9} className="p-6 text-center text-slate-500">Nenhum lead com esses filtros</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
