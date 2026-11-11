export default function Shell({ titulo, largura = 'max-w-lg', onFechar, children }) {
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
