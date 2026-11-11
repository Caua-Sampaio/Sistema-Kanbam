import { hoje } from '../utils';

const FAIXAS = [['0–10', 0, 10], ['11–50', 11, 50], ['51–100', 51, 100], ['100+', 101, Infinity]];

function Barras({ dados, cor }) {
  const max = Math.max(1, ...dados.map((d) => d.valor));
  return (
    <div className="flex h-56 items-end gap-3">
      {dados.map((d) => (
        <div key={d.nome} className="flex h-full flex-1 flex-col justify-end text-center">
          <span className="mb-1 text-xs font-semibold text-slate-300">{d.valor}</span>
          <div className={`${cor} rounded-t-md`} style={{ height: `${(d.valor / max) * 85}%` }} />
          <span className="mt-2 text-[11px] text-slate-400">{d.nome}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard({ leads, listas, colunas }) {
  const ativos = leads.filter((l) => listas.find((x) => x.id === l.listaId)?.ativa !== false);
  const total = ativos.length;
  const idGanho = colunas.find((c) => c.tipo === 'ganho')?.id;
  const ganhos = ativos.filter((l) => l.colunaId === idGanho).length;
  const semSite = ativos.filter((l) => l.statusSite === 'Sem site').length;
  const pendentes = ativos.filter((l) => l.retorno && l.retorno <= hoje()).length;
  const funil = colunas.map((c) => ({ nome: c.nome, valor: ativos.filter((l) => l.colunaId === c.id).length }));
  const aval = FAIXAS.map(([nome, min, max]) => ({
    nome, valor: ativos.filter((l) => l.avaliacoes >= min && l.avaliacoes <= max).length,
  }));
  const kpis = [
    ['Leads em listas ativas', total],
    ['Taxa de conversão', `${total ? ((ganhos / total) * 100).toFixed(1) : '0.0'}%`],
    ['Sem site', semSite],
    ['Retornos pendentes', pendentes],
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(([titulo, valor]) => (
          <div key={titulo} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-400">{titulo}</p>
            <p className="mt-2 text-3xl font-bold text-slate-100">{valor}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="mb-4 font-semibold text-slate-200">Funil do Kanban</h3>
          <Barras dados={funil} cor="bg-indigo-500" />
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="mb-4 font-semibold text-slate-200">Distribuição por número de avaliações</h3>
          <Barras dados={aval} cor="bg-emerald-500" />
        </div>
      </div>
    </div>
  );
}
