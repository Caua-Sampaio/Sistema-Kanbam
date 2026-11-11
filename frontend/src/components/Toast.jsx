import { useEffect } from 'react';

export default function Toast({ texto, acaoTexto, onAcao, onFechar }) {
  useEffect(() => {
    const t = setTimeout(onFechar, 6000);
    return () => clearTimeout(t);
  }, [texto]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-4 rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm text-slate-100 shadow-2xl">
      <span>{texto}</span>
      {acaoTexto && (
        <button onClick={() => { onAcao(); onFechar(); }} className="shrink-0 font-semibold text-indigo-400 hover:text-indigo-300">
          {acaoTexto}
        </button>
      )}
    </div>
  );
}
