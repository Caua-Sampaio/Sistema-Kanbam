import { useEffect, useState } from 'react';

const INP = 'mt-4 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20';
const GHOST = 'rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200';

const ICONE_LIXEIRA = (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
  </svg>
);
const ICONE_MAIS = (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

// Diálogo de confirmação e de entrada de texto, no padrão visual do sistema
export default function Dialogo({ titulo, mensagem, confirmarTexto = 'Confirmar', perigo = false, campo, onConfirmar, onFechar }) {
  const [valor, setValor] = useState('');
  const bloqueado = Boolean(campo?.obrigatorio) && !valor.trim();

  useEffect(() => {
    const fechaComEsc = (e) => { if (e.key === 'Escape') onFechar(); };
    window.addEventListener('keydown', fechaComEsc);
    return () => window.removeEventListener('keydown', fechaComEsc);
  }, []);

  const confirmar = () => { if (!bloqueado) onConfirmar(valor.trim()); };

  const tonalidade = perigo
    ? { icone: 'bg-rose-500/15 text-rose-400', botao: 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20' }
    : { icone: 'bg-indigo-500/15 text-indigo-400', botao: 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20' };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onFechar}>
      <div className="w-full max-w-sm animate-[surgir_.18s_ease-out] rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <div className={`flex h-11 w-11 items-center justify-center rounded-full ${tonalidade.icone}`}>
          {perigo ? ICONE_LIXEIRA : ICONE_MAIS}
        </div>

        <h2 className="mt-4 text-base font-semibold text-slate-100">{titulo}</h2>
        {mensagem && <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{mensagem}</p>}

        {campo && (
          <input autoFocus className={INP} placeholder={campo.placeholder} value={valor}
            onChange={(e) => setValor(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') confirmar(); }} />
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button className={GHOST} onClick={onFechar}>Cancelar</button>
          <button autoFocus={!campo} disabled={bloqueado} onClick={confirmar}
            className={`rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-40 ${tonalidade.botao}`}>
            {confirmarTexto}
          </button>
        </div>
      </div>
    </div>
  );
}
