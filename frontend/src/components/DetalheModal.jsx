import { useState } from 'react';
import Shell from './Shell';
import { formatarData, whatsappComMensagem } from '../utils';

const INP = 'w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none';
const BTN = 'rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50';
const GHOST = 'rounded-xl bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700';

function ContatoItem({ c, onSalvar, onExcluir }) {
  const [editando, setEditando] = useState(false);
  const [nota, setNota] = useState(c.nota);
  const [proximo, setProximo] = useState(c.proximoContato || '');

  if (editando) {
    return (
      <div className="space-y-2 rounded-xl border border-indigo-500/40 bg-slate-950 p-3">
        <textarea rows={3} className={INP} value={nota} onChange={(e) => setNota(e.target.value)} />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <input type="date" className={INP + ' !w-auto'} value={proximo} onChange={(e) => setProximo(e.target.value)} />
          <div className="flex gap-2">
            <button className={GHOST} onClick={() => setEditando(false)}>Cancelar</button>
            <button className={BTN} disabled={!nota.trim()}
              onClick={async () => { await onSalvar(c.id, nota.trim(), proximo); setEditando(false); }}>Salvar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] text-slate-500">
          {formatarData(c.criadoEm)}{c.proximoContato ? ` · retorno em ${formatarData(c.proximoContato)}` : ''}
        </p>
        <div className="flex shrink-0 gap-3 text-[11px]">
          <button className="text-indigo-400 hover:underline"
            onClick={() => { setNota(c.nota); setProximo(c.proximoContato || ''); setEditando(true); }}>Editar</button>
          <button className="text-rose-400 hover:underline" onClick={() => onExcluir(c.id)}>Excluir</button>
        </div>
      </div>
      <p className="mt-1 whitespace-pre-wrap text-xs text-slate-200">{c.nota}</p>
    </div>
  );
}

export default function DetalheModal({ lead, contatos, listas, colunas, onNota, onEditarContato, onExcluirContato, onMover, onEditar, onExcluir, onFechar }) {
  const [nota, setNota] = useState('');
  const [proximo, setProximo] = useState('');
  const wa = whatsappComMensagem(lead);
  const lista = listas.find((l) => l.id === lead.listaId)?.nome ?? '—';
  const historico = contatos
    .filter((c) => c.leadId === lead.id)
    .sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1));

  const salvar = async (e) => {
    e.preventDefault();
    await onNota(nota.trim(), proximo);
    setNota('');
    setProximo('');
  };

  return (
    <Shell titulo={lead.empresa} largura="max-w-xl" onFechar={onFechar}>
      <div className="mb-4 space-y-1 text-xs text-slate-400">
        <p><span className="text-slate-300">Dono(a):</span> {lead.dono || '—'} · <span className="text-slate-300">Horário:</span> {lead.horario || '—'}</p>
        <p><span className="text-slate-300">Telefone:</span> {lead.telefone || '—'} · <span className="text-slate-300">Instagram:</span> {lead.instagram || '—'}</p>
        <p><span className="text-slate-300">Avaliações:</span> {lead.avaliacoes} · <span className="text-slate-300">Site:</span> {lead.statusSite}</p>
        <p><span className="text-slate-300">Bairro:</span> {lead.bairro || '—'} · <span className="text-slate-300">Nicho:</span> {lead.nicho || '—'} · <span className="text-slate-300">Origem:</span> {lead.origem || '—'}</p>
        <p><span className="text-slate-300">Lista:</span> {lista}</p>
        {lead.retorno && <p className="text-sky-400">Próximo retorno: {formatarData(lead.retorno)}</p>}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {wa && (
          <a href={wa} target="_blank" rel="noreferrer"
            className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-500">WhatsApp</a>
        )}
        <button className={GHOST} onClick={onEditar}>Editar dados</button>
        <button className="rounded-xl px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10" onClick={onExcluir}>Excluir</button>
        <select className={INP + ' !w-auto'} value={lead.colunaId} onChange={(e) => onMover(lead.id, e.target.value)}>
          {colunas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>

      <form onSubmit={salvar} className="mb-4 space-y-2 rounded-xl border border-slate-800 bg-slate-950 p-3">
        <textarea rows={3} className={INP} placeholder="Registrar contato (o que aconteceu, o que ficou combinado)"
          value={nota} onChange={(e) => setNota(e.target.value)} />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs text-slate-400">Retornar em
            <input type="date" className={INP + ' !w-auto'} value={proximo} onChange={(e) => setProximo(e.target.value)} />
          </label>
          <button type="submit" className={BTN} disabled={!nota.trim()}>Registrar contato</button>
        </div>
      </form>

      <div className="max-h-72 space-y-2 overflow-y-auto">
        {historico.length === 0 && <p className="text-xs text-slate-500">Nenhum contato registrado ainda.</p>}
        {historico.map((c) => (
          <ContatoItem key={c.id} c={c} onSalvar={onEditarContato} onExcluir={onExcluirContato} />
        ))}
      </div>
    </Shell>
  );
}
