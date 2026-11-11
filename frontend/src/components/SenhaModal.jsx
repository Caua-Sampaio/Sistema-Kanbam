import { useState } from 'react';
import Shell from './Shell';

const INP = 'w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none';
const BTN = 'rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500';
const GHOST = 'rounded-xl bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700';

export default function SenhaModal({ onSalvar, onFechar }) {
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
