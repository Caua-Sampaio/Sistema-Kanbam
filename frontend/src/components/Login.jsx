import { useState } from 'react';
import { api, setToken } from '../api';

export default function Login({ onLogin }) {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  const entrar = async (e) => {
    e.preventDefault();
    try {
      const { access_token } = await api.login(usuario, senha);
      setToken(access_token);
      onLogin();
    } catch (err) {
      setErro(err.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <form onSubmit={entrar} className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-100">ProspecDash SaaS</h1>
          <p className="mt-1 text-sm text-slate-400">Gestão Comercial & Kanban de Leads</p>
        </div>
        {erro && <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs text-rose-300">{erro}</p>}
        <input className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
          placeholder="Usuário" value={usuario} onChange={(e) => setUsuario(e.target.value)} autoFocus required />
        <input type="password" className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
          placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        <button type="submit" className="w-full rounded-xl bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-500">Entrar</button>
      </form>
    </div>
  );
}
