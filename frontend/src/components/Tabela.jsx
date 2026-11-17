import { useState } from 'react';
import { formatarData, hoje, whatsappComMensagem } from '../utils';

const TAMANHO = 50;
const TITULOS = ['Empresa', 'Dono(a)', 'Telefone', 'Instagram', '★', 'Bairro', 'Nicho', 'Origem', 'Status do site', 'Coluna', 'Lista', 'Retorno'];
const BTN_GHOST = 'rounded-xl px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800';

export default function Tabela({ leads, listas, colunas, onDetalhe, onExcluirVarios }) {
  const [pagina, setPagina] = useState(0);
  const [marcados, setMarcados] = useState([]);

  const totalPaginas = Math.max(1, Math.ceil(leads.length / TAMANHO));
  const atual = Math.min(pagina, totalPaginas - 1);
  const visiveis = leads.slice(atual * TAMANHO, atual * TAMANHO + TAMANHO);
  const idsVisiveis = visiveis.map((l) => l.id);

  // Considera só os selecionados que ainda existem na lista atual (ex.: após filtrar ou excluir)
  const selecionados = marcados.filter((id) => leads.some((l) => l.id === id));
  const todosDaPaginaMarcados = idsVisiveis.length > 0 && idsVisiveis.every((id) => selecionados.includes(id));

  const alternar = (id) => setMarcados((atualMarcados) => (
    atualMarcados.includes(id) ? atualMarcados.filter((x) => x !== id) : [...atualMarcados, id]
  ));

  const alternarPagina = () => setMarcados((atualMarcados) => (
    todosDaPaginaMarcados
      ? atualMarcados.filter((id) => !idsVisiveis.includes(id))
      : [...new Set([...atualMarcados, ...idsVisiveis])]
  ));

  const nomeCol = (id) => colunas.find((c) => c.id === id)?.nome ?? '—';
  const nomeLista = (id) => listas.find((l) => l.id === id)?.nome ?? '—';
  const hojeStr = hoje();

  return (
    <div>
      {selecionados.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2.5">
          <span className="text-xs font-medium text-indigo-200">{selecionados.length} selecionado(s)</span>
          <div className="flex gap-2">
            <button className={BTN_GHOST} onClick={() => setMarcados([])}>Limpar seleção</button>
            <button onClick={() => onExcluirVarios(selecionados)}
              className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-600/20 hover:bg-rose-500">
              Excluir selecionados
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="bg-slate-950/80 text-[10px] uppercase tracking-wider text-slate-400">
            <tr>
              <th className="w-10 p-3">
                <input type="checkbox" className="accent-indigo-500" checked={todosDaPaginaMarcados}
                  onChange={alternarPagina} aria-label="Selecionar leads desta página" />
              </th>
              {TITULOS.map((t) => <th key={t} className="whitespace-nowrap p-3 font-semibold">{t}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {visiveis.map((l) => {
              const wa = whatsappComMensagem(l);
              const atrasado = l.retorno && l.retorno <= hojeStr;
              const marcado = selecionados.includes(l.id);
              return (
                <tr key={l.id} onClick={() => onDetalhe(l)}
                  className={`cursor-pointer hover:bg-slate-800/40 ${marcado ? 'bg-indigo-500/5' : ''}`}>
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" className="accent-indigo-500" checked={marcado}
                      onChange={() => alternar(l.id)} aria-label={`Selecionar ${l.empresa}`} />
                  </td>
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
              <tr><td colSpan={TITULOS.length + 1} className="p-6 text-center text-slate-500">Nenhum lead com esses filtros</td></tr>
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
