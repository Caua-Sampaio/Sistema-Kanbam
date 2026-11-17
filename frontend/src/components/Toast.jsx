import { useEffect } from 'react';

const ICONE_OK = (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

export default function Toast({ texto, acaoTexto, onAcao, onFechar }) {
  useEffect(() => {
    const t = setTimeout(onFechar, 6000);
    return () => clearTimeout(t);
  }, [texto]);

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm animate-[surgir_.2s_ease-out] overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/95 shadow-2xl backdrop-blur">
      <div className="flex items-start gap-3 px-4 py-3.5">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
          {ICONE_OK}
        </span>
        <p className="flex-1 pt-1 text-sm leading-snug text-slate-100">{texto}</p>
        <button onClick={onFechar} aria-label="Fechar"
          className="-mr-1 rounded-lg px-1.5 text-lg leading-none text-slate-500 hover:bg-slate-800 hover:text-slate-200">×</button>
      </div>

      {acaoTexto && (
        <div className="flex justify-end border-t border-slate-800 px-4 py-2">
          <button onClick={() => { onAcao(); onFechar(); }}
            className="rounded-lg px-2 py-1 text-xs font-semibold text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300">
            {acaoTexto}
          </button>
        </div>
      )}

      <div className="h-0.5 bg-indigo-500" style={{ animation: 'encolher 6s linear forwards' }} />
    </div>
  );
}
