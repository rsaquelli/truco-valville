"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Cake,
  CheckCircle2,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ToggleLeft,
  ToggleRight,
  Users,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { Jogador } from "@/types/truco";

type FormState = {
  nome: string;
  apelido: string;
  whatsapp: string;
  data_nascimento: string;
};

const formInicial: FormState = {
  nome: "",
  apelido: "",
  whatsapp: "",
  data_nascimento: "",
};

function limparWhatsApp(valor: string) {
  return valor.replace(/\D/g, "");
}

function formatarData(data: string | null) {
  if (!data) return "-";

  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function formatarWhatsApp(valor: string | null) {
  if (!valor) return "-";

  const numeros = valor.replace(/\D/g, "");

  if (numeros.length === 11) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
  }

  if (numeros.length === 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
  }

  return valor;
}

function obterProximoAniversario(dataNascimento: string | null) {
  if (!dataNascimento) return null;

  const hoje = new Date();
  const [ano, mes, dia] = dataNascimento.split("-").map(Number);

  if (!ano || !mes || !dia) return null;

  const aniversarioEsteAno = new Date(hoje.getFullYear(), mes - 1, dia);
  const aniversario =
    aniversarioEsteAno >= new Date(hoje.toDateString())
      ? aniversarioEsteAno
      : new Date(hoje.getFullYear() + 1, mes - 1, dia);

  const diffMs = aniversario.getTime() - new Date(hoje.toDateString()).getTime();
  const dias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return dias;
}

