import { useState } from 'react';
import { formatarData, whatsappLink } from '../utils';

const INP = 'w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none';
const LBL = 'mb-1 block text-xs font-semibold text-slate-400';
const BTN = 'rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50';
const GHOST = 'rounded-xl bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700';
const STATUS = ['Sem site', 'Possui site', 'Em construção'];
const EXEMPLO = 'Clínica Aurora;Dra. Paula;87;Seg–Sex 9h–18h;(15) 99999-0001;@clinicaaurora;Sem site';

function Shell({ titulo, largura = 'max-w-lg', onFechar, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onFechar}>
      <div className={`max-h-[90vh] w-full ${largura} overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}>
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
      <label className={LBL}>Leads ({linhas.length} válidos). Duplicados por telefone ou Instagram são ignorados.</label>
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

export function DetalheModal({ lead, contatos, listas, colunas, onNota, onEditar, onExcluir, onFechar }) {
  const [nota, setNota] = useState('');
  const [proximo, setProximo] = useState('');
  const wa = whatsappLink(lead.telefone);
  const lista = listas.find((l) => l.id === lead.listaId)?.nome ?? '—';
  const coluna = colunas.find((c) => c.id === lead.colunaId)?.nome ?? '—';
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
        <p><span className="text-slate-300">Coluna:</span> {coluna} · <span className="text-slate-300">Lista:</span> {lista}</p>
        {lead.retorno && <p className="text-sky-400">Próximo retorno: {formatarData(lead.retorno)}</p>}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {wa && (
          <a href={wa} target="_blank" rel="noreferrer"
            className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-500">Abrir no WhatsApp</a>
        )}
        <button className={GHOST} onClick={onEditar}>Editar dados</button>
        <button className="rounded-xl px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10" onClick={onExcluir}>Excluir</button>
      </div>

      <form onSubmit={salvar} className="mb-4 space-y-2 rounded-xl border border-slate-800 bg-slate-950 p-3">
        <textarea rows={3} className={INP} placeholder="Registrar contato (o que aconteceu, o que ficou combinado)"
          value={nota} onChange={(e) => setNota(e.target.value)} />
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs text-slate-400">Retornar em
            <input type="date" className={INP + ' !w-auto'} value={proximo} onChange={(e) => setProximo(e.target.value)} />
          </label>
          <button type="submit" className={BTN} disabled={!nota.trim()}>Registrar contato</button>
        </div>
      </form>

      <div className="max-h-60 space-y-2 overflow-y-auto">
        {historico.length === 0 && <p className="text-xs text-slate-500">Nenhum contato registrado ainda.</p>}
        {historico.map((c) => (
          <div key={c.id} className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <p className="text-[10px] text-slate-500">
              {formatarData(c.criadoEm)}{c.proximoContato ? ` · retorno em ${formatarData(c.proximoContato)}` : ''}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-xs text-slate-200">{c.nota}</p>
          </div>
        ))}
      </div>
    </Shell>
  );
}

export function SenhaModal({ onSalvar, onFechar }) {
  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const [confirma, setConfirma] = useState('');
  const [erro, setErro] = useState('');

  const enviar = async (e) => {
    e.preventDefault();
    if (nova !== confirma) return setErro('As senhas novas não coincidem.');
    if (nova.length < 6) return setErro('A nova senha precisa ter 6 caracteres ou mais.');
    try {
      await onSalvar(atual, nova);
    } catch (err) {
      setErro(err.message);
    }
  };

  return (
    <Shell titulo="Trocar senha" onFechar={onFechar}>
      <form onSubmit={enviar} className="space-y-3">
        <input type="password" className={INP} placeholder="Senha atual" value={atual} onChange={(e) => setAtual(e.target.value)} required />
        <input type="password" className={INP} placeholder="Nova senha" value={nova} onChange={(e) => setNova(e.target.value)} required />
        <input type="password" className={INP} placeholder="Confirmar nova senha" value={confirma} onChange={(e) => setConfirma(e.target.value)} required />
        {erro && <p className="text-xs text-rose-400">{erro}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={GHOST} onClick={onFechar}>Cancelar</button>
          <button type="submit" className={BTN}>Salvar senha</button>
        </div>
      </form>
    </Shell>
  );
}
