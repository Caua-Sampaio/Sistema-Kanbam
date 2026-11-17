import { useState } from 'react';
import Shell from './Shell';

const INP = 'w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none';
const LBL = 'mb-1 block text-xs font-semibold text-slate-400';
const BTN = 'rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50';
const GHOST = 'rounded-xl bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700';
const STATUS = ['Sem site', 'Possui site', 'Em construção'];

export default function LeadModal({ lead, listas, colunas, listaPadrao, onSalvar, onFechar }) {
  const [f, setF] = useState({
    empresa: '', dono: '', avaliacoes: 0, horario: '', telefone: '', instagram: '',
    bairro: '', nicho: '', origem: '', site: '', statusSite: 'Sem site',
    colunaId: colunas[0]?.id, listaId: listaPadrao, ...lead,
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const campos = [['empresa', 'Empresa'], ['dono', 'Dono(a)'], ['avaliacoes', 'Avaliações', 'number'],
    ['horario', 'Horário'], ['telefone', 'Telefone'], ['instagram', 'Instagram'],
    ['bairro', 'Bairro'], ['nicho', 'Nicho'], ['origem', 'Origem (de onde veio)'], ['site', 'Link do site (se tiver)']];

  return (
    <Shell titulo={lead.id ? 'Editar lead' : 'Novo lead'} onFechar={onFechar}>
      <form className="grid grid-cols-2 gap-4" onSubmit={(e) => { e.preventDefault(); onSalvar({ ...f, avaliacoes: Number(f.avaliacoes) || 0 }); }}>
        {campos.map(([k, label, type]) => (
          <div key={k} className={k === 'empresa' ? 'col-span-2' : ''}>
            <label className={LBL}>{label}</label>
            <input type={type || 'text'} required={k === 'empresa'} className={INP} value={f[k] ?? ''} onChange={set(k)} />
          </div>
        ))}
        <div>
          <label className={LBL}>Status do site</label>
          <select className={INP} value={f.statusSite} onChange={set('statusSite')}>
            {STATUS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={LBL}>Lista</label>
          <select className={INP} value={f.listaId} onChange={set('listaId')}>
            {listas.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className={LBL}>Coluna</label>
          <select className={INP} value={f.colunaId} onChange={set('colunaId')}>
            {colunas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <div className="col-span-2 mt-2 flex justify-end gap-2">
          <button type="button" className={GHOST} onClick={onFechar}>Cancelar</button>
          <button type="submit" className={BTN}>Salvar</button>
        </div>
      </form>
    </Shell>
  );
}
