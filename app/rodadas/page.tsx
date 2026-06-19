"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { Rodada, StatusRodada } from "@/types/truco";

type FormState = {
  data: string;
  horario: string;
  local: string;
  observacoes: string;
};

const formInicial: FormState = {
  data: "",
  horario: "",
  local: "",
  observacoes: "",
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

function formatarData(data: string) {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function formatarHorario(horario: string | null) {
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

export default function RodadasPage() {
  const [rodadas, setRodadas] = useState<Rodada[]>([]);
  const [form, setForm] = useState<FormState>({
    ...formInicial,
    data: hojeISO(),
  });
  const [busca, setBusca] = useState("");
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

  const rodadaAberta = useMemo(() => {
    return rodadas.find((rodada) => rodada.status === "aberta") ?? null;
  }, [rodadas]);

  const totalAbertas = rodadas.filter(
    (rodada) => rodada.status === "aberta"
  ).length;

  const totalEncerradas = rodadas.filter(
    (rodada) => rodada.status === "encerrada"
  ).length;

  const proximaRodada = useMemo(() => {
    const hoje = hojeISO();

    return (
      rodadas
        .filter(
          (rodada) => rodada.status === "aberta" && rodada.data >= hoje
        )
        .sort((a, b) => a.data.localeCompare(b.data))[0] ?? null
    );
  }, [rodadas]);

  async function carregarRodadas() {
    setCarregando(true);
    setErro(null);
    setSucesso(null);

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

  async function salvarRodada(event: React.FormEvent<HTMLFormElement>) {
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

    setForm({
      ...formInicial,
      data: hojeISO(),
    });
    setSucesso("Rodada criada com sucesso.");
    setSalvando(false);
    await carregarRodadas();
  }

  async function alterarStatus(rodada: Rodada, status: StatusRodada) {
    setErro(null);
    setSucesso(null);

    const { error } = await supabase
      .from("rodadas")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", rodada.id);

    if (error) {
      setErro(error.message);
      return;
    }

    setSucesso(`Rodada marcada como ${statusLabels[status].toLowerCase()}.`);
    await carregarRodadas();
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
              <CalendarDays size={15} />
              Etapa 3
            </div>

            <h1 className="text-3xl font-black tracking-tight text-[#071A4A] sm:text-5xl">
              Rodadas
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700 sm:text-base">
              Crie os encontros semanais do truco. Depois, cada partida
              registrada será vinculada a uma rodada aberta.
            </p>
          </div>

          <button
            type="button"
            onClick={carregarRodadas}
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
          <p className="text-sm font-black text-slate-500">Rodadas abertas</p>
          <p className="mt-1 text-3xl font-black text-[#071A4A] sm:text-4xl">
            {totalAbertas}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Encontros ainda disponíveis para registrar partidas.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-[#071A4A]/10 bg-white/90 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-slate-500">
            Rodadas encerradas
          </p>
          <p className="mt-1 text-3xl font-black text-[#071A4A] sm:text-4xl">
            {totalEncerradas}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Noites finalizadas para histórico e ranking.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-[#071A4A]/10 bg-white/90 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-slate-500">Próxima rodada</p>
          <p className="mt-1 text-2xl font-black text-[#071A4A]">
            {proximaRodada ? formatarData(proximaRodada.data) : "-"}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {proximaRodada
              ? `${formatarHorario(proximaRodada.horario)} — ${
                  proximaRodada.local || "local a definir"
                }`
              : "Nenhuma rodada futura aberta."}
          </p>
        </div>
      </section>

      {rodadaAberta && (
        <section className="mb-5 rounded-[1.5rem] border border-[#0B6B3A]/20 bg-green-50 p-4 shadow-xl shadow-[#071A4A]/5 sm:mb-8 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0B6B3A]">
            Rodada aberta
          </p>
          <h2 className="mt-1 text-2xl font-black text-[#071A4A]">
            {formatarData(rodadaAberta.data)} —{" "}
            {rodadaAberta.local || "Local a definir"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Essa rodada será usada como referência para as próximas partidas.
          </p>
        </section>
      )}

      <section className="mb-5 rounded-[1.5rem] border border-[#071A4A]/10 bg-white/90 p-4 shadow-xl shadow-[#071A4A]/5 sm:mb-8 sm:rounded-[1.75rem] sm:p-6">
        <div className="mb-5">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0B6B3A]">
            Novo encontro
          </p>
          <h2 className="mt-1 text-2xl font-black text-[#071A4A]">
            Criar rodada
          </h2>
        </div>

        <form onSubmit={salvarRodada} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-black text-[#071A4A]">
              Data *
            </label>
            <input
              type="date"
              value={form.data}
              onChange={(event) =>
                setForm((atual) => ({ ...atual, data: event.target.value }))
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
                setForm((atual) => ({
                  ...atual,
                  horario: event.target.value,
                }))
              }
              className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#0B6B3A]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-[#071A4A]">
              Local
            </label>
            <input
              value={form.local}
              onChange={(event) =>
                setForm((atual) => ({ ...atual, local: event.target.value }))
              }
              placeholder="Ex: Casa do João — Raiz do Truco"
              className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0B6B3A]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-[#071A4A]">
              Observações
            </label>
            <input
              value={form.observacoes}
              onChange={(event) =>
                setForm((atual) => ({
                  ...atual,
                  observacoes: event.target.value,
                }))
              }
              placeholder="Ex: barriguinha de pinga liberada"
              className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0B6B3A]"
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
              {salvando ? "Salvando..." : "Criar rodada"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-[1.5rem] border border-[#071A4A]/10 bg-white/90 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-6">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0B6B3A]">
              Histórico
            </p>
            <h2 className="mt-1 text-2xl font-black text-[#071A4A]">
              Rodadas cadastradas
            </h2>
          </div>

          <label className="relative block">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar rodada"
              className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] py-3 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0B6B3A] sm:min-w-80"
            />
          </label>
        </div>

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
                className="rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-black text-[#071A4A]">
                        {formatarData(rodada.data)}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${obterStatusClasses(
                          rodada.status
                        )}`}
                      >
                        {statusLabels[rodada.status]}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-1 text-sm font-semibold text-slate-600 sm:grid-cols-2">
                      <p className="flex items-center gap-2">
                        <Clock size={15} />
                        <span>
                          Horário:{" "}
                          <strong className="text-slate-800">
                            {formatarHorario(rodada.horario)}
                          </strong>
                        </span>
                      </p>

                      <p className="flex items-center gap-2">
                        <MapPin size={15} />
                        <span>
                          Local:{" "}
                          <strong className="text-slate-800">
                            {rodada.local || "-"}
                          </strong>
                        </span>
                      </p>

                      {rodada.observacoes && (
                        <p className="sm:col-span-2">
                          Observações:{" "}
                          <strong className="text-slate-800">
                            {rodada.observacoes}
                          </strong>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[420px]">
                    <button
                      type="button"
                      onClick={() => alterarStatus(rodada, "aberta")}
                      disabled={rodada.status === "aberta"}
                      className="touch-button inline-flex items-center justify-center rounded-2xl border border-green-600/20 bg-green-50 px-3 py-3 text-sm font-black text-green-700 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:hover:bg-green-100"
                    >
                      Abrir
                    </button>

                    <button
                      type="button"
                      onClick={() => alterarStatus(rodada, "encerrada")}
                      disabled={rodada.status === "encerrada"}
                      className="touch-button inline-flex items-center justify-center rounded-2xl border border-blue-600/20 bg-blue-50 px-3 py-3 text-sm font-black text-blue-700 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:hover:bg-blue-100"
                    >
                      Encerrar
                    </button>

                    <button
                      type="button"
                      onClick={() => alterarStatus(rodada, "cancelada")}
                      disabled={rodada.status === "cancelada"}
                      className="touch-button inline-flex items-center justify-center gap-1 rounded-2xl border border-red-500/20 bg-red-50 px-3 py-3 text-sm font-black text-red-700 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:hover:bg-red-100"
                    >
                      <XCircle size={16} />
                      Cancelar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}