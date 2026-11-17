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
import Dialogo from './components/Dialogo';
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
  const [dialogo, setDialogo] = useState(null);
  const [toast, setToast] = useState(null);
  const [erro, setErro] = useState('');

  const carregar = () => api.dados().then((d) => d && setDados(d)).catch((e) => setErro(e.message));
  useEffect(() => { if (logado) carregar(); }, [logado]);

  if (!logado) return <Login onLogin={() => setLogado(true)} />;

  // Atualiza só o que mudou, usando a resposta do servidor (sem recarregar o banco inteiro)
  const aplicar = (acao, atualizar) => acao().then(atualizar).catch((e) => setErro(e.message));
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
    aplicar(() => api.moverLead(id, colunaId), () => {});
  };

  const excluirLead = (id) => setDialogo({
    titulo: 'Excluir lead',
    mensagem: 'O lead sai da lista. Você pode desfazer logo em seguida.',
    confirmarTexto: 'Excluir',
    perigo: true,
    onConfirmar: () => {
      setDialogo(null);
      setDetalhe(null);
      aplicar(() => api.excluirLead(id), () => setDados((d) => ({ ...d, leads: d.leads.filter((l) => l.id !== id) })));
      setToast({
        texto: 'Lead excluído',
        acaoTexto: 'Desfazer',
        onAcao: () => aplicar(() => api.restaurarLead(id), (lead) => setDados((d) => ({ ...d, leads: [...d.leads, lead] }))),
      });
    },
  });

  const excluirContato = (id) => setDialogo({
    titulo: 'Excluir registro',
    mensagem: 'Este registro de contato será removido.',
    confirmarTexto: 'Excluir',
    perigo: true,
    onConfirmar: () => {
      setDialogo(null);
      aplicar(() => api.excluirContato(id), () => setDados((d) => ({ ...d, contatos: d.contatos.filter((c) => c.id !== id) })));
    },
  });

  const excluirVarios = (ids) => setDialogo({
    titulo: `Excluir ${ids.length} lead(s)`,
    mensagem: 'Os leads selecionados saem da lista. Você pode desfazer logo em seguida.',
    confirmarTexto: 'Excluir',
    perigo: true,
    onConfirmar: () => {
      setDialogo(null);
      aplicar(() => api.excluirVarios(ids), () => setDados((d) => ({ ...d, leads: d.leads.filter((l) => !ids.includes(l.id)) })));
      setToast({
        texto: `${ids.length} leads excluídos`,
        acaoTexto: 'Desfazer',
        onAcao: () => aplicar(() => api.restaurarVarios(ids), (restaurados) => setDados((d) => ({ ...d, leads: [...d.leads, ...restaurados] }))),
      });
    },
  });

  const novaColuna = () => setDialogo({
    titulo: 'Nova coluna',
    confirmarTexto: 'Criar',
    campo: { placeholder: 'Nome da coluna', obrigatorio: true },
    onConfirmar: (nome) => {
      setDialogo(null);
      aplicar(() => api.criarColuna(nome), (c) => setDados((d) => ({ ...d, colunas: [...d.colunas, c] })));
    },
  });

  // Erros são lançados para o modal, que mostra a mensagem dentro da própria janela
  const importar = async (p) => {
    const r = await api.criarLista(p);
    setImportando(false);
    setToast({ texto: `${r.importados} leads importados · ${r.duplicados} duplicados ignorados` });
    carregar();
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
          <Tabela leads={leads} listas={dados.listas} colunas={dados.colunas} onDetalhe={(l) => setDetalhe(l.id)} onExcluirVarios={excluirVarios} />
        )}
        {aba === 'dashboard' && (
          <Dashboard leads={comRetorno} listas={dados.listas} colunas={dados.colunas} />
        )}
      </main>

      {detalheLead && (
        <DetalheModal lead={detalheLead} contatos={dados.contatos} listas={dados.listas} colunas={dados.colunas}
          onNota={(nota, proximo) => aplicar(() => api.criarContato(detalheLead.id, nota, proximo), (c) => setDados((d) => ({ ...d, contatos: [...d.contatos, c] })))}
          onEditarContato={(id, nota, proximo) => aplicar(() => api.editarContato(id, nota, proximo), (c) => setDados((d) => ({ ...d, contatos: d.contatos.map((x) => (x.id === c.id ? c : x)) })))}
          onExcluirContato={excluirContato}
          onMover={moverLead}
          onEditar={() => { setEdicao(detalheLead); setDetalhe(null); }}
          onExcluir={() => excluirLead(detalheLead.id)}
          onFechar={() => setDetalhe(null)} />
      )}

      {edicao && (
        <LeadModal lead={edicao} listas={dados.listas} colunas={dados.colunas}
          listaPadrao={filtros.listaId !== 'todas' ? filtros.listaId : dados.listas[0]?.id}
          onSalvar={(l) => aplicar(
            async () => { const salvo = await api.salvarLead(l); setEdicao(null); return salvo; },
            (lead) => setDados((d) => ({
              ...d,
              leads: d.leads.some((x) => x.id === lead.id)
                ? d.leads.map((x) => (x.id === lead.id ? lead : x))
                : [...d.leads, lead],
            })),
          )}
          onFechar={() => setEdicao(null)} />
      )}

      {importando && <ImportModal onImportar={importar} leadsAtuais={dados.leads} onFechar={() => setImportando(false)} />}

      {trocandoSenha && (
        <SenhaModal
          onSalvar={async (atual, nova) => {
            await api.trocarSenha(atual, nova);
            setTrocandoSenha(false);
            setToast({ texto: 'Senha alterada com sucesso' });
          }}
          onFechar={() => setTrocandoSenha(false)} />
      )}

      {dialogo && <Dialogo {...dialogo} onFechar={() => setDialogo(null)} />}

      {toast && (
        <Toast texto={toast.texto} acaoTexto={toast.acaoTexto} onAcao={toast.onAcao}
          onFechar={() => setToast(null)} />
      )}
    </div>
  );
}
