"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Handshake,
  Loader2,
  RefreshCw,
  Search,
  Trophy,
  Users,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type {
  Jogador,
  PartidaComRelacionamentos,
  Rodada,
  TimePartida,
} from "@/types/truco";

type FiltroRanking = "geral" | "ano" | "mes" | "semana" | "rodada";

type RankingJogador = {
  jogador: Jogador;
  vitorias: number;
  derrotas: number;
  jogos: number;
  aproveitamento: number;
};

type RankingParceria = {
  chave: string;
  jogador1: Jogador;
  jogador2: Jogador;
  jogos: number;
  vitorias: number;
  derrotas: number;
  aproveitamento: number;
};

const filtros: { id: FiltroRanking; label: string }[] = [
  { id: "geral", label: "Geral" },
  { id: "ano", label: "Ano" },
  { id: "mes", label: "Mês" },
  { id: "semana", label: "Semana" },
  { id: "rodada", label: "Rodada" },
];

function formatarData(data: string | null | undefined) {
  if (!data) return "-";

  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function nomeJogador(jogador: Jogador) {
  return jogador.apelido || jogador.nome;
}

function inicioDoDia(data: Date) {
  const copia = new Date(data);
  copia.setHours(0, 0, 0, 0);
  return copia;
}

function fimDoDia(data: Date) {
  const copia = new Date(data);
  copia.setHours(23, 59, 59, 999);
  return copia;
}

function inicioDaSemana(data: Date) {
  const copia = inicioDoDia(data);
  const diaSemana = copia.getDay();
  const diferenca = diaSemana === 0 ? 6 : diaSemana - 1;
  copia.setDate(copia.getDate() - diferenca);
  return copia;
}

function fimDaSemana(data: Date) {
  const inicio = inicioDaSemana(data);
  const fim = fimDoDia(inicio);
  fim.setDate(inicio.getDate() + 6);
  return fim;
}

function inicioDoMes(data: Date) {
  return new Date(data.getFullYear(), data.getMonth(), 1, 0, 0, 0, 0);
}

function fimDoMes(data: Date) {
  return new Date(data.getFullYear(), data.getMonth() + 1, 0, 23, 59, 59, 999);
}

function inicioDoAno(data: Date) {
  return new Date(data.getFullYear(), 0, 1, 0, 0, 0, 0);
}

function fimDoAno(data: Date) {
  return new Date(data.getFullYear(), 11, 31, 23, 59, 59, 999);
}

function partidaDentroDoPeriodo(
  partida: PartidaComRelacionamentos,
  filtro: FiltroRanking,
  rodadaIdSelecionada: string
) {
  if (partida.status !== "encerrada") return false;
  if (!partida.finalizada_at && !partida.created_at) return false;

  if (filtro === "geral") return true;

  if (filtro === "rodada") {
    if (!rodadaIdSelecionada) return true;
    return partida.rodada_id === rodadaIdSelecionada;
  }

  const base = new Date();
  const dataPartida = new Date(partida.finalizada_at || partida.created_at);

  if (filtro === "semana") {
    return (
      dataPartida >= inicioDaSemana(base) && dataPartida <= fimDaSemana(base)
    );
  }

  if (filtro === "mes") {
    return dataPartida >= inicioDoMes(base) && dataPartida <= fimDoMes(base);
  }

  if (filtro === "ano") {
    return dataPartida >= inicioDoAno(base) && dataPartida <= fimDoAno(base);
  }

  return true;
}

function calcularRankingJogadores(
  partidas: PartidaComRelacionamentos[],
  filtro: FiltroRanking,
  rodadaIdSelecionada: string
) {
  const mapa = new Map<string, RankingJogador>();

  partidas
    .filter((partida) =>
      partidaDentroDoPeriodo(partida, filtro, rodadaIdSelecionada)
    )
    .forEach((partida) => {
      const vencedor = partida.time_vencedor;

      if (!vencedor) return;

      partida.participantes_partida.forEach((participante) => {
        if (!participante.jogador) return;

        const registro =
          mapa.get(participante.jogador.id) ||
          ({
            jogador: participante.jogador,
            vitorias: 0,
            derrotas: 0,
            jogos: 0,
            aproveitamento: 0,
          } satisfies RankingJogador);

        registro.jogos += 1;

        if (participante.time === vencedor) {
          registro.vitorias += 1;
        } else {
          registro.derrotas += 1;
        }

        mapa.set(participante.jogador.id, registro);
      });
    });

  return Array.from(mapa.values()).map((item) => ({
    ...item,
    aproveitamento:
      item.jogos > 0 ? Math.round((item.vitorias / item.jogos) * 100) : 0,
  }));
}

function calcularParcerias(
  partidas: PartidaComRelacionamentos[],
  filtro: FiltroRanking,
  rodadaIdSelecionada: string
) {
  const mapa = new Map<string, RankingParceria>();

  partidas
    .filter((partida) =>
      partidaDentroDoPeriodo(partida, filtro, rodadaIdSelecionada)
    )
    .forEach((partida) => {
      const vencedor = partida.time_vencedor;

      if (!vencedor) return;

      (["A", "B"] as TimePartida[]).forEach((time) => {
        const participantesDoTime = partida.participantes_partida
          .filter((participante) => participante.time === time)
          .filter((participante) => participante.jogador);

        if (participantesDoTime.length < 2) return;

        for (let i = 0; i < participantesDoTime.length; i += 1) {
          for (let j = i + 1; j < participantesDoTime.length; j += 1) {
            const jogador1 = participantesDoTime[i].jogador;
            const jogador2 = participantesDoTime[j].jogador;

            if (!jogador1 || !jogador2) continue;

            const idsOrdenados = [jogador1.id, jogador2.id].sort();
            const chave = idsOrdenados.join("__");

            const primeiro =
              jogador1.id === idsOrdenados[0] ? jogador1 : jogador2;
            const segundo =
              jogador1.id === idsOrdenados[0] ? jogador2 : jogador1;

            const registro =
              mapa.get(chave) ||
              ({
                chave,
                jogador1: primeiro,
                jogador2: segundo,
                jogos: 0,
                vitorias: 0,
                derrotas: 0,
                aproveitamento: 0,
              } satisfies RankingParceria);

            registro.jogos += 1;

            if (time === vencedor) {
              registro.vitorias += 1;
            } else {
              registro.derrotas += 1;
            }

            mapa.set(chave, registro);
          }
        }
      });
    });

  return Array.from(mapa.values()).map((item) => ({
    ...item,
    aproveitamento:
      item.jogos > 0 ? Math.round((item.vitorias / item.jogos) * 100) : 0,
  }));
}

function descricaoFiltro(filtro: FiltroRanking, rodadaSelecionada: Rodada | null) {
  if (filtro === "geral") return "Todas as partidas encerradas.";
  if (filtro === "ano") return "Partidas encerradas no ano atual.";
  if (filtro === "mes") return "Partidas encerradas no mês atual.";
  if (filtro === "semana") return "Partidas encerradas na semana atual.";

  if (rodadaSelecionada) {
    return `Rodada de ${formatarData(rodadaSelecionada.data)}${
      rodadaSelecionada.local ? ` — ${rodadaSelecionada.local}` : ""
    }.`;
  }

  return "Todas as rodadas cadastradas.";
}

function nomeParceria(parceria: RankingParceria) {
  return `${nomeJogador(parceria.jogador1)} + ${nomeJogador(parceria.jogador2)}`;
}

export default function RankingParceriasPage() {
  const [rodadas, setRodadas] = useState<Rodada[]>([]);
  const [partidas, setPartidas] = useState<PartidaComRelacionamentos[]>([]);

  const [filtro, setFiltro] = useState<FiltroRanking>("geral");
  const [rodadaIdSelecionada, setRodadaIdSelecionada] = useState("");
  const [busca, setBusca] = useState("");

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  async function carregarDados() {
    setCarregando(true);
    setErro(null);

    const [rodadasResult, partidasResult] = await Promise.all([
      supabase
        .from("rodadas")
        .select("*")
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
        .eq("status", "encerrada")
        .order("finalizada_at", { ascending: false }),
    ]);

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

    setRodadas((rodadasResult.data ?? []) as Rodada[]);
    setPartidas((partidasResult.data ?? []) as PartidaComRelacionamentos[]);
    setCarregando(false);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const rodadaSelecionada = useMemo(() => {
    return rodadas.find((rodada) => rodada.id === rodadaIdSelecionada) ?? null;
  }, [rodadas, rodadaIdSelecionada]);

  const partidasConsideradas = useMemo(() => {
    return partidas.filter((partida) =>
      partidaDentroDoPeriodo(partida, filtro, rodadaIdSelecionada)
    );
  }, [partidas, filtro, rodadaIdSelecionada]);

  const rankingJogadores = useMemo(() => {
    return calcularRankingJogadores(partidas, filtro, rodadaIdSelecionada);
  }, [partidas, filtro, rodadaIdSelecionada]);

  const rankingParcerias = useMemo(() => {
    return calcularParcerias(partidas, filtro, rodadaIdSelecionada);
  }, [partidas, filtro, rodadaIdSelecionada]);

  const melhorParceria =
    [...rankingParcerias]
      .filter((item) => item.jogos >= 2)
      .sort((a, b) => {
        if (b.aproveitamento !== a.aproveitamento) {
          return b.aproveitamento - a.aproveitamento;
        }

        if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;

        return nomeParceria(a).localeCompare(nomeParceria(b));
      })[0] ?? null;

  const piorParceria =
    [...rankingParcerias]
      .filter((item) => item.jogos >= 2)
      .sort((a, b) => {
        if (a.aproveitamento !== b.aproveitamento) {
          return a.aproveitamento - b.aproveitamento;
        }

        if (b.derrotas !== a.derrotas) return b.derrotas - a.derrotas;

        return nomeParceria(a).localeCompare(nomeParceria(b));
      })[0] ?? null;

  const maisVencedor =
    [...rankingJogadores]
      .filter((item) => item.jogos > 0)
      .sort((a, b) => {
        if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
        return b.aproveitamento - a.aproveitamento;
      })[0] ?? null;

  const maisDerrotado =
    [...rankingJogadores]
      .filter((item) => item.jogos > 0)
      .sort((a, b) => {
        if (b.derrotas !== a.derrotas) return b.derrotas - a.derrotas;
        return a.aproveitamento - b.aproveitamento;
      })[0] ?? null;

  const parceriasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    const lista = [...rankingParcerias].sort((a, b) => {
      if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
      if (b.aproveitamento !== a.aproveitamento) {
        return b.aproveitamento - a.aproveitamento;
      }
      if (a.derrotas !== b.derrotas) return a.derrotas - b.derrotas;
      return nomeParceria(a).localeCompare(nomeParceria(b));
    });

    if (!termo) return lista;

    return lista.filter((item) => {
      return (
        nomeJogador(item.jogador1).toLowerCase().includes(termo) ||
        nomeJogador(item.jogador2).toLowerCase().includes(termo) ||
        item.jogador1.nome.toLowerCase().includes(termo) ||
        item.jogador2.nome.toLowerCase().includes(termo)
      );
    });
  }, [rankingParcerias, busca]);

  return (
    <main className="app-shell safe-bottom mx-auto flex w-full max-w-6xl flex-col px-4 pb-28 pt-5 sm:px-6 sm:pb-8 lg:px-8">
      <header className="mb-5 rounded-[1.5rem] border border-[#071A4A]/10 bg-white/90 p-4 shadow-xl shadow-[#071A4A]/5 sm:mb-8 sm:rounded-[2rem] sm:p-6">
        <div className="mb-4 flex flex-wrap gap-2">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] px-4 py-2 text-sm font-black text-[#071A4A] transition active:scale-[0.99] sm:hover:border-[#E6AA00]/60"
          >
            <ArrowLeft size={18} />
            Início
          </Link>

          <Link
            href="/ranking"
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#071A4A]/10 bg-white px-4 py-2 text-sm font-black text-[#071A4A] transition active:scale-[0.99] sm:hover:border-[#E6AA00]/60"
          >
            <Trophy size={18} />
            Ranking individual
          </Link>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#E6AA00]/35 bg-[#E6AA00]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#5A3924] sm:text-xs">
              <Handshake size={15} />
              Etapa 6
            </div>

            <h1 className="text-3xl font-black tracking-tight text-[#071A4A] sm:text-5xl">
              Zoação e Parcerias
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700 sm:text-base">
              Veja melhores e piores parcerias, maior vencedor e mais derrotado
              por período. Aqui começa a parte da resenha.
            </p>
          </div>

          <button
            type="button"
            onClick={carregarDados}
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

      <section className="mb-5 grid gap-4 sm:mb-8 lg:grid-cols-4">
        <div className="rounded-[1.5rem] border border-[#071A4A]/10 bg-white/90 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-slate-500">Partidas no filtro</p>
          <p className="mt-1 text-3xl font-black text-[#071A4A] sm:text-4xl">
            {partidasConsideradas.length}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Somente encerradas.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-[#E6AA00]/30 bg-[#FFF7D7] p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-[#5A3924]">Melhor parceria</p>
          <p className="mt-1 truncate text-2xl font-black text-[#071A4A]">
            {melhorParceria ? nomeParceria(melhorParceria) : "-"}
          </p>
          <p className="mt-2 text-sm leading-6 text-[#5A3924]">
            {melhorParceria
              ? `${melhorParceria.aproveitamento}% em ${melhorParceria.jogos} jogo(s)`
              : "Mínimo de 2 jogos juntos."}
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-green-600/20 bg-green-50 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-green-700">Mais vencedor</p>
          <p className="mt-1 truncate text-2xl font-black text-green-800">
            {maisVencedor ? nomeJogador(maisVencedor.jogador) : "-"}
          </p>
          <p className="mt-2 text-sm leading-6 text-green-700/80">
            {maisVencedor
              ? `${maisVencedor.vitorias} vitória(s)`
              : "Sem jogos no filtro."}
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-red-500/10 bg-red-50 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-red-600">Mais derrotado</p>
          <p className="mt-1 truncate text-2xl font-black text-red-700">
            {maisDerrotado ? nomeJogador(maisDerrotado.jogador) : "-"}
          </p>
          <p className="mt-2 text-sm leading-6 text-red-700/80">
            {maisDerrotado
              ? `${maisDerrotado.derrotas} derrota(s)`
              : "Sem zoeira ainda."}
          </p>
        </div>
      </section>

      <section className="mb-5 rounded-[1.5rem] border border-[#071A4A]/10 bg-white/90 p-4 shadow-xl shadow-[#071A4A]/5 sm:mb-8 sm:rounded-[1.75rem] sm:p-6">
        <div className="mb-5">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0B6B3A]">
            Filtros
          </p>
          <h2 className="mt-1 text-2xl font-black text-[#071A4A]">
            Período da zoeira
          </h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            {descricaoFiltro(filtro, rodadaSelecionada)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {filtros.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFiltro(item.id)}
              className={`touch-button rounded-2xl border px-4 py-3 text-sm font-black transition active:scale-[0.99] ${
                filtro === item.id
                  ? "border-[#0B6B3A] bg-[#0B6B3A] text-white"
                  : "border-[#071A4A]/15 bg-[#FAF8F1] text-[#071A4A]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {filtro === "rodada" && (
          <div className="mt-4">
            <label className="mb-2 block text-sm font-black text-[#071A4A]">
              Rodada
            </label>
            <select
              value={rodadaIdSelecionada}
              onChange={(event) => setRodadaIdSelecionada(event.target.value)}
              className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#0B6B3A]"
            >
              <option value="">Todas as rodadas</option>
              {rodadas.map((rodada) => (
                <option key={rodada.id} value={rodada.id}>
                  {formatarData(rodada.data)}
                  {rodada.local ? ` — ${rodada.local}` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        <label className="relative mt-4 block">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar jogador ou parceria"
            className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] py-3 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0B6B3A]"
          />
        </label>
      </section>

      <section className="mb-5 grid gap-4 sm:mb-8 lg:grid-cols-2">
        <div className="rounded-[1.5rem] border border-[#E6AA00]/30 bg-[#FFF7D7] p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-[#5A3924]">
            Melhor parceria oficial
          </p>
          <h2 className="mt-2 text-2xl font-black text-[#071A4A]">
            {melhorParceria ? nomeParceria(melhorParceria) : "-"}
          </h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#5A3924]">
            {melhorParceria
              ? `${melhorParceria.vitorias} vitória(s), ${melhorParceria.derrotas} derrota(s), ${melhorParceria.aproveitamento}% de aproveitamento.`
              : "Ainda não existe parceria com pelo menos 2 jogos no filtro."}
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-red-500/10 bg-red-50 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-red-600">Pior parceria</p>
          <h2 className="mt-2 text-2xl font-black text-red-700">
            {piorParceria ? nomeParceria(piorParceria) : "-"}
          </h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-red-700/80">
            {piorParceria
              ? `${piorParceria.vitorias} vitória(s), ${piorParceria.derrotas} derrota(s), ${piorParceria.aproveitamento}% de aproveitamento.`
              : "Ainda não existe parceria com pelo menos 2 jogos no filtro."}
          </p>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-[#071A4A]/10 bg-white/90 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E6AA00] text-[#071A4A]">
            <Users size={22} />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0B6B3A]">
              Classificação
            </p>
            <h2 className="text-2xl font-black text-[#071A4A]">
              Ranking de parcerias
            </h2>
          </div>
        </div>

        {carregando ? (
          <div className="flex min-h-32 items-center justify-center rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] p-5 text-sm font-bold text-slate-500">
            <Loader2 size={18} className="mr-2 animate-spin" />
            Carregando parcerias...
          </div>
        ) : parceriasFiltradas.length === 0 ? (
          <div className="rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] p-5 text-sm font-bold text-slate-500">
            Nenhuma parceria encontrada. Em partidas 1x1 não há parceria para
            calcular.
          </div>
        ) : (
          <div className="grid gap-3">
            {parceriasFiltradas.map((item, index) => {
              const posicao = index + 1;

              return (
                <article
                  key={item.chave}
                  className={`rounded-2xl border p-4 ${
                    posicao === 1
                      ? "border-[#E6AA00]/50 bg-[#FFF7D7]"
                      : "border-[#071A4A]/10 bg-[#FAF8F1]"
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-500">
                        #{posicao}
                      </p>
                      <h3 className="text-xl font-black text-[#071A4A]">
                        {nomeParceria(item)}
                      </h3>
                      <p className="mt-1 text-sm font-semibold text-slate-600">
                        {item.jogos} jogo(s) juntos
                      </p>
                    </div>

                    <div className="grid grid-cols-4 gap-2 sm:min-w-[420px]">
                      <div className="rounded-2xl bg-white p-3 text-center">
                        <p className="text-xs font-black text-slate-500">V</p>
                        <p className="text-2xl font-black text-green-700">
                          {item.vitorias}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-3 text-center">
                        <p className="text-xs font-black text-slate-500">D</p>
                        <p className="text-2xl font-black text-red-700">
                          {item.derrotas}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-3 text-center">
                        <p className="text-xs font-black text-slate-500">J</p>
                        <p className="text-2xl font-black text-[#071A4A]">
                          {item.jogos}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-3 text-center">
                        <p className="text-xs font-black text-slate-500">%</p>
                        <p className="text-2xl font-black text-[#071A4A]">
                          {item.aproveitamento}
                        </p>
                      </div>
                    </div>
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