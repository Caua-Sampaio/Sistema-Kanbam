import { useState } from 'react';
import { formatarData, hoje, whatsappComMensagem } from '../utils';

const TAMANHO = 50;
const TITULOS = ['Empresa', 'Dono(a)', 'Telefone', 'Instagram', '★', 'Bairro', 'Nicho', 'Origem', 'Status do site', 'Coluna', 'Lista', 'Retorno'];

export default function Tabela({ leads, listas, colunas, onDetalhe }) {
  const [pagina, setPagina] = useState(0);
  const totalPaginas = Math.max(1, Math.ceil(leads.length / TAMANHO));
  const atual = Math.min(pagina, totalPaginas - 1);
  const visiveis = leads.slice(atual * TAMANHO, atual * TAMANHO + TAMANHO);
  const nomeCol = (id) => colunas.find((c) => c.id === id)?.nome ?? '—';
  const nomeLista = (id) => listas.find((l) => l.id === id)?.nome ?? '—';
  const hojeStr = hoje();

  return (
    <div>
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="bg-slate-950/80 text-[10px] uppercase tracking-wider text-slate-400">
            <tr>{TITULOS.map((t) => <th key={t} className="whitespace-nowrap p-3 font-semibold">{t}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {visiveis.map((l) => {
              const wa = whatsappComMensagem(l);
              const atrasado = l.retorno && l.retorno <= hojeStr;
              return (
                <tr key={l.id} onClick={() => onDetalhe(l)} className="cursor-pointer hover:bg-slate-800/40">
                  <td className="whitespace-nowrap p-3 font-semibold text-slate-100">{l.empresa}</td>
                  <td className="whitespace-nowrap p-3 text-slate-400">{l.dono || '—'}</td>
                  <td className="whitespace-nowrap p-3">
                    {wa ? (
                      <a href={wa} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                        className="text-emerald-400 hover:underline">{l.telefone}</a>
                    ) : (l.telefone || '—')}
                  </td>
                  <td className="whitespace-nowrap p-3 text-indigo-400">{l.instagram || '—'}</td>
                  <td className="p-3 text-amber-400">{l.avaliacoes}</td>
                  <td className="whitespace-nowrap p-3">{l.bairro || '—'}</td>
                  <td className="whitespace-nowrap p-3">{l.nicho || '—'}</td>
                  <td className="whitespace-nowrap p-3">{l.origem || '—'}</td>
                  <td className="whitespace-nowrap p-3">{l.statusSite}</td>
                  <td className="whitespace-nowrap p-3">{nomeCol(l.colunaId)}</td>
                  <td className="whitespace-nowrap p-3 text-slate-400">{nomeLista(l.listaId)}</td>
                  <td className={`whitespace-nowrap p-3 ${atrasado ? 'font-medium text-rose-400' : 'text-sky-400'}`}>
                    {l.retorno ? formatarData(l.retorno) : '—'}
                  </td>
                </tr>
              );
            })}
            {leads.length === 0 && (
              <tr><td colSpan={TITULOS.length} className="p-6 text-center text-slate-500">Nenhum lead com esses filtros</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        <span>Página {atual + 1} de {totalPaginas}</span>
        <div className="flex gap-2">
          <button disabled={atual === 0} onClick={() => setPagina(atual - 1)}
            className="rounded-xl bg-slate-800 px-3 py-2 text-slate-300 disabled:opacity-40">Anterior</button>
          <button disabled={atual >= totalPaginas - 1} onClick={() => setPagina(atual + 1)}
            className="rounded-xl bg-slate-800 px-3 py-2 text-slate-300 disabled:opacity-40">Próxima</button>
        </div>
      </div>
    </div>
  );
}
