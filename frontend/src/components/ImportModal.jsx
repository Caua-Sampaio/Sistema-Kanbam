import { useState } from 'react';
import Shell from './Shell';
import { analisarCsv, baixarModelo, parsearLinhas } from '../csvParser';
import { separarDuplicados } from '../utils';
import { arquivoParaCsv } from '../leitorArquivo';

const INP = 'w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none';
const LBL = 'mb-1 block text-xs font-semibold text-slate-400';
const BTN = 'rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50';
const GHOST = 'rounded-xl bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700';
const EXEMPLO = 'Clínica Aurora;Dra. Paula;87;Seg–Sex 9h–18h;(15) 99999-0001;@clinicaaurora;Sem site';
const VAZIO = { leads: [], avisos: [] };

// Texto com cabeçalho (Empresa, Telefone, etc.) é lido como planilha; senão, como linhas soltas
const temCabecalho = (texto) => {
  const primeira = texto.split('\n')[0] || '';
  return /empresa/i.test(primeira) && /(telefone|status|instagram|avalia|horario|dono)/i.test(primeira);
};

const ESTILO_AVISO = {
  erro: 'bg-rose-500/10 text-rose-300',
  aviso: 'bg-amber-500/10 text-amber-300',
  info: 'bg-slate-800 text-slate-300',
};

export default function ImportModal({ onImportar, onFechar, leadsAtuais = [] }) {
  const [nome, setNome] = useState('');
  const [nicho, setNicho] = useState('');
  const [cidade, setCidade] = useState('');
  const [texto, setTexto] = useState('');
  const [analise, setAnalise] = useState(VAZIO);
  const [arquivo, setArquivo] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  const escolherArquivo = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const resultado = analisarCsv(await arquivoParaCsv(f));
      setAnalise(resultado);
      setArquivo(f.name);
      setTexto('');
      setErro('');
      if (!nome) setNome(f.name.replace(/\.(csv|xlsx?)$/i, ''));
    } catch (err) {
      setAnalise(VAZIO);
      setArquivo('');
      setErro(err.message);
    }
  };

  const colar = (valor) => {
    setTexto(valor);
    setArquivo('');
    setErro('');
    if (!valor.trim()) return setAnalise(VAZIO);
    try {
      setAnalise(temCabecalho(valor)
        ? analisarCsv(valor)
        : { leads: parsearLinhas(valor), avisos: [] });
    } catch (err) {
      setAnalise(VAZIO);
      setErro(err.message);
    }
  };

  const enviar = async () => {
    setEnviando(true);
    setErro('');
    try {
      await onImportar({ nome, nicho, cidade, linhas: separarDuplicados(analise.leads, leadsAtuais).novos });
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  };

  const { avisos } = analise;
  const { novos, repetidos } = separarDuplicados(analise.leads, leadsAtuais);
  const leads = novos;
  const nErros = avisos.filter((a) => a.tipo === 'erro').length;
  const nAvisos = avisos.filter((a) => a.tipo === 'aviso').length;

  return (
    <Shell titulo="Importar leads" largura="max-w-2xl" onFechar={onFechar}>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input className={INP} maxLength={120} placeholder="Nome da lista" value={nome} onChange={(e) => setNome(e.target.value)} />
        <input className={INP} placeholder="Nicho" value={nicho} onChange={(e) => setNicho(e.target.value)} />
        <input className={INP} placeholder="Cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
      </div>

      <div className="mb-4 rounded-xl border border-dashed border-slate-700 bg-slate-950 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-200">Arquivo CSV ou XLSX</p>
            <p className="mt-1 text-[11px] text-slate-500">
              Colunas: Empresa, Dono(a), Avaliações, Horário, Telefone, Instagram, Status do site, Link do site, Bairro, Nicho, Origem.
              Vale a primeira planilha do arquivo.
            </p>
          </div>
          <button type="button" className={GHOST} onClick={baixarModelo}>Modelo</button>
        </div>
        <input type="file" accept=".csv,.xlsx,.xls,text/csv" onChange={escolherArquivo}
          className="mt-3 block w-full text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-2 file:text-white hover:file:bg-indigo-500" />
      </div>

      <label className={LBL}>Ou cole os dados do Excel, do Sheets ou no formato ponto e vírgula</label>
      <textarea rows={5} className={INP + ' font-mono'} placeholder={EXEMPLO} value={texto} onChange={(e) => colar(e.target.value)} />

      {erro && (
        <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{erro}</div>
      )}

      {(leads.length > 0 || avisos.length > 0) && (
        <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span className="font-semibold text-emerald-400">{leads.length} leads prontos{arquivo ? ` (de ${arquivo})` : ''}</span>
            {repetidos.length > 0 && <span className="text-slate-400">{repetidos.length} já cadastrados (não serão importados)</span>}
            {nErros > 0 && <span className="text-rose-400">{nErros} linha(s) com erro, serão ignoradas</span>}
            {nAvisos > 0 && <span className="text-amber-400">{nAvisos} aviso(s), revise antes de importar</span>}
          </div>

          {avisos.length > 0 && (
            <ul className="mt-3 max-h-44 space-y-1.5 overflow-y-auto">
              {avisos.map((a, i) => (
                <li key={i} className={`flex gap-2 rounded-lg px-2.5 py-1.5 text-xs ${ESTILO_AVISO[a.tipo]}`}>
                  <span className="shrink-0 font-semibold">{a.linha ? `Linha ${a.linha}` : 'Arquivo'}</span>
                  <span>{a.mensagem}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <button className={GHOST} onClick={onFechar}>Cancelar</button>
        <button className={BTN} disabled={!nome || leads.length === 0 || enviando} onClick={enviar}>
          {enviando ? 'Importando…' : `Importar ${leads.length} leads`}
        </button>
      </div>
    </Shell>
  );
}
