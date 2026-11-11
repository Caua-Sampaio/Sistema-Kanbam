import { useState } from 'react';
import Shell from './Shell';
import { baixarModelo, csvParaLeads, parsearLinhas } from '../csvParser';
import { arquivoParaCsv } from '../leitorArquivo';

const INP = 'w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none';
const LBL = 'mb-1 block text-xs font-semibold text-slate-400';
const BTN = 'rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50';
const GHOST = 'rounded-xl bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700';
const EXEMPLO = 'Clínica Aurora;Dra. Paula;87;Seg–Sex 9h–18h;(15) 99999-0001;@clinicaaurora;Sem site';

export default function ImportModal({ onImportar, onFechar }) {
  const [nome, setNome] = useState('');
  const [nicho, setNicho] = useState('');
  const [cidade, setCidade] = useState('');
  const [texto, setTexto] = useState('');
  const [linhas, setLinhas] = useState([]);
  const [arquivo, setArquivo] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  const escolherArquivo = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const lidos = csvParaLeads(await arquivoParaCsv(f));
      if (lidos.length === 0) throw new Error('Nenhum lead encontrado no arquivo.');
      setLinhas(lidos);
      setArquivo(f.name);
      setTexto('');
      if (!nome) setNome(f.name.replace(/\.(csv|xlsx?)$/i, ''));
      setErro('');
    } catch (err) {
      setLinhas([]);
      setArquivo('');
      setErro(err.message);
    }
  };

  const colar = (valor) => {
    setTexto(valor);
    setLinhas(parsearLinhas(valor));
    setArquivo('');
    setErro('');
  };

  const enviar = async () => {
    setEnviando(true);
    try {
      await onImportar({ nome, nicho, cidade, linhas });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Shell titulo="Importar leads" largura="max-w-2xl" onFechar={onFechar}>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input className={INP} placeholder="Nome da lista" value={nome} onChange={(e) => setNome(e.target.value)} />
        <input className={INP} placeholder="Nicho" value={nicho} onChange={(e) => setNicho(e.target.value)} />
        <input className={INP} placeholder="Cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
      </div>

      <div className="mb-4 rounded-xl border border-dashed border-slate-700 bg-slate-950 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-200">Arquivo CSV ou XLSX</p>
            <p className="mt-1 text-[11px] text-slate-500">
              Colunas: Empresa, Dono(a), Avaliações, Horário, Telefone, Instagram, Status do site, Bairro, Nicho, Origem.
              Vale a primeira planilha do arquivo.
            </p>
          </div>
          <button type="button" className={GHOST} onClick={baixarModelo}>Modelo</button>
        </div>
        <input type="file" accept=".csv,.xlsx,.xls,text/csv" onChange={escolherArquivo}
          className="mt-3 block w-full text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-2 file:text-white hover:file:bg-indigo-500" />
      </div>

      <label className={LBL}>Ou cole os dados (uma linha por lead, campos separados por ;)</label>
      <textarea rows={5} className={INP + ' font-mono'} placeholder={EXEMPLO} value={texto} onChange={(e) => colar(e.target.value)} />

      {erro && <p className="mt-3 text-xs text-rose-400">{erro}</p>}
      <p className="mt-3 text-xs text-slate-400">
        {linhas.length > 0
          ? `${linhas.length} leads prontos${arquivo ? ` (de ${arquivo})` : ''}. Duplicados por telefone ou Instagram serão ignorados.`
          : 'Nenhum lead carregado ainda.'}
      </p>

      <div className="mt-4 flex justify-end gap-2">
        <button className={GHOST} onClick={onFechar}>Cancelar</button>
        <button className={BTN} disabled={!nome || linhas.length === 0 || enviando} onClick={enviar}>
          Importar {linhas.length} leads
        </button>
      </div>
    </Shell>
  );
}
