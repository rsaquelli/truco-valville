"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Cake,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Home,
  Loader2,
  MessageCircle,
  Pencil,
  PlayCircle,
  RefreshCw,
  Save,
  Search,
  ToggleLeft,
  ToggleRight,
  Trophy,
  Users,
  Wallet,
  X,
  XCircle,
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

  const hojeSemHora = new Date(hoje.toDateString());
  const aniversarioEsteAno = new Date(hoje.getFullYear(), mes - 1, dia);

  const aniversario =
    aniversarioEsteAno >= hojeSemHora
      ? aniversarioEsteAno
      : new Date(hoje.getFullYear() + 1, mes - 1, dia);

  const diffMs = aniversario.getTime() - hojeSemHora.getTime();
  const dias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return dias;
}

function montarLinkWhatsApp(whatsapp: string | null) {
  const telefone = limparWhatsApp(whatsapp || "");

  if (!telefone) return null;

  return `https://wa.me/55${telefone}`;
}

function nomeJogador(jogador: Jogador) {
  return jogador.apelido || jogador.nome;
}

export default function JogadoresPage() {
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [form, setForm] = useState<FormState>(formInicial);

  const [jogadorEditandoId, setJogadorEditandoId] = useState<string | null>(
    null
  );

  const [busca, setBusca] = useState("");
  const [mostrarInativos, setMostrarInativos] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

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

        const nomeA = a.apelido || a.nome;
        const nomeB = b.apelido || b.nome;

        return nomeA.localeCompare(nomeB);
      });
  }, [jogadores, busca, mostrarInativos]);

  const totalAtivos = jogadores.filter((jogador) => jogador.ativo).length;
  const totalInativos = jogadores.filter((jogador) => !jogador.ativo).length;

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

  function atualizarCampo<K extends keyof FormState>(
    campo: K,
    valor: FormState[K]
  ) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function limparFormulario() {
    setForm(formInicial);
    setJogadorEditandoId(null);
  }

  function iniciarNovoCadastro() {
    limparFormulario();
    setMostrarFormulario(true);
    setErro(null);
    setSucesso(null);
  }

  function iniciarEdicao(jogador: Jogador) {
    setForm({
      nome: jogador.nome || "",
      apelido: jogador.apelido || "",
      whatsapp: jogador.whatsapp || "",
      data_nascimento: jogador.data_nascimento || "",
    });

    setJogadorEditandoId(jogador.id);
    setMostrarFormulario(true);
    setErro(null);
    setSucesso(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelarEdicao() {
    limparFormulario();
    setMostrarFormulario(false);
    setErro(null);
    setSucesso(null);
  }

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

    if (jogadorEditandoId) {
      const { error } = await supabase
        .from("jogadores")
        .update({
          nome,
          apelido: apelido || null,
          whatsapp: whatsapp || null,
          data_nascimento: dataNascimento,
          updated_at: new Date().toISOString(),
        })
        .eq("id", jogadorEditandoId);

      if (error) {
        setErro(error.message);
        setSalvando(false);
        return;
      }

      setSucesso("Cadastro atualizado com sucesso.");
    } else {
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

      setSucesso("Jogador cadastrado com sucesso.");
    }

    limparFormulario();
    setMostrarFormulario(false);
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
      <header className="mb-5 rounded-[1.5rem] border border-[#071A4A]/10 bg-white/95 p-4 shadow-xl shadow-[#071A4A]/5 sm:mb-8 sm:rounded-[2rem] sm:p-6">
        <div className="mb-4 flex flex-wrap gap-2">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] px-4 py-2 text-sm font-black text-[#071A4A] transition active:scale-[0.99] sm:hover:border-[#E6AA00]/60"
          >
            <ArrowLeft size={18} />
            Voltar
          </Link>

          <button
            type="button"
            onClick={carregarJogadores}
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#071A4A]/10 bg-white px-4 py-2 text-sm font-black text-[#071A4A] transition active:scale-[0.99] sm:hover:border-[#E6AA00]/60"
          >
            <RefreshCw size={18} />
            Atualizar
          </button>
        </div>

        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#E6AA00]/35 bg-[#E6AA00]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#5A3924] sm:text-xs">
            <Users size={15} />
            Jogadores
          </div>

          <h1 className="text-3xl font-black tracking-tight text-[#071A4A] sm:text-5xl">
            Jogadores
          </h1>

          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-700 sm:text-base">
            Cadastre, edite e mantenha atualizados os dados dos participantes do
            Truco no Valville.
          </p>
        </div>
      </header>

      {erro && (
        <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-50 p-4 text-sm font-bold text-red-700">
          <XCircle size={18} className="mt-0.5 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {sucesso && (
        <div className="mb-4 flex items-start gap-2 rounded-2xl border border-green-600/20 bg-green-50 p-4 text-sm font-bold text-green-700">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <span>{sucesso}</span>
        </div>
      )}

      <section className="mb-5 grid gap-4 sm:mb-8 lg:grid-cols-3">
        <div className="rounded-[1.5rem] border border-[#071A4A]/10 bg-white/95 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-slate-500">Ativos</p>
          <p className="mt-1 text-3xl font-black text-[#071A4A] sm:text-4xl">
            {totalAtivos}
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            Jogadores disponíveis para partidas.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white/95 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-slate-500">Inativos</p>
          <p className="mt-1 text-3xl font-black text-slate-700 sm:text-4xl">
            {totalInativos}
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            Fora da lista de montagem de partidas.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-[#E6AA00]/30 bg-[#FFF7D7] p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="flex items-center gap-2 text-sm font-black text-[#5A3924]">
            <Cake size={16} />
            Próximo aniversário
          </p>

          <p className="mt-1 truncate text-2xl font-black text-[#071A4A]">
            {proximoAniversariante
              ? nomeJogador(proximoAniversariante.jogador)
              : "-"}
          </p>

          <p className="mt-2 text-sm font-semibold leading-6 text-[#5A3924]">
            {proximoAniversariante
              ? Number(proximoAniversariante.dias) === 0
                ? "É hoje! 🎂"
                : `Faltam ${proximoAniversariante.dias} dia(s).`
              : "Sem datas cadastradas."}
          </p>
        </div>
      </section>

      <section className="mb-5 rounded-[1.5rem] border border-[#071A4A]/10 bg-white/95 p-4 shadow-xl shadow-[#071A4A]/5 sm:mb-8 sm:rounded-[1.75rem] sm:p-6">
        <button
          type="button"
          onClick={() => {
            if (!mostrarFormulario) {
              iniciarNovoCadastro();
              return;
            }

            setMostrarFormulario(false);
          }}
          className="flex w-full items-center justify-between gap-4 rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] p-4 text-left transition active:scale-[0.99]"
        >
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0B6B3A]">
              Cadastro
            </p>
            <h2 className="mt-1 text-2xl font-black text-[#071A4A]">
              {jogadorEditandoId ? "Editar jogador" : "Novo jogador"}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              {jogadorEditandoId
                ? "Atualize os dados do participante."
                : "Abra o formulário para cadastrar um participante."}
            </p>
          </div>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#071A4A]">
            {mostrarFormulario ? (
              <ChevronDown size={24} />
            ) : (
              <ChevronRight size={24} />
            )}
          </div>
        </button>

        {mostrarFormulario && (
          <form onSubmit={salvarJogador} className="mt-5 grid gap-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-black text-[#071A4A]">
                  Nome completo *
                </label>
                <input
                  value={form.nome}
                  onChange={(event) =>
                    atualizarCampo("nome", event.target.value)
                  }
                  placeholder="Ex: João da Silva"
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
                    atualizarCampo("apelido", event.target.value)
                  }
                  placeholder="Ex: Raiz"
                  className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0B6B3A]"
                />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-black text-[#071A4A]">
                  WhatsApp
                </label>
                <input
                  value={form.whatsapp}
                  onChange={(event) =>
                    atualizarCampo("whatsapp", event.target.value)
                  }
                  inputMode="tel"
                  placeholder="11999999999"
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
                    atualizarCampo("data_nascimento", event.target.value)
                  }
                  className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#0B6B3A]"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="submit"
                disabled={salvando}
                className="touch-button inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0B6B3A] px-5 py-4 text-sm font-black text-white shadow-lg shadow-[#0B6B3A]/20 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {salvando ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Save size={20} />
                )}
                {jogadorEditandoId ? "Salvar alterações" : "Cadastrar jogador"}
              </button>

              <button
                type="button"
                onClick={cancelarEdicao}
                className="touch-button inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#071A4A]/10 bg-white px-5 py-4 text-sm font-black text-[#071A4A] transition active:scale-[0.99]"
              >
                <X size={20} />
                Cancelar
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="rounded-[1.5rem] border border-[#071A4A]/10 bg-white/95 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-6">
        <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <label className="relative block">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar jogador, apelido ou WhatsApp"
              className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] py-3 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0B6B3A]"
            />
          </label>

          <button
            type="button"
            onClick={() => setMostrarInativos((atual) => !atual)}
            className="touch-button inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#071A4A]/10 bg-white px-4 py-3 text-sm font-black text-[#071A4A] transition active:scale-[0.99]"
          >
            {mostrarInativos ? (
              <ToggleRight size={22} />
            ) : (
              <ToggleLeft size={22} />
            )}
            {mostrarInativos ? "Mostrando inativos" : "Ocultando inativos"}
          </button>
        </div>

        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0B6B3A] text-white">
            <Users size={22} />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0B6B3A]">
              Lista
            </p>
            <h2 className="text-2xl font-black text-[#071A4A]">
              Participantes
            </h2>
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

              const whatsappLink = montarLinkWhatsApp(jogador.whatsapp);

              return (
                <article
                  key={jogador.id}
                  className={`rounded-2xl border p-4 ${
                    jogador.ativo
                      ? "border-[#071A4A]/10 bg-[#FAF8F1]"
                      : "border-slate-200 bg-slate-50 opacity-75"
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-xl font-black text-[#071A4A]">
                          {nomeJogador(jogador)}
                        </h3>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black uppercase ${
                            jogador.ativo
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {jogador.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </div>

                      {jogador.apelido && (
                        <p className="mt-1 text-sm font-semibold text-slate-600">
                          {jogador.nome}
                        </p>
                      )}

                      <div className="mt-3 grid gap-1 text-sm font-semibold text-slate-600">
                        <p>WhatsApp: {formatarWhatsApp(jogador.whatsapp)}</p>
                        <p>Nascimento: {formatarData(jogador.data_nascimento)}</p>

                        {diasAniversario !== null && (
                          <p className="text-[#5A3924]">
                            Aniversário:{" "}
                            {diasAniversario === 0
                              ? "hoje 🎂"
                              : `em ${diasAniversario} dia(s)`}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[430px]">
                      <button
                        type="button"
                        onClick={() => iniciarEdicao(jogador)}
                        className="touch-button inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#071A4A] px-4 py-3 text-sm font-black text-white transition active:scale-[0.99]"
                      >
                        <Pencil size={18} />
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => alternarStatus(jogador)}
                        className={`touch-button inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black text-white transition active:scale-[0.99] ${
                          jogador.ativo ? "bg-red-600" : "bg-[#0B6B3A]"
                        }`}
                      >
                        {jogador.ativo ? (
                          <ToggleRight size={18} />
                        ) : (
                          <ToggleLeft size={18} />
                        )}
                        {jogador.ativo ? "Inativar" : "Ativar"}
                      </button>

                      {whatsappLink ? (
                        <a
                          href={whatsappLink}
                          target="_blank"
                          rel="noreferrer"
                          className="touch-button inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0B6B3A] px-4 py-3 text-sm font-black text-white transition active:scale-[0.99]"
                        >
                          <MessageCircle size={18} />
                          WhatsApp
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="touch-button inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-black text-slate-400"
                        >
                          Sem WhatsApp
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#071A4A]/10 bg-white/95 px-3 py-2 shadow-2xl shadow-[#071A4A]/20 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
          <Link
            href="/"
            className="flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[#071A4A]"
          >
            <Home size={20} />
            <span className="mt-1 text-[10px] font-black">Início</span>
          </Link>

          <Link
            href="/partidas/nova"
            className="flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[#071A4A]"
          >
            <PlayCircle size={20} />
            <span className="mt-1 text-[10px] font-black">Partida</span>
          </Link>

          <Link
            href="/ranking"
            className="flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[#071A4A]"
          >
            <Trophy size={20} />
            <span className="mt-1 text-[10px] font-black">Ranking</span>
          </Link>

          <Link
            href="/caixa"
            className="flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[#071A4A]"
          >
            <Wallet size={20} />
            <span className="mt-1 text-[10px] font-black">Caixa</span>
          </Link>
        </div>
      </nav>
    </main>
  );
}