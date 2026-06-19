"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Club,
  Loader2,
  Minus,
  PlayCircle,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type {
  Jogador,
  PartidaComRelacionamentos,
  Rodada,
  TimePartida,
  TipoPartida,
} from "@/types/truco";

type FormState = {
  rodada_id: string;
  tipo_partida: TipoPartida;
  time_a: string[];
  time_b: string[];
  observacoes: string;
};

const limitePontos = 12;

const tipoPartidaQtd: Record<TipoPartida, number> = {
  "1x1": 1,
  "2x2": 2,
  "3x3": 3,
};

function criarFormInicial(tipo: TipoPartida = "2x2"): FormState {
  const quantidade = tipoPartidaQtd[tipo];

  return {
    rodada_id: "",
    tipo_partida: tipo,
    time_a: Array.from({ length: quantidade }, () => ""),
    time_b: Array.from({ length: quantidade }, () => ""),
    observacoes: "",
  };
}

function formatarData(data: string | null | undefined) {
  if (!data) return "-";

  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function formatarHorario(horario: string | null | undefined) {
  if (!horario) return "";
  return horario.slice(0, 5);
}

function nomeJogador(jogador: Jogador | null | undefined) {
  if (!jogador) return "-";
  return jogador.apelido || jogador.nome;
}

function formatarDataHora(valor: string) {
  const data = new Date(valor);

  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function nomesDoTime(partida: PartidaComRelacionamentos, time: TimePartida) {
  return partida.participantes_partida
    .filter((participante) => participante.time === time)
    .map((participante) => nomeJogador(participante.jogador));
}

function nomePrincipalDoTime(
  partida: PartidaComRelacionamentos,
  time: TimePartida
) {
  const primeiroParticipante = partida.participantes_partida.find(
    (participante) => participante.time === time
  );

  return nomeJogador(primeiroParticipante?.jogador);
}

export default function NovaPartidaPage() {
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [rodadas, setRodadas] = useState<Rodada[]>([]);
  const [partidas, setPartidas] = useState<PartidaComRelacionamentos[]>([]);
  const [partidaAtual, setPartidaAtual] =
    useState<PartidaComRelacionamentos | null>(null);

  const [form, setForm] = useState<FormState>(criarFormInicial("2x2"));
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [mostrarMarcador, setMostrarMarcador] = useState(false);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const jogadoresAtivos = useMemo(() => {
    return jogadores
      .filter((jogador) => jogador.ativo)
      .sort((a, b) => {
        const nomeA = a.apelido || a.nome;
        const nomeB = b.apelido || b.nome;
        return nomeA.localeCompare(nomeB);
      });
  }, [jogadores]);

  const rodadaSelecionada = useMemo(() => {
    return rodadas.find((rodada) => rodada.id === form.rodada_id) ?? null;
  }, [rodadas, form.rodada_id]);

  const jogadoresSelecionados = useMemo(() => {
    return [...form.time_a, ...form.time_b].filter(Boolean);
  }, [form.time_a, form.time_b]);

  const temJogadorRepetido = useMemo(() => {
    return new Set(jogadoresSelecionados).size !== jogadoresSelecionados.length;
  }, [jogadoresSelecionados]);

  const podeIniciar = useMemo(() => {
    const quantidade = tipoPartidaQtd[form.tipo_partida];

    return (
      Boolean(form.rodada_id) &&
      form.time_a.length === quantidade &&
      form.time_b.length === quantidade &&
      form.time_a.every(Boolean) &&
      form.time_b.every(Boolean) &&
      !temJogadorRepetido
    );
  }, [form, temJogadorRepetido]);

  async function carregarDados() {
    setCarregando(true);
    setErro(null);

    const [jogadoresResult, rodadasResult, partidasResult] = await Promise.all([
      supabase
        .from("jogadores")
        .select("*")
        .eq("ativo", true)
        .order("nome", { ascending: true }),

      supabase
        .from("rodadas")
        .select("*")
        .eq("status", "aberta")
        .order("data", { ascending: false })
        .order("created_at", { ascending: false }),

      supabase
        .from("partidas")
        .select(
          `
          *,
          rodada:rodadas (*),
          participantes_partida (
            *,
            jogador:jogadores (*)
          )
        `
        )
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    if (jogadoresResult.error) {
      setErro(jogadoresResult.error.message);
      setCarregando(false);
      return;
    }

    if (rodadasResult.error) {
      setErro(rodadasResult.error.message);
      setCarregando(false);
      return;
    }

    if (partidasResult.error) {
      setErro(partidasResult.error.message);
      setCarregando(false);
      return;
    }

    const rodadasAbertas = (rodadasResult.data ?? []) as Rodada[];
    const partidasCarregadas =
      (partidasResult.data ?? []) as PartidaComRelacionamentos[];

    const partidaEmAndamento =
      partidasCarregadas.find(
        (partida) => partida.status === "em_andamento"
      ) ?? null;

    setJogadores((jogadoresResult.data ?? []) as Jogador[]);
    setRodadas(rodadasAbertas);
    setPartidas(partidasCarregadas);
    setPartidaAtual(partidaEmAndamento);

    setForm((atual) => ({
      ...atual,
      rodada_id: atual.rodada_id || rodadasAbertas[0]?.id || "",
    }));

    if (!partidaEmAndamento) {
      setMostrarMarcador(false);
    }

    setCarregando(false);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function alterarTipoPartida(tipo: TipoPartida) {
    const quantidade = tipoPartidaQtd[tipo];

    setForm((atual) => ({
      ...atual,
      tipo_partida: tipo,
      time_a: Array.from(
        { length: quantidade },
        (_, index) => atual.time_a[index] || ""
      ),
      time_b: Array.from(
        { length: quantidade },
        (_, index) => atual.time_b[index] || ""
      ),
    }));
  }

  function atualizarJogadorTime(
    time: TimePartida,
    index: number,
    jogadorId: string
  ) {
    setForm((atual) => {
      const campo = time === "A" ? "time_a" : "time_b";
      const lista = [...atual[campo]];
      lista[index] = jogadorId;

      return {
        ...atual,
        [campo]: lista,
      };
    });
  }

  function validarFormulario() {
    if (!form.rodada_id) {
      return "Selecione uma rodada aberta.";
    }

    if (!form.time_a.every(Boolean) || !form.time_b.every(Boolean)) {
      return "Selecione todos os jogadores da partida.";
    }

    if (temJogadorRepetido) {
      return "Não é possível repetir o mesmo jogador na partida.";
    }

    return null;
  }

  async function iniciarPartida() {
    setErro(null);
    setSucesso(null);

    if (partidaAtual && partidaAtual.status === "em_andamento") {
      setErro(
        "Já existe uma partida em andamento. Continue ou cancele antes de iniciar outra."
      );
      return;
    }

    const erroValidacao = validarFormulario();

    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    setSalvando(true);

    const { data: partidaCriada, error: partidaError } = await supabase
      .from("partidas")
      .insert({
        rodada_id: form.rodada_id,
        tipo_partida: form.tipo_partida,
        status: "em_andamento",
        placar_time_a: 0,
        placar_time_b: 0,
        limite_pontos: limitePontos,
        observacoes: form.observacoes.trim() || null,
      })
      .select("*")
      .single();

    if (partidaError || !partidaCriada) {
      setErro(partidaError?.message || "Erro ao criar partida.");
      setSalvando(false);
      return;
    }

    const participantes = [
      ...form.time_a.map((jogadorId) => ({
        partida_id: partidaCriada.id,
        jogador_id: jogadorId,
        time: "A" as TimePartida,
      })),
      ...form.time_b.map((jogadorId) => ({
        partida_id: partidaCriada.id,
        jogador_id: jogadorId,
        time: "B" as TimePartida,
      })),
    ];

    const { error: participantesError } = await supabase
      .from("participantes_partida")
      .insert(participantes);

    if (participantesError) {
      await supabase.from("partidas").delete().eq("id", partidaCriada.id);
      setErro(participantesError.message);
      setSalvando(false);
      return;
    }

    setSucesso("Partida iniciada. Bora marcar os pontos.");
    setMostrarMarcador(true);
    setSalvando(false);
    await carregarDados();
  }

  async function marcarPonto(time: TimePartida, valor: -1 | 1) {
    if (!partidaAtual) {
      setErro("Nenhuma partida em andamento.");
      return;
    }

    if (partidaAtual.status !== "em_andamento") {
      setErro("Essa partida não está em andamento.");
      return;
    }

    setErro(null);
    setSucesso(null);
    setSalvando(true);

    const placarAtual =
      time === "A" ? partidaAtual.placar_time_a : partidaAtual.placar_time_b;

    const novoPlacar = placarAtual + valor;

    if (novoPlacar < 0) {
      setErro("O placar não pode ficar negativo.");
      setSalvando(false);
      return;
    }

    const updatePayload =
      time === "A"
        ? {
            placar_time_a: novoPlacar,
            updated_at: new Date().toISOString(),
          }
        : {
            placar_time_b: novoPlacar,
            updated_at: new Date().toISOString(),
          };

    const { error: pontoError } = await supabase.from("pontos_partida").insert({
      partida_id: partidaAtual.id,
      time,
      valor,
    });

    if (pontoError) {
      setErro(pontoError.message);
      setSalvando(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("partidas")
      .update(updatePayload)
      .eq("id", partidaAtual.id);

    if (updateError) {
      setErro(updateError.message);
      setSalvando(false);
      return;
    }

    setSalvando(false);
    await carregarDados();
  }

  async function desfazerUltimoPonto() {
    if (!partidaAtual) {
      setErro("Nenhuma partida em andamento.");
      return;
    }

    setErro(null);
    setSucesso(null);
    setSalvando(true);

    const { data: ultimoPonto, error: buscaError } = await supabase
      .from("pontos_partida")
      .select("*")
      .eq("partida_id", partidaAtual.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (buscaError) {
      setErro(buscaError.message);
      setSalvando(false);
      return;
    }

    if (!ultimoPonto) {
      setErro("Não há ponto para desfazer.");
      setSalvando(false);
      return;
    }

    const time = ultimoPonto.time as TimePartida;
    const valor = Number(ultimoPonto.valor) as -1 | 1;

    const placarAtual =
      time === "A" ? partidaAtual.placar_time_a : partidaAtual.placar_time_b;

    const novoPlacar = Math.max(0, placarAtual - valor);

    const updatePayload =
      time === "A"
        ? {
            placar_time_a: novoPlacar,
            updated_at: new Date().toISOString(),
          }
        : {
            placar_time_b: novoPlacar,
            updated_at: new Date().toISOString(),
          };

    const { error: deleteError } = await supabase
      .from("pontos_partida")
      .delete()
      .eq("id", ultimoPonto.id);

    if (deleteError) {
      setErro(deleteError.message);
      setSalvando(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("partidas")
      .update(updatePayload)
      .eq("id", partidaAtual.id);

    if (updateError) {
      setErro(updateError.message);
      setSalvando(false);
      return;
    }

    setSucesso("Último ponto desfeito.");
    setSalvando(false);
    await carregarDados();
  }

  async function encerrarPartida() {
    if (!partidaAtual) {
      setErro("Nenhuma partida em andamento.");
      return;
    }

    setErro(null);
    setSucesso(null);

    const { placar_time_a, placar_time_b } = partidaAtual;

    if (placar_time_a === placar_time_b) {
      setErro("Não é possível encerrar empatado.");
      return;
    }

    const timeVencedor: TimePartida =
      placar_time_a > placar_time_b ? "A" : "B";

    const confirmar = window.confirm(
      `Confirmar vitória do Time ${timeVencedor}?`
    );

    if (!confirmar) return;

    setSalvando(true);

    const { error } = await supabase
      .from("partidas")
      .update({
        status: "encerrada",
        time_vencedor: timeVencedor,
        updated_at: new Date().toISOString(),
        finalizada_at: new Date().toISOString(),
      })
      .eq("id", partidaAtual.id);

    if (error) {
      setErro(error.message);
      setSalvando(false);
      return;
    }

    setSucesso(`Partida encerrada. Vitória do Time ${timeVencedor}.`);
    setPartidaAtual(null);
    setMostrarMarcador(false);
    setForm((atual) => criarFormInicial(atual.tipo_partida));
    setSalvando(false);
    await carregarDados();
  }

  async function cancelarPartida() {
    if (!partidaAtual) {
      setErro("Nenhuma partida em andamento.");
      return;
    }

    const confirmar = window.confirm("Cancelar esta partida em andamento?");

    if (!confirmar) return;

    setErro(null);
    setSucesso(null);
    setSalvando(true);

    const { error } = await supabase
      .from("partidas")
      .update({
        status: "cancelada",
        updated_at: new Date().toISOString(),
        finalizada_at: new Date().toISOString(),
      })
      .eq("id", partidaAtual.id);

    if (error) {
      setErro(error.message);
      setSalvando(false);
      return;
    }

    setSucesso("Partida cancelada.");
    setPartidaAtual(null);
    setMostrarMarcador(false);
    setSalvando(false);
    await carregarDados();
  }

  function trucoVisual() {
    setSucesso(
      "TRUUUCO! Por enquanto é só grito. A regra de valor entra depois."
    );
  }

  const timeANomeMarcador = partidaAtual
    ? nomePrincipalDoTime(partidaAtual, "A")
    : "-";

  const timeBNomeMarcador = partidaAtual
    ? nomePrincipalDoTime(partidaAtual, "B")
    : "-";

  if (partidaAtual && mostrarMarcador) {
    return (
      <main className="safe-bottom min-h-[100dvh] bg-[#050505] px-3 pb-4 pt-4 text-white">
        <header className="mb-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setMostrarMarcador(false)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white active:scale-95"
          >
            <ArrowLeft size={21} />
          </button>

          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-xs font-black uppercase tracking-[0.22em] text-[#F4C542]">
              Truco no Valville
            </p>
            <p className="truncate text-sm font-bold text-white/70">
              {partidaAtual.rodada
                ? `${formatarData(partidaAtual.rodada.data)}${
                    partidaAtual.rodada.local
                      ? ` — ${partidaAtual.rodada.local}`
                      : ""
                  }`
                : "Partida em andamento"}
            </p>
          </div>

          <button
            type="button"
            onClick={carregarDados}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white active:scale-95"
          >
            <RefreshCw size={20} />
          </button>
        </header>

        {erro && (
          <div className="mb-3 rounded-2xl border border-red-500/30 bg-red-500/15 p-3 text-sm font-bold text-red-100">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="mb-3 rounded-2xl border border-green-500/25 bg-green-500/15 p-3 text-sm font-bold text-green-100">
            {sucesso}
          </div>
        )}

        <section className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-[radial-gradient(circle_at_top,#1f1f1f,#050505_55%)] p-4 shadow-2xl">
          <div className="mb-4 flex items-center justify-center gap-2">
            <span className="rounded-full border border-[#F4C542]/30 bg-[#F4C542]/10 px-3 py-1 text-xs font-black text-[#F4C542]">
              {partidaAtual.tipo_partida}
            </span>
            <span className="rounded-full border border-green-400/25 bg-green-400/10 px-3 py-1 text-xs font-black text-green-300">
              Até {partidaAtual.limite_pontos}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="mb-2 flex min-h-[58px] items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-2 py-3">
                <p className="truncate text-2xl font-black leading-tight tracking-wide text-white drop-shadow sm:text-4xl">
                  {timeANomeMarcador}
                </p>
              </div>

              <p className="mb-3 text-[5.2rem] font-black leading-none tracking-tight text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.8)] sm:text-9xl">
                {partidaAtual.placar_time_a}
              </p>

              <button
                type="button"
                disabled={salvando}
                onClick={() => marcarPonto("A", 1)}
                className="mb-3 flex h-20 w-full items-center justify-center gap-2 rounded-[1.4rem] border border-white/20 bg-white text-3xl font-black text-black shadow-lg active:scale-[0.98] disabled:opacity-50"
              >
                <Plus size={28} /> 1
              </button>

              <button
                type="button"
                disabled={salvando}
                onClick={() => marcarPonto("A", -1)}
                className="flex h-12 w-full items-center justify-center gap-1 rounded-2xl bg-red-600 text-base font-black text-white active:scale-[0.98] disabled:opacity-50"
              >
                <Minus size={18} /> 1
              </button>
            </div>

            <div className="text-center">
              <div className="mb-2 min-h-[58px] rounded-2xl border border-white/10 bg-white/5 px-2 py-3">
                <p className="truncate text-2xl font-black leading-tight tracking-wide text-white drop-shadow sm:text-4xl">
                  {timeBNomeMarcador}
                </p>
              </div>

              <p className="mb-3 text-[5.2rem] font-black leading-none tracking-tight text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.8)] sm:text-9xl">
                {partidaAtual.placar_time_b}
              </p>

              <button
                type="button"
                disabled={salvando}
                onClick={() => marcarPonto("B", 1)}
                className="mb-3 flex h-20 w-full items-center justify-center gap-2 rounded-[1.4rem] border border-white/20 bg-white text-3xl font-black text-black shadow-lg active:scale-[0.98] disabled:opacity-50"
              >
                <Plus size={28} /> 1
              </button>

              <button
                type="button"
                disabled={salvando}
                onClick={() => marcarPonto("B", -1)}
                className="flex h-12 w-full items-center justify-center gap-1 rounded-2xl bg-red-600 text-base font-black text-white active:scale-[0.98] disabled:opacity-50"
              >
                <Minus size={18} /> 1
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={trucoVisual}
            className="mt-5 flex h-16 w-full items-center justify-center rounded-2xl border border-white/35 bg-white/10 text-xl font-black text-white shadow-inner active:scale-[0.98]"
          >
            ❤️ Truuuco! ❤️
          </button>

          {(partidaAtual.placar_time_a >= limitePontos ||
            partidaAtual.placar_time_b >= limitePontos) && (
            <div className="mt-4 rounded-2xl border border-[#F4C542]/30 bg-[#F4C542]/10 p-3 text-center text-sm font-black text-[#F4C542]">
              Um dos times chegou a 12. Pode encerrar.
            </div>
          )}

          <div className="mt-4 grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={salvando}
              onClick={desfazerUltimoPonto}
              className="flex min-h-14 flex-col items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-2 text-xs font-black text-white active:scale-[0.98] disabled:opacity-50"
            >
              <RotateCcw size={18} />
              Desfazer
            </button>

            <button
              type="button"
              disabled={salvando}
              onClick={encerrarPartida}
              className="flex min-h-14 flex-col items-center justify-center rounded-2xl bg-[#0B6B3A] px-2 text-xs font-black text-white active:scale-[0.98] disabled:opacity-50"
            >
              <Trophy size={18} />
              Encerrar
            </button>

            <button
              type="button"
              disabled={salvando}
              onClick={cancelarPartida}
              className="flex min-h-14 flex-col items-center justify-center rounded-2xl bg-red-600 px-2 text-xs font-black text-white active:scale-[0.98] disabled:opacity-50"
            >
              <XCircle size={18} />
              Cancelar
            </button>
          </div>
        </section>

        <p className="mt-3 text-center text-xs font-bold text-white/40">
          Marcador mobile — Truco no Valville
        </p>
      </main>
    );
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
            onClick={carregarDados}
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#071A4A]/10 bg-white px-4 py-2 text-sm font-black text-[#071A4A] transition active:scale-[0.99] sm:hover:border-[#E6AA00]/60"
          >
            <RefreshCw size={18} />
            Atualizar
          </button>
        </div>

        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#E6AA00]/35 bg-[#E6AA00]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#5A3924] sm:text-xs">
            <Club size={15} />
            Partida
          </div>

          <h1 className="text-3xl font-black tracking-tight text-[#071A4A] sm:text-5xl">
            Nova partida
          </h1>

          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-700 sm:text-base">
            Escolha a rodada, monte os times e inicie o marcador.
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

      {partidaAtual && (
        <section className="mb-5 rounded-[1.5rem] border border-[#E6AA00]/30 bg-[#FFF7D7] p-4 shadow-xl shadow-[#071A4A]/5 sm:mb-8 sm:rounded-[1.75rem] sm:p-6">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E6AA00] text-[#071A4A]">
              <PlayCircle size={24} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#5A3924]">
                Partida em andamento
              </p>
              <h2 className="mt-1 text-2xl font-black text-[#071A4A]">
                Existe uma partida aberta
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5A3924]">
                Continue o marcador ou cancele essa partida antes de iniciar
                outra.
              </p>
            </div>
          </div>

          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0B6B3A]">
                Time A
              </p>
              <p className="mt-1 text-lg font-black text-[#071A4A]">
                {nomesDoTime(partidaAtual, "A").join(" + ")}
              </p>
              <p className="mt-2 text-3xl font-black text-[#071A4A]">
                {partidaAtual.placar_time_a}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#5A3924]">
                Time B
              </p>
              <p className="mt-1 text-lg font-black text-[#071A4A]">
                {nomesDoTime(partidaAtual, "B").join(" + ")}
              </p>
              <p className="mt-2 text-3xl font-black text-[#071A4A]">
                {partidaAtual.placar_time_b}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setMostrarMarcador(true)}
              className="touch-button inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0B6B3A] px-5 py-4 text-sm font-black text-white shadow-lg shadow-[#0B6B3A]/20 transition active:scale-[0.99]"
            >
              <PlayCircle size={20} />
              Continuar marcador
            </button>

            <button
              type="button"
              disabled={salvando}
              onClick={cancelarPartida}
              className="touch-button inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 text-sm font-black text-white transition active:scale-[0.99] disabled:opacity-50"
            >
              <XCircle size={20} />
              Cancelar partida
            </button>

            <button
              type="button"
              onClick={carregarDados}
              className="touch-button inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#071A4A]/10 bg-white px-5 py-4 text-sm font-black text-[#071A4A] transition active:scale-[0.99]"
            >
              <RefreshCw size={20} />
              Atualizar
            </button>
          </div>
        </section>
      )}

      {!partidaAtual && (
        <section className="mb-5 rounded-[1.5rem] border border-[#071A4A]/10 bg-white/95 p-4 shadow-xl shadow-[#071A4A]/5 sm:mb-8 sm:rounded-[1.75rem] sm:p-6">
          {carregando ? (
            <div className="flex min-h-32 items-center justify-center rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] p-5 text-sm font-bold text-slate-500">
              <Loader2 size={18} className="mr-2 animate-spin" />
              Carregando dados...
            </div>
          ) : (
            <div className="grid gap-5">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <label className="mb-2 block text-sm font-black text-[#071A4A]">
                    Rodada aberta
                  </label>
                  <select
                    value={form.rodada_id}
                    onChange={(event) =>
                      setForm((atual) => ({
                        ...atual,
                        rodada_id: event.target.value,
                      }))
                    }
                    className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#0B6B3A]"
                  >
                    <option value="">Selecione uma rodada</option>
                    {rodadas.map((rodada) => (
                      <option key={rodada.id} value={rodada.id}>
                        {formatarData(rodada.data)}{" "}
                        {formatarHorario(rodada.horario)}
                        {rodada.local ? ` — ${rodada.local}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <Link
                  href="/rodadas"
                  className="touch-button inline-flex min-h-12 items-center justify-center rounded-2xl border border-[#071A4A]/10 bg-white px-4 py-3 text-sm font-black text-[#071A4A] transition active:scale-[0.99] sm:hover:border-[#E6AA00]/60"
                >
                  Rodadas
                </Link>
              </div>

              {rodadas.length === 0 && (
                <div className="rounded-2xl border border-[#E6AA00]/30 bg-[#FFF7D7] p-4 text-sm font-bold leading-6 text-[#5A3924]">
                  Nenhuma rodada aberta encontrada. Crie ou reabra uma rodada
                  para iniciar uma partida.
                </div>
              )}

              {rodadaSelecionada && (
                <div className="rounded-2xl border border-green-600/20 bg-green-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">
                    Rodada selecionada
                  </p>
                  <p className="mt-1 text-lg font-black text-[#071A4A]">
                    {formatarData(rodadaSelecionada.data)}{" "}
                    {formatarHorario(rodadaSelecionada.horario)}
                  </p>
                  {rodadaSelecionada.local && (
                    <p className="mt-1 text-sm font-semibold text-green-700">
                      {rodadaSelecionada.local}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-black text-[#071A4A]">
                  Tipo de partida
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {(["1x1", "2x2", "3x3"] as TipoPartida[]).map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => alterarTipoPartida(tipo)}
                      className={`touch-button rounded-2xl border px-4 py-4 text-base font-black transition active:scale-[0.99] ${
                        form.tipo_partida === tipo
                          ? "border-[#0B6B3A] bg-[#0B6B3A] text-white shadow-lg shadow-[#0B6B3A]/20"
                          : "border-[#071A4A]/15 bg-[#FAF8F1] text-[#071A4A]"
                      }`}
                    >
                      {tipo}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-[1.25rem] border border-[#0B6B3A]/20 bg-green-50 p-4">
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Users size={18} className="text-[#0B6B3A]" />
                      <h3 className="text-xl font-black text-[#071A4A]">
                        Time A
                      </h3>
                    </div>

                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#0B6B3A]">
                      {form.time_a.filter(Boolean).length}/{form.time_a.length}
                    </span>
                  </div>

                  <div className="grid gap-3">
                    {form.time_a.map((jogadorId, index) => (
                      <select
                        key={`a-${index}`}
                        value={jogadorId}
                        onChange={(event) =>
                          atualizarJogadorTime("A", index, event.target.value)
                        }
                        className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#0B6B3A]"
                      >
                        <option value="">Jogador A{index + 1}</option>
                        {jogadoresAtivos.map((jogador) => (
                          <option key={jogador.id} value={jogador.id}>
                            {jogador.apelido || jogador.nome}
                          </option>
                        ))}
                      </select>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.25rem] border border-[#E6AA00]/30 bg-[#FFF7D7] p-4">
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Users size={18} className="text-[#5A3924]" />
                      <h3 className="text-xl font-black text-[#071A4A]">
                        Time B
                      </h3>
                    </div>

                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#5A3924]">
                      {form.time_b.filter(Boolean).length}/{form.time_b.length}
                    </span>
                  </div>

                  <div className="grid gap-3">
                    {form.time_b.map((jogadorId, index) => (
                      <select
                        key={`b-${index}`}
                        value={jogadorId}
                        onChange={(event) =>
                          atualizarJogadorTime("B", index, event.target.value)
                        }
                        className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#0B6B3A]"
                      >
                        <option value="">Jogador B{index + 1}</option>
                        {jogadoresAtivos.map((jogador) => (
                          <option key={jogador.id} value={jogador.id}>
                            {jogador.apelido || jogador.nome}
                          </option>
                        ))}
                      </select>
                    ))}
                  </div>
                </div>
              </div>

              {temJogadorRepetido && (
                <div className="rounded-2xl border border-red-500/30 bg-red-50 p-4 text-sm font-bold text-red-700">
                  Existe jogador repetido na partida. Escolha jogadores
                  diferentes.
                </div>
              )}

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
                  placeholder="Ex: jogo valendo barriguinha de pinga"
                  className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0B6B3A]"
                />
              </div>

              <button
                type="button"
                onClick={iniciarPartida}
                disabled={!podeIniciar || salvando}
                className="touch-button sticky bottom-4 z-10 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0B6B3A] px-5 py-4 text-base font-black text-white shadow-xl shadow-[#0B6B3A]/25 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:static sm:hover:bg-[#064527]"
              >
                {salvando ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Save size={20} />
                )}
                Iniciar partida
              </button>
            </div>
          )}
        </section>
      )}

      <section className="rounded-[1.5rem] border border-[#071A4A]/10 bg-white/95 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-6">
        <button
          type="button"
          onClick={() => setMostrarHistorico((atual) => !atual)}
          className="flex w-full items-center justify-between gap-4 rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] p-4 text-left transition active:scale-[0.99]"
        >
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0B6B3A]">
              Histórico
            </p>
            <h2 className="mt-1 text-2xl font-black text-[#071A4A]">
              Últimas partidas
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              {partidas.length} partida(s) recentes.
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
          <div className="mt-5">
            {carregando ? (
              <div className="flex min-h-32 items-center justify-center rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] p-5 text-sm font-bold text-slate-500">
                <Loader2 size={18} className="mr-2 animate-spin" />
                Carregando partidas...
              </div>
            ) : partidas.length === 0 ? (
              <div className="rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] p-5 text-sm font-bold text-slate-500">
                Nenhuma partida registrada ainda.
              </div>
            ) : (
              <div className="grid gap-3">
                {partidas.map((partida) => {
                  const timeA = nomesDoTime(partida, "A");
                  const timeB = nomesDoTime(partida, "B");

                  return (
                    <article
                      key={partida.id}
                      className="rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] p-4"
                    >
                      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-black text-slate-500">
                            {formatarDataHora(partida.created_at)}
                          </p>
                          <h3 className="text-lg font-black text-[#071A4A]">
                            {partida.rodada
                              ? `${formatarData(partida.rodada.data)} — ${
                                  partida.rodada.local || "local a definir"
                                }`
                              : "Rodada não vinculada"}
                          </h3>
                        </div>

                        <span className="inline-flex w-fit rounded-full bg-white px-3 py-1 text-xs font-black text-[#071A4A]">
                          {partida.status === "em_andamento"
                            ? "Em andamento"
                            : partida.status === "encerrada"
                              ? `Venceu Time ${partida.time_vencedor}`
                              : "Cancelada"}
                        </span>
                      </div>

                      <div className="grid gap-3 lg:grid-cols-2">
                        <div
                          className={`rounded-2xl border p-3 ${
                            partida.time_vencedor === "A"
                              ? "border-green-600/20 bg-green-50"
                              : "border-[#071A4A]/10 bg-white"
                          }`}
                        >
                          <p className="mb-1 text-xs font-black uppercase tracking-[0.18em] text-[#0B6B3A]">
                            Time A
                          </p>
                          <p className="text-base font-black text-[#071A4A]">
                            {timeA.join(" + ")}
                          </p>
                          <p className="mt-2 text-2xl font-black text-[#071A4A]">
                            {partida.placar_time_a}
                          </p>
                        </div>

                        <div
                          className={`rounded-2xl border p-3 ${
                            partida.time_vencedor === "B"
                              ? "border-[#E6AA00]/40 bg-[#FFF7D7]"
                              : "border-[#071A4A]/10 bg-white"
                          }`}
                        >
                          <p className="mb-1 text-xs font-black uppercase tracking-[0.18em] text-[#5A3924]">
                            Time B
                          </p>
                          <p className="text-base font-black text-[#071A4A]">
                            {timeB.join(" + ")}
                          </p>
                          <p className="mt-2 text-2xl font-black text-[#071A4A]">
                            {partida.placar_time_b}
                          </p>
                        </div>
                      </div>

                      {partida.observacoes && (
                        <p className="mt-3 text-sm font-semibold text-slate-600">
                          Observações:{" "}
                          <strong className="text-slate-800">
                            {partida.observacoes}
                          </strong>
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}