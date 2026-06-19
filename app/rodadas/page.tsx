"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Home,
  Loader2,
  MapPin,
  Pencil,
  PlayCircle,
  RefreshCw,
  Save,
  Search,
  Trophy,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { Rodada, StatusRodada } from "@/types/truco";

type FormState = {
  data: string;
  horario: string;
  local: string;
  observacoes: string;
  status: StatusRodada;
};

const formInicial: FormState = {
  data: "",
  horario: "",
  local: "",
  observacoes: "",
  status: "aberta",
};

const statusLabels: Record<StatusRodada, string> = {
  aberta: "Aberta",
  encerrada: "Encerrada",
  cancelada: "Cancelada",
};

function hojeISO() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function formatarData(data: string | null | undefined) {
  if (!data) return "-";

  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function formatarHorario(horario: string | null | undefined) {
  if (!horario) return "-";
  return horario.slice(0, 5);
}

function obterStatusClasses(status: StatusRodada) {
  if (status === "aberta") {
    return "bg-green-100 text-green-700";
  }

  if (status === "encerrada") {
    return "bg-blue-100 text-blue-700";
  }

  return "bg-red-100 text-red-700";
}

function obterStatusCardClasses(status: StatusRodada) {
  if (status === "aberta") {
    return "border-green-600/20 bg-green-50";
  }

  if (status === "encerrada") {
    return "border-blue-600/20 bg-blue-50";
  }

  return "border-red-500/20 bg-red-50";
}

export default function RodadasPage() {
  const [rodadas, setRodadas] = useState<Rodada[]>([]);
  const [form, setForm] = useState<FormState>({
    ...formInicial,
    data: hojeISO(),
  });

  const [rodadaEditandoId, setRodadaEditandoId] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarHistorico, setMostrarHistorico] = useState(true);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const rodadasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return rodadas.filter((rodada) => {
      if (!termo) return true;

      return (
        rodada.local?.toLowerCase().includes(termo) ||
        rodada.observacoes?.toLowerCase().includes(termo) ||
        statusLabels[rodada.status].toLowerCase().includes(termo) ||
        formatarData(rodada.data).includes(termo)
      );
    });
  }, [rodadas, busca]);

  const totalAbertas = rodadas.filter(
    (rodada) => rodada.status === "aberta"
  ).length;

  const totalEncerradas = rodadas.filter(
    (rodada) => rodada.status === "encerrada"
  ).length;

  const totalCanceladas = rodadas.filter(
    (rodada) => rodada.status === "cancelada"
  ).length;

  const proximaRodada = useMemo(() => {
    const hoje = hojeISO();

    return (
      rodadas
        .filter((rodada) => rodada.status === "aberta" && rodada.data >= hoje)
        .sort((a, b) => {
          const dataCompare = a.data.localeCompare(b.data);

          if (dataCompare !== 0) return dataCompare;

          return (a.horario || "").localeCompare(b.horario || "");
        })[0] ?? null
    );
  }, [rodadas]);

  const rodadaAbertaMaisRecente = useMemo(() => {
    return (
      rodadas
        .filter((rodada) => rodada.status === "aberta")
        .sort((a, b) => b.data.localeCompare(a.data))[0] ?? null
    );
  }, [rodadas]);

  async function carregarRodadas() {
    setCarregando(true);
    setErro(null);

    const { data, error } = await supabase
      .from("rodadas")
      .select("*")
      .order("data", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      setErro(error.message);
      setCarregando(false);
      return;
    }

    setRodadas((data ?? []) as Rodada[]);
    setCarregando(false);
  }

  useEffect(() => {
    carregarRodadas();
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
    setForm({
      ...formInicial,
      data: hojeISO(),
    });
    setRodadaEditandoId(null);
  }

  function iniciarNovaRodada() {
    limparFormulario();
    setMostrarFormulario(true);
    setErro(null);
    setSucesso(null);
  }

  function iniciarEdicao(rodada: Rodada) {
    setForm({
      data: rodada.data || hojeISO(),
      horario: rodada.horario || "",
      local: rodada.local || "",
      observacoes: rodada.observacoes || "",
      status: rodada.status,
    });

    setRodadaEditandoId(rodada.id);
    setMostrarFormulario(true);
    setErro(null);
    setSucesso(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelarFormulario() {
    limparFormulario();
    setMostrarFormulario(false);
    setErro(null);
    setSucesso(null);
  }

  async function salvarRodada(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro(null);
    setSucesso(null);

    const data = form.data;
    const horario = form.horario || null;
    const local = form.local.trim();
    const observacoes = form.observacoes.trim();

    if (!data) {
      setErro("Informe a data da rodada.");
      return;
    }

    setSalvando(true);

    if (rodadaEditandoId) {
      const { error } = await supabase
        .from("rodadas")
        .update({
          data,
          horario,
          local: local || null,
          observacoes: observacoes || null,
          status: form.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", rodadaEditandoId);

      if (error) {
        setErro(error.message);
        setSalvando(false);
        return;
      }

      setSucesso("Rodada atualizada com sucesso.");
    } else {
      const { error } = await supabase.from("rodadas").insert({
        data,
        horario,
        local: local || null,
        observacoes: observacoes || null,
        status: "aberta",
      });

      if (error) {
        setErro(error.message);
        setSalvando(false);
        return;
      }

      setSucesso("Rodada cadastrada com sucesso.");
    }

    limparFormulario();
    setMostrarFormulario(false);
    setSalvando(false);
    await carregarRodadas();
  }

  async function alterarStatus(rodada: Rodada, status: StatusRodada) {
    setErro(null);
    setSucesso(null);
    setSalvando(true);

    const { error } = await supabase
      .from("rodadas")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", rodada.id);

    if (error) {
      setErro(error.message);
      setSalvando(false);
      return;
    }

    setSucesso(`Rodada marcada como ${statusLabels[status].toLowerCase()}.`);
    setSalvando(false);
    await carregarRodadas();
  }

  return (
    <main className="app-shell safe-bottom mx-auto flex w-full max-w-6xl flex-col px-4 pb-64 pt-5 md:pb-8 sm:px-6 lg:px-8">
      <header className="mb-5 rounded-[1.5rem] border border-[#071A4A]/10 bg-white/95 p-4 shadow-xl shadow-[#071A4A]/5 sm:mb-8 sm:rounded-[2rem] sm:p-6">
        <div className="mb-4 flex flex-wrap gap-2">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] px-4 py-2 text-sm font-black text-[#071A4A] transition active:scale-[0.99] sm:hover:border-[#E6AA00]/60"
          >
            <ArrowLeft size={18} />
            Voltar
          </Link>

          <Link
            href="/partidas/nova"
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#071A4A]/10 bg-white px-4 py-2 text-sm font-black text-[#071A4A] transition active:scale-[0.99] sm:hover:border-[#E6AA00]/60"
          >
            <PlayCircle size={18} />
            Partida
          </Link>

          <button
            type="button"
            onClick={carregarRodadas}
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#071A4A]/10 bg-white px-4 py-2 text-sm font-black text-[#071A4A] transition active:scale-[0.99] sm:hover:border-[#E6AA00]/60"
          >
            <RefreshCw size={18} />
            Atualizar
          </button>
        </div>

        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#E6AA00]/35 bg-[#E6AA00]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#5A3924] sm:text-xs">
            <CalendarDays size={15} />
            Rodadas
          </div>

          <h1 className="text-3xl font-black tracking-tight text-[#071A4A] sm:text-5xl">
            Rodadas
          </h1>

          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-700 sm:text-base">
            Organize os encontros do truco, defina local, horário e controle o
            status das rodadas.
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

      <section className="mb-5 grid gap-4 sm:mb-8 lg:grid-cols-4">
        <div className="rounded-[1.5rem] border border-green-600/20 bg-green-50 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-green-700">Abertas</p>
          <p className="mt-1 text-3xl font-black text-green-800 sm:text-4xl">
            {totalAbertas}
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-green-700/80">
            Rodadas disponíveis para partidas.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-blue-600/20 bg-blue-50 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-blue-700">Encerradas</p>
          <p className="mt-1 text-3xl font-black text-blue-800 sm:text-4xl">
            {totalEncerradas}
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-blue-700/80">
            Rodadas finalizadas.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-red-500/10 bg-red-50 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-red-600">Canceladas</p>
          <p className="mt-1 text-3xl font-black text-red-700 sm:text-4xl">
            {totalCanceladas}
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-red-700/80">
            Rodadas que não aconteceram.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-[#E6AA00]/30 bg-[#FFF7D7] p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-[#5A3924]">Próxima</p>
          <p className="mt-1 text-2xl font-black text-[#071A4A]">
            {proximaRodada ? formatarData(proximaRodada.data) : "-"}
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#5A3924]">
            {proximaRodada
              ? `${formatarHorario(proximaRodada.horario)}${
                  proximaRodada.local ? ` · ${proximaRodada.local}` : ""
                }`
              : "Nenhuma rodada futura aberta."}
          </p>
        </div>
      </section>

      {rodadaAbertaMaisRecente && (
        <section className="mb-5 rounded-[1.5rem] border border-green-600/20 bg-green-50 p-4 shadow-xl shadow-[#071A4A]/5 sm:mb-8 sm:rounded-[1.75rem] sm:p-6">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0B6B3A] text-white">
              <CalendarDays size={22} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-green-700">
                Rodada aberta
              </p>
              <h2 className="text-2xl font-black text-[#071A4A]">
                {formatarData(rodadaAbertaMaisRecente.data)} ·{" "}
                {formatarHorario(rodadaAbertaMaisRecente.horario)}
              </h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-green-700/80">
                {rodadaAbertaMaisRecente.local || "Local a definir"}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              href="/partidas/nova"
              className="touch-button inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0B6B3A] px-5 py-4 text-sm font-black text-white shadow-lg shadow-[#0B6B3A]/20 transition active:scale-[0.99]"
            >
              <PlayCircle size={20} />
              Iniciar partida
            </Link>

            <button
              type="button"
              onClick={() => iniciarEdicao(rodadaAbertaMaisRecente)}
              className="touch-button inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#071A4A] px-5 py-4 text-sm font-black text-white transition active:scale-[0.99]"
            >
              <Pencil size={20} />
              Editar
            </button>

            <button
              type="button"
              onClick={() => alterarStatus(rodadaAbertaMaisRecente, "encerrada")}
              disabled={salvando}
              className="touch-button inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#071A4A]/10 bg-white px-5 py-4 text-sm font-black text-[#071A4A] transition active:scale-[0.99] disabled:opacity-50"
            >
              Encerrar
            </button>
          </div>
        </section>
      )}

      <section className="mb-5 rounded-[1.5rem] border border-[#071A4A]/10 bg-white/95 p-4 shadow-xl shadow-[#071A4A]/5 sm:mb-8 sm:rounded-[1.75rem] sm:p-6">
        <button
          type="button"
          onClick={() => {
            if (!mostrarFormulario) {
              iniciarNovaRodada();
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
              {rodadaEditandoId ? "Editar rodada" : "Nova rodada"}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              {rodadaEditandoId
                ? "Atualize data, horário, local e status."
                : "Abra o formulário para criar uma nova rodada."}
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
          <form onSubmit={salvarRodada} className="mt-5 grid gap-4">
            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-black text-[#071A4A]">
                  Data *
                </label>
                <input
                  type="date"
                  value={form.data}
                  onChange={(event) =>
                    atualizarCampo("data", event.target.value)
                  }
                  className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#0B6B3A]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-[#071A4A]">
                  Horário
                </label>
                <input
                  type="time"
                  value={form.horario}
                  onChange={(event) =>
                    atualizarCampo("horario", event.target.value)
                  }
                  className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#0B6B3A]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-[#071A4A]">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(event) =>
                    atualizarCampo("status", event.target.value as StatusRodada)
                  }
                  disabled={!rodadaEditandoId}
                  className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition disabled:opacity-60 focus:border-[#0B6B3A]"
                >
                  <option value="aberta">Aberta</option>
                  <option value="encerrada">Encerrada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-[#071A4A]">
                Local
              </label>
              <input
                value={form.local}
                onChange={(event) => atualizarCampo("local", event.target.value)}
                placeholder="Ex: Casa do João"
                className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0B6B3A]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-[#071A4A]">
                Observações
              </label>
              <textarea
                value={form.observacoes}
                onChange={(event) =>
                  atualizarCampo("observacoes", event.target.value)
                }
                rows={4}
                placeholder="Ex: levar gelo, carne, cerveja..."
                className="w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] px-4 py-3 text-sm font-semibold leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0B6B3A]"
              />
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
                {rodadaEditandoId ? "Salvar alterações" : "Cadastrar rodada"}
              </button>

              <button
                type="button"
                onClick={cancelarFormulario}
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
        <button
          type="button"
          onClick={() => setMostrarHistorico((atual) => !atual)}
          className="mb-5 flex w-full items-center justify-between gap-4 rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] p-4 text-left transition active:scale-[0.99]"
        >
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0B6B3A]">
              Histórico
            </p>
            <h2 className="mt-1 text-2xl font-black text-[#071A4A]">
              Rodadas cadastradas
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              {rodadas.length} rodada(s) no total.
            </p>
          </div>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#071A4A]">
            {mostrarHistorico ? (
              <ChevronDown size={24} />
            ) : (
              <ChevronRight size={24} />
            )}
          </div>
        </button>

        {mostrarHistorico && (
          <>
            <label className="relative mb-5 block">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar por local, data, status ou observação"
                className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] py-3 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0B6B3A]"
              />
            </label>

            {carregando ? (
              <div className="flex min-h-32 items-center justify-center rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] p-5 text-sm font-bold text-slate-500">
                <Loader2 size={18} className="mr-2 animate-spin" />
                Carregando rodadas...
              </div>
            ) : rodadasFiltradas.length === 0 ? (
              <div className="rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] p-5 text-sm font-bold text-slate-500">
                Nenhuma rodada encontrada.
              </div>
            ) : (
              <div className="grid gap-3">
                {rodadasFiltradas.map((rodada) => (
                  <article
                    key={rodada.id}
                    className={`rounded-2xl border p-4 ${obterStatusCardClasses(
                      rodada.status
                    )}`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-black text-[#071A4A]">
                            {formatarData(rodada.data)}
                          </h3>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black uppercase ${obterStatusClasses(
                              rodada.status
                            )}`}
                          >
                            {statusLabels[rodada.status]}
                          </span>
                        </div>

                        <div className="mt-3 grid gap-1 text-sm font-semibold text-slate-700">
                          <p className="flex items-center gap-2">
                            <Clock size={16} />
                            {formatarHorario(rodada.horario)}
                          </p>

                          <p className="flex items-center gap-2">
                            <MapPin size={16} />
                            {rodada.local || "Local a definir"}
                          </p>

                          {rodada.observacoes && (
                            <p className="mt-1 leading-6">
                              {rodada.observacoes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[430px]">
                        <button
                          type="button"
                          onClick={() => iniciarEdicao(rodada)}
                          className="touch-button inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#071A4A] px-4 py-3 text-sm font-black text-white transition active:scale-[0.99]"
                        >
                          <Pencil size={18} />
                          Editar
                        </button>

                        <button
                          type="button"
                          disabled={salvando}
                          onClick={() => alterarStatus(rodada, "aberta")}
                          className="touch-button inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#0B6B3A] px-4 py-3 text-sm font-black text-white transition active:scale-[0.99] disabled:opacity-50"
                        >
                          Abrir
                        </button>

                        <button
                          type="button"
                          disabled={salvando}
                          onClick={() => alterarStatus(rodada, "encerrada")}
                          className="touch-button inline-flex min-h-12 items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition active:scale-[0.99] disabled:opacity-50"
                        >
                          Encerrar
                        </button>

                        <button
                          type="button"
                          disabled={salvando}
                          onClick={() => alterarStatus(rodada, "cancelada")}
                          className="touch-button inline-flex min-h-12 items-center justify-center rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white transition active:scale-[0.99] disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </section>
      <div className="h-40 shrink-0 md:hidden" aria-hidden="true" />
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