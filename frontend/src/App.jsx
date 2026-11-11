import { useEffect, useState } from 'react';
import { api, getToken, setToken } from './api';
import Login from './components/Login';
import Cabecalho from './components/Cabecalho';
import Filtros from './components/Filtros';
import Kanban from './components/Kanban';
import Tabela from './components/Tabela';
import Dashboard from './components/Dashboard';
import LeadModal from './components/LeadModal';
import DetalheModal from './components/DetalheModal';
import ImportModal from './components/ImportModal';
import SenhaModal from './components/SenhaModal';
import Toast from './components/Toast';
import { baixarArquivo, baixarCsv, hoje, proximoRetorno } from './utils';

export default function App() {
  // Todos os hooks ficam antes de qualquer retorno condicional
  const [logado, setLogado] = useState(!!getToken());
  const [dados, setDados] = useState({ listas: [], leads: [], colunas: [], contatos: [] });
  const [aba, setAba] = useState('kanban');
  const [filtros, setFiltros] = useState({
    busca: '', status: 'todos', listaId: 'todas', bairro: '', nicho: '', origem: '', minAval: '', soRetornos: false,
  });
  const [edicao, setEdicao] = useState(null);
  const [detalhe, setDetalhe] = useState(null); // id do lead aberto
  const [importando, setImportando] = useState(false);
  const [trocandoSenha, setTrocandoSenha] = useState(false);
  const [toast, setToast] = useState(null);
  const [erro, setErro] = useState('');

  const carregar = () => api.dados().then((d) => d && setDados(d)).catch((e) => setErro(e.message));
  useEffect(() => { if (logado) carregar(); }, [logado]);

  if (!logado) return <Login onLogin={() => setLogado(true)} />;

  const executar = (acao) => acao().then(carregar).catch((e) => setErro(e.message));
  const sair = () => { setToken(null); setLogado(false); };

  const hojeStr = hoje();
  const comRetorno = dados.leads.map((l) => ({ ...l, retorno: proximoRetorno(l.id, dados.contatos) }));
  const contem = (valor, termo) => !termo || (valor || '').toLowerCase().includes(termo.trim().toLowerCase());
  const leads = comRetorno.filter((l) => {
    const t = filtros.busca.trim().toLowerCase();
    return (filtros.listaId === 'todas' || l.listaId === filtros.listaId)
      && (filtros.status === 'todos' || l.statusSite === filtros.status)
      && (!filtros.minAval || l.avaliacoes >= Number(filtros.minAval))
      && (!filtros.soRetornos || (l.retorno && l.retorno <= hojeStr))
      && contem(l.bairro, filtros.bairro)
      && contem(l.nicho, filtros.nicho)
      && contem(l.origem, filtros.origem)
      && (!t || [l.empresa, l.dono, l.telefone, l.instagram].some((v) => (v || '').toLowerCase().includes(t)));
  });
  const detalheLead = detalhe ? comRetorno.find((l) => l.id === detalhe) : null;

  const moverLead = (id, colunaId) => {
    setDados((d) => ({ ...d, leads: d.leads.map((l) => (l.id === id ? { ...l, colunaId } : l)) }));
    executar(() => api.moverLead(id, colunaId));
  };

  const excluirLead = (id) => {
    if (!window.confirm('Excluir este lead?')) return;
    setDetalhe(null);
    executar(() => api.excluirLead(id));
    setToast({ texto: 'Lead excluído', acaoTexto: 'Desfazer', onAcao: () => executar(() => api.restaurarLead(id)) });
  };

  const excluirContato = (id) => {
    if (!window.confirm('Excluir este registro de contato?')) return;
    executar(() => api.excluirContato(id));
  };

  const novaColuna = () => {
    const nome = window.prompt('Nome da nova coluna:');
    if (nome?.trim()) executar(() => api.criarColuna(nome.trim()));
  };

  const importar = async (p) => {
    try {
      const r = await api.criarLista(p);
      setImportando(false);
      setToast({ texto: `${r.importados} leads importados · ${r.duplicados} duplicados ignorados` });
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  };

  const backup = async () => {
    try {
      baixarArquivo(await api.baixarBackup(), `prospecdash-${hojeStr}.db`);
    } catch (e) {
      setErro(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Cabecalho
        aba={aba} setAba={setAba}
        listas={dados.listas}
        listaId={filtros.listaId}
        setListaId={(id) => setFiltros({ ...filtros, listaId: id })}
        acoes={{
          novaColuna,
          importar: () => setImportando(true),
          exportar: () => baixarCsv(leads, dados.colunas, dados.listas),
          backup,
          novoLead: () => setEdicao({}),
          senha: () => setTrocandoSenha(true),
          sair,
        }}
      />

      <Filtros filtros={filtros} setFiltros={setFiltros} total={leads.length} />

      {erro && (
        <div className="mx-4 mt-4 flex justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-300 md:mx-6">
          <span>{erro}</span>
          <button onClick={() => setErro('')}>×</button>
        </div>
      )}

      <main className="p-4 md:p-6">
        {aba === 'kanban' && (
          <Kanban colunas={dados.colunas} leads={leads} listas={dados.listas}
            onMover={moverLead} onDetalhe={(l) => setDetalhe(l.id)} onExcluir={excluirLead} />
        )}
        {aba === 'tabela' && (
          <Tabela leads={leads} listas={dados.listas} colunas={dados.colunas} onDetalhe={(l) => setDetalhe(l.id)} />
        )}
        {aba === 'dashboard' && (
          <Dashboard leads={comRetorno} listas={dados.listas} colunas={dados.colunas} />
        )}
      </main>

      {detalheLead && (
        <DetalheModal lead={detalheLead} contatos={dados.contatos} listas={dados.listas} colunas={dados.colunas}
          onNota={(nota, proximo) => executar(() => api.criarContato(detalheLead.id, nota, proximo))}
          onEditarContato={(id, nota, proximo) => executar(() => api.editarContato(id, nota, proximo))}
          onExcluirContato={excluirContato}
          onMover={moverLead}
          onEditar={() => { setEdicao(detalheLead); setDetalhe(null); }}
          onExcluir={() => excluirLead(detalheLead.id)}
          onFechar={() => setDetalhe(null)} />
      )}

      {edicao && (
        <LeadModal lead={edicao} listas={dados.listas} colunas={dados.colunas}
          listaPadrao={filtros.listaId !== 'todas' ? filtros.listaId : dados.listas[0]?.id}
          onSalvar={(l) => executar(async () => { await api.salvarLead(l); setEdicao(null); })}
          onFechar={() => setEdicao(null)} />
      )}

      {importando && <ImportModal onImportar={importar} onFechar={() => setImportando(false)} />}

      {trocandoSenha && (
        <SenhaModal
          onSalvar={async (atual, nova) => {
            await api.trocarSenha(atual, nova);
            setTrocandoSenha(false);
            setToast({ texto: 'Senha alterada com sucesso' });
          }}
          onFechar={() => setTrocandoSenha(false)} />
      )}

      {toast && (
        <Toast texto={toast.texto} acaoTexto={toast.acaoTexto} onAcao={toast.onAcao}
          onFechar={() => setToast(null)} />
      )}
    </div>
  );
}