export default function JogadoresPage() {
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [form, setForm] = useState<FormState>(formInicial);
  const [busca, setBusca] = useState("");
  const [mostrarInativos, setMostrarInativos] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const jogadoresFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return jogadores
      .filter((jogador) => {
        if (!mostrarInativos && !jogador.ativo) return false;

        if (!termo) return true;

        return (
          jogador.nome.toLowerCase().includes(termo) ||
          jogador.apelido?.toLowerCase().includes(termo) ||
          jogador.whatsapp?.toLowerCase().includes(termo)
        );
      })
      .sort((a, b) => {
        if (a.ativo !== b.ativo) return a.ativo ? -1 : 1;
        return a.nome.localeCompare(b.nome);
      });
  }, [jogadores, busca, mostrarInativos]);

  const totalAtivos = jogadores.filter((jogador) => jogador.ativo).length;

  const proximoAniversariante = useMemo(() => {
    const jogadoresComAniversario = jogadores
      .filter((jogador) => jogador.ativo && jogador.data_nascimento)
      .map((jogador) => ({
        jogador,
        dias: obterProximoAniversario(jogador.data_nascimento),
      }))
      .filter((item) => item.dias !== null)
      .sort((a, b) => Number(a.dias) - Number(b.dias));

    return jogadoresComAniversario[0] ?? null;
  }, [jogadores]);

  async function carregarJogadores() {
    setCarregando(true);
    setErro(null);
    setSucesso(null);

    const { data, error } = await supabase
      .from("jogadores")
      .select("*")
      .order("nome", { ascending: true });

    if (error) {
      setErro(error.message);
      setCarregando(false);
      return;
    }

    setJogadores((data ?? []) as Jogador[]);
    setCarregando(false);
  }

  useEffect(() => {
    carregarJogadores();
  }, []);

  async function salvarJogador(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro(null);
    setSucesso(null);

    const nome = form.nome.trim();
    const apelido = form.apelido.trim();
    const whatsapp = limparWhatsApp(form.whatsapp);
    const dataNascimento = form.data_nascimento || null;

    if (!nome) {
      setErro("Informe o nome do jogador.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase.from("jogadores").insert({
      nome,
      apelido: apelido || null,
      whatsapp: whatsapp || null,
      data_nascimento: dataNascimento,
      ativo: true,
    });

    if (error) {
      setErro(error.message);
      setSalvando(false);
      return;
    }

    setForm(formInicial);
    setSucesso("Jogador cadastrado com sucesso.");
    setSalvando(false);
    await carregarJogadores();
  }

  async function alternarStatus(jogador: Jogador) {
    setErro(null);
    setSucesso(null);

    const novoStatus = !jogador.ativo;

    const { error } = await supabase
      .from("jogadores")
      .update({
        ativo: novoStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jogador.id);

    if (error) {
      setErro(error.message);
      return;
    }

    setSucesso(
      novoStatus
        ? `${jogador.nome} foi reativado.`
        : `${jogador.nome} foi inativado.`
    );

    await carregarJogadores();
  }

  return (
    <main className="app-shell safe-bottom mx-auto flex w-full max-w-6xl flex-col px-4 pb-28 pt-5 sm:px-6 sm:pb-8 lg:px-8">
      <header className="mb-5 rounded-[1.5rem] border border-[#071A4A]/10 bg-white/90 p-4 shadow-xl shadow-[#071A4A]/5 sm:mb-8 sm:rounded-[2rem] sm:p-6">
        <Link
          href="/"
          className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] px-4 py-2 text-sm font-black text-[#071A4A] transition active:scale-[0.99] sm:hover:border-[#E6AA00]/60"
        >
          <ArrowLeft size={18} />
          Voltar
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#E6AA00]/35 bg-[#E6AA00]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#5A3924] sm:text-xs">
              <Users size={15} />
              Etapa 2
            </div>

            <h1 className="text-3xl font-black tracking-tight text-[#071A4A] sm:text-5xl">
              Jogadores
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700 sm:text-base">
              Cadastre os membros do grupo. Esses jogadores serão usados nas
              rodadas, partidas, ranking individual, caixa e aniversários.
            </p>
          </div>

          <button
            type="button"
            onClick={carregarJogadores}
            className="touch-button inline-flex items-center justify-center gap-2 rounded-2xl border border-[#071A4A]/15 bg-white px-5 py-3 text-sm font-black text-[#071A4A] shadow-lg shadow-[#071A4A]/5 transition active:scale-[0.99] sm:hover:border-[#E6AA00]/50 sm:hover:bg-[#FAF8F1]"
          >
            <RefreshCw size={18} />
            Atualizar
          </button>
        </div>
      </header>

      {erro && (
        <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-50 p-4 text-sm font-bold text-red-700">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="mb-4 flex items-start gap-2 rounded-2xl border border-green-600/20 bg-green-50 p-4 text-sm font-bold text-green-700">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <span>{sucesso}</span>
        </div>
      )}

      <section className="mb-5 grid gap-4 sm:mb-8 lg:grid-cols-3">
        <div className="rounded-[1.5rem] border border-[#071A4A]/10 bg-white/90 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-slate-500">Jogadores ativos</p>
          <p className="mt-1 text-3xl font-black text-[#071A4A] sm:text-4xl">
            {totalAtivos}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            O grupo atual tem previsão de 12 membros.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-[#071A4A]/10 bg-white/90 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-slate-500">Total cadastrado</p>
          <p className="mt-1 text-3xl font-black text-[#071A4A] sm:text-4xl">
            {jogadores.length}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Inclui ativos e inativos.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-[#071A4A]/10 bg-white/90 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="flex items-center gap-2 text-sm font-black text-slate-500">
            <Cake size={16} />
            Próximo aniversário
          </p>
          <p className="mt-1 text-2xl font-black text-[#071A4A]">
            {proximoAniversariante
              ? proximoAniversariante.jogador.apelido ||
                proximoAniversariante.jogador.nome
              : "-"}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {proximoAniversariante?.dias === 0
              ? "É hoje. Bora preparar a zoeira."
              : proximoAniversariante?.dias
                ? `Faltam ${proximoAniversariante.dias} dia(s).`
                : "Cadastre datas de nascimento."}
          </p>
        </div>
      </section>

      <section className="mb-5 rounded-[1.5rem] border border-[#071A4A]/10 bg-white/90 p-4 shadow-xl shadow-[#071A4A]/5 sm:mb-8 sm:rounded-[1.75rem] sm:p-6">
        <div className="mb-5">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0B6B3A]">
            Novo membro
          </p>
          <h2 className="mt-1 text-2xl font-black text-[#071A4A]">
            Cadastrar jogador
          </h2>
        </div>

        <form onSubmit={salvarJogador} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-black text-[#071A4A]">
              Nome *
            </label>
            <input
              value={form.nome}
              onChange={(event) =>
                setForm((atual) => ({ ...atual, nome: event.target.value }))
              }
              placeholder="Ex: João"
              className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0B6B3A]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-[#071A4A]">
              Apelido
            </label>
            <input
              value={form.apelido}
              onChange={(event) =>
                setForm((atual) => ({
                  ...atual,
                  apelido: event.target.value,
                }))
              }
              placeholder="Ex: Raiz do Truco"
              className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0B6B3A]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-[#071A4A]">
              WhatsApp
            </label>
            <input
              inputMode="numeric"
              value={form.whatsapp}
              onChange={(event) =>
                setForm((atual) => ({
                  ...atual,
                  whatsapp: event.target.value,
                }))
              }
              placeholder="Ex: 11999999999"
              className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0B6B3A]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-[#071A4A]">
              Data de nascimento
            </label>
            <input
              type="date"
              value={form.data_nascimento}
              onChange={(event) =>
                setForm((atual) => ({
                  ...atual,
                  data_nascimento: event.target.value,
                }))
              }
              className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#0B6B3A]"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={salvando}
              className="touch-button inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0B6B3A] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#0B6B3A]/20 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:hover:bg-[#064527]"
            >
              {salvando ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Plus size={18} />
              )}
              {salvando ? "Salvando..." : "Cadastrar jogador"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-[1.5rem] border border-[#071A4A]/10 bg-white/90 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-6">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0B6B3A]">
              Lista
            </p>
            <h2 className="mt-1 text-2xl font-black text-[#071A4A]">
              Jogadores cadastrados
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="relative block">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar jogador"
                className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] py-3 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0B6B3A] sm:min-w-72"
              />
            </label>

            <button
              type="button"
              onClick={() => setMostrarInativos((atual) => !atual)}
              className="touch-button inline-flex items-center justify-center gap-2 rounded-2xl border border-[#071A4A]/15 bg-white px-4 py-3 text-sm font-black text-[#071A4A] transition active:scale-[0.99] sm:hover:bg-[#FAF8F1]"
            >
              {mostrarInativos ? (
                <ToggleRight size={20} />
              ) : (
                <ToggleLeft size={20} />
              )}
              {mostrarInativos ? "Com inativos" : "Só ativos"}
            </button>
          </div>
        </div>

        {carregando ? (
          <div className="flex min-h-32 items-center justify-center rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] p-5 text-sm font-bold text-slate-500">
            <Loader2 size={18} className="mr-2 animate-spin" />
            Carregando jogadores...
          </div>
        ) : jogadoresFiltrados.length === 0 ? (
          <div className="rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] p-5 text-sm font-bold text-slate-500">
            Nenhum jogador encontrado.
          </div>
        ) : (
          <div className="grid gap-3">
            {jogadoresFiltrados.map((jogador) => {
              const diasAniversario = obterProximoAniversario(
                jogador.data_nascimento
              );

              return (
                <article
                  key={jogador.id}
                  className="rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-black text-[#071A4A]">
                          {jogador.nome}
                        </h3>

                        {jogador.apelido && (
                          <span className="rounded-full border border-[#E6AA00]/40 bg-[#E6AA00]/10 px-3 py-1 text-xs font-black text-[#5A3924]">
                            {jogador.apelido}
                          </span>
                        )}

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            jogador.ativo
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {jogador.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-1 text-sm font-semibold text-slate-600 sm:grid-cols-2">
                        <p>
                          WhatsApp:{" "}
                          <span className="font-black text-slate-800">
                            {formatarWhatsApp(jogador.whatsapp)}
                          </span>
                        </p>

                        <p>
                          Nascimento:{" "}
                          <span className="font-black text-slate-800">
                            {formatarData(jogador.data_nascimento)}
                          </span>
                        </p>

                        <p className="sm:col-span-2">
                          Aniversário:{" "}
                          <span className="font-black text-slate-800">
                            {diasAniversario === null
                              ? "-"
                              : diasAniversario === 0
                                ? "Hoje"
                                : `faltam ${diasAniversario} dia(s)`}
                          </span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => alternarStatus(jogador)}
                      className={`touch-button inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-black transition active:scale-[0.99] ${
                        jogador.ativo
                          ? "border border-red-500/20 bg-red-50 text-red-700 sm:hover:bg-red-100"
                          : "border border-green-600/20 bg-green-50 text-green-700 sm:hover:bg-green-100"
                      }`}
                    >
                      {jogador.ativo ? "Inativar" : "Reativar"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}