import { useState } from 'react';

const INP = 'w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none';
const LBL = 'mb-1 block text-xs font-semibold text-slate-400';
const BTN = 'rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50';
const GHOST = 'rounded-xl bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700';
const STATUS = ['Sem site', 'Possui site', 'Em construção'];
const EXEMPLO = 'Clínica Aurora;Dra. Paula;87;Seg–Sex 9h–18h;(15) 99999-0001;@clinicaaurora;Sem site';

function Shell({ titulo, largura = 'max-w-lg', onFechar, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onFechar}>
      <div className={`w-full ${largura} rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl`} onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-semibold text-slate-100">{titulo}</h2>
        {children}
      </div>
    </div>
  );
}

export function LeadModal({ lead, listas, colunas, listaPadrao, onSalvar, onFechar }) {
  const [f, setF] = useState({
    empresa: '', dono: '', avaliacoes: 0, horario: '', telefone: '', instagram: '',
    statusSite: 'Sem site', colunaId: colunas[0]?.id, listaId: listaPadrao, ...lead,
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const campos = [['empresa', 'Empresa'], ['dono', 'Dono(a)'], ['avaliacoes', 'Avaliações', 'number'],
    ['horario', 'Horário'], ['telefone', 'Telefone'], ['instagram', 'Instagram']];

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

// Formato por linha: empresa;dono;avaliacoes;horario;telefone;instagram;statusSite
export function parsearLinhas(texto) {
  return texto.split('\n').map((l) => l.trim()).filter(Boolean).map((linha) => {
    const c = linha.split(';').map((x) => (x || '').trim());
    return {
      empresa: c[0] || '', dono: c[1] || '', avaliacoes: Number(c[2]) || 0,
      horario: c[3] || '', telefone: c[4] || '', instagram: c[5] || '',
      statusSite: STATUS.includes(c[6]) ? c[6] : 'Sem site',
    };
  }).filter((r) => r.empresa);
}

export function ImportModal({ onImportar, onFechar }) {
  const [nome, setNome] = useState('');
  const [nicho, setNicho] = useState('');
  const [cidade, setCidade] = useState('');
  const [texto, setTexto] = useState('');
  const linhas = parsearLinhas(texto);

  return (
    <Shell titulo="Importar nova lista em lote" largura="max-w-2xl" onFechar={onFechar}>
      <div className="mb-4 grid grid-cols-3 gap-4">
        <input className={INP} placeholder="Nome da lista" value={nome} onChange={(e) => setNome(e.target.value)} />
        <input className={INP} placeholder="Nicho" value={nicho} onChange={(e) => setNicho(e.target.value)} />
        <input className={INP} placeholder="Cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
      </div>
      <label className={LBL}>Leads ({linhas.length} válidos)</label>
      <textarea rows={10} className={INP + ' font-mono'} placeholder={EXEMPLO} value={texto} onChange={(e) => setTexto(e.target.value)} />
      <div className="mt-4 flex justify-end gap-2">
        <button className={GHOST} onClick={onFechar}>Cancelar</button>
        <button className={BTN} disabled={!nome || linhas.length === 0}
          onClick={() => onImportar({ nome, nicho, cidade, linhas })}>
          Importar {linhas.length} leads
        </button>
      </div>
    </Shell>
  );
}
