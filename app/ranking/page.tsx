"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Home,
  Loader2,
  Medal,
  PlayCircle,
  RefreshCw,
  Search,
  Trophy,
  Users,
  Wallet,
  XCircle,
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

function nomeJogador(jogador: Jogador | null | undefined) {
  if (!jogador) return "-";
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

function calcularRanking(
  jogadores: Jogador[],
  partidas: PartidaComRelacionamentos[],
  filtro: FiltroRanking,
  rodadaIdSelecionada: string
) {
  const mapa = new Map<string, RankingJogador>();

  jogadores.forEach((jogador) => {
    mapa.set(jogador.id, {
      jogador,
      vitorias: 0,
      derrotas: 0,
      jogos: 0,
      aproveitamento: 0,
    });
  });

  partidas
    .filter((partida) =>
      partidaDentroDoPeriodo(partida, filtro, rodadaIdSelecionada)
    )
    .forEach((partida) => {
      const vencedor = partida.time_vencedor as TimePartida | null;

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

  return Array.from(mapa.values())
    .map((item) => ({
      ...item,
      aproveitamento:
        item.jogos > 0 ? Math.round((item.vitorias / item.jogos) * 100) : 0,
    }))
    .sort((a, b) => {
      if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
      if (b.aproveitamento !== a.aproveitamento) {
        return b.aproveitamento - a.aproveitamento;
      }
      if (a.derrotas !== b.derrotas) return a.derrotas - b.derrotas;
      return nomeJogador(a.jogador).localeCompare(nomeJogador(b.jogador));
    });
}

function medalha(posicao: number) {
  if (posicao === 1) return "🥇";
  if (posicao === 2) return "🥈";
  if (posicao === 3) return "🥉";
  return `${posicao}`;
}

function classePosicao(posicao: number) {
  if (posicao === 1) return "bg-[#E6AA00] text-[#071A4A]";
  if (posicao === 2) return "bg-slate-200 text-slate-700";
  if (posicao === 3) return "bg-[#5A3924] text-white";
  return "bg-white text-[#071A4A]";
}

function descricaoFiltro(filtro: FiltroRanking, rodadaSelecionada: Rodada | null) {
  if (filtro === "geral") return "Todas as partidas encerradas";
  if (filtro === "ano") return "Partidas encerradas no ano atual";
  if (filtro === "mes") return "Partidas encerradas no mês atual";
  if (filtro === "semana") return "Partidas encerradas na semana atual";

  if (rodadaSelecionada) {
    return `Rodada de ${formatarData(rodadaSelecionada.data)}${
      rodadaSelecionada.local ? ` — ${rodadaSelecionada.local}` : ""
    }`;
  }

  return "Todas as rodadas";
}

export default function RankingPage() {
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
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

    const [jogadoresResult, rodadasResult, partidasResult] = await Promise.all([
      supabase
        .from("jogadores")
        .select("*")
        .eq("ativo", true)
        .order("nome", { ascending: true }),

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

    setJogadores((jogadoresResult.data ?? []) as Jogador[]);
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

  const ranking = useMemo(() => {
    return calcularRanking(jogadores, partidas, filtro, rodadaIdSelecionada);
  }, [jogadores, partidas, filtro, rodadaIdSelecionada]);

  const rankingComJogos = useMemo(() => {
    return ranking.filter((item) => item.jogos > 0);
  }, [ranking]);

  const rankingFiltrado = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    const base = rankingComJogos;

    if (!termo) return base;

    return base.filter((item) => {
      return (
        item.jogador.nome.toLowerCase().includes(termo) ||
        item.jogador.apelido?.toLowerCase().includes(termo) ||
        item.jogador.whatsapp?.toLowerCase().includes(termo)
      );
    });
  }, [rankingComJogos, busca]);

  const partidasConsideradas = useMemo(() => {
    return partidas.filter((partida) =>
      partidaDentroDoPeriodo(partida, filtro, rodadaIdSelecionada)
    );
  }, [partidas, filtro, rodadaIdSelecionada]);

  const lider = rankingComJogos[0] ?? null;

  const lanterna =
    rankingComJogos
      .filter((item) => item.jogos > 0)
      .sort((a, b) => {
        if (b.derrotas !== a.derrotas) return b.derrotas - a.derrotas;
        if (a.aproveitamento !== b.aproveitamento) {
          return a.aproveitamento - b.aproveitamento;
        }
        return nomeJogador(a.jogador).localeCompare(nomeJogador(b.jogador));
      })[0] ?? null;

  const melhorAproveitamento =
    rankingComJogos
      .filter((item) => item.jogos >= 3)
      .sort((a, b) => {
        if (b.aproveitamento !== a.aproveitamento) {
          return b.aproveitamento - a.aproveitamento;
        }

        if (b.vitorias !== a.vitorias) {
          return b.vitorias - a.vitorias;
        }

        return nomeJogador(a.jogador).localeCompare(nomeJogador(b.jogador));
      })[0] ?? null;

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

          <Link
            href="/ranking/parcerias"
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#071A4A]/10 bg-white px-4 py-2 text-sm font-black text-[#071A4A] transition active:scale-[0.99] sm:hover:border-[#E6AA00]/60"
          >
            <BarChart3 size={18} />
            Parcerias
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
            <Trophy size={15} />
            Ranking
          </div>

          <h1 className="text-3xl font-black tracking-tight text-[#071A4A] sm:text-5xl">
            Ranking individual
          </h1>

          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-700 sm:text-base">
            Vitórias, derrotas, jogos e aproveitamento dos jogadores.
          </p>
        </div>
      </header>

      {erro && (
        <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-50 p-4 text-sm font-bold text-red-700">
          <XCircle size={18} className="mt-0.5 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      <section className="mb-5 rounded-[1.5rem] border border-[#071A4A]/10 bg-white/95 p-4 shadow-xl shadow-[#071A4A]/5 sm:mb-8 sm:rounded-[1.75rem] sm:p-6">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E6AA00] text-[#071A4A]">
            <CalendarDays size={22} />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0B6B3A]">
              Filtro
            </p>
            <h2 className="text-2xl font-black text-[#071A4A]">
              {descricaoFiltro(filtro, rodadaSelecionada)}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {filtros.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setFiltro(item.id);

                if (item.id !== "rodada") {
                  setRodadaIdSelecionada("");
                }
              }}
              className={`touch-button min-h-12 rounded-2xl border px-3 py-3 text-sm font-black transition active:scale-[0.99] ${
                filtro === item.id
                  ? "border-[#0B6B3A] bg-[#0B6B3A] text-white shadow-lg shadow-[#0B6B3A]/20"
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
            placeholder="Buscar jogador"
            className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] py-3 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0B6B3A]"
          />
        </label>
      </section>

      <section className="mb-5 grid gap-4 sm:mb-8 lg:grid-cols-4">
        <div className="rounded-[1.5rem] border border-[#071A4A]/10 bg-white/95 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-slate-500">
            Partidas no filtro
          </p>
          <p className="mt-1 text-3xl font-black text-[#071A4A] sm:text-4xl">
            {partidasConsideradas.length}
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            Somente encerradas.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-[#E6AA00]/30 bg-[#FFF7D7] p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="flex items-center gap-2 text-sm font-black text-[#5A3924]">
            <Medal size={16} />
            Líder
          </p>
          <p className="mt-1 truncate text-2xl font-black text-[#071A4A]">
            {lider ? nomeJogador(lider.jogador) : "-"}
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#5A3924]">
            {lider ? `${lider.vitorias} vitória(s)` : "Sem jogos."}
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-green-600/20 bg-green-50 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-green-700">
            Melhor aproveit.
          </p>
          <p className="mt-1 truncate text-2xl font-black text-green-800">
            {melhorAproveitamento
              ? nomeJogador(melhorAproveitamento.jogador)
              : "-"}
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-green-700/80">
            {melhorAproveitamento
              ? `${melhorAproveitamento.aproveitamento}% com ${melhorAproveitamento.jogos} jogo(s)`
              : "Mínimo de 3 jogos."}
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-red-500/10 bg-red-50 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-red-600">Lanterna</p>
          <p className="mt-1 truncate text-2xl font-black text-red-700">
            {lanterna ? nomeJogador(lanterna.jogador) : "-"}
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-red-700/80">
            {lanterna ? `${lanterna.derrotas} derrota(s)` : "Sem zoeira ainda."}
          </p>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-[#071A4A]/10 bg-white/95 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0B6B3A] text-white">
            <Users size={22} />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0B6B3A]">
              Classificação
            </p>
            <h2 className="text-2xl font-black text-[#071A4A]">
              Ranking dos jogadores
            </h2>
          </div>
        </div>

        {carregando ? (
          <div className="flex min-h-32 items-center justify-center rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] p-5 text-sm font-bold text-slate-500">
            <Loader2 size={18} className="mr-2 animate-spin" />
            Carregando ranking...
          </div>
        ) : rankingFiltrado.length === 0 ? (
          <div className="rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] p-5 text-sm font-bold text-slate-500">
            Nenhum jogador com partida encerrada neste filtro.
          </div>
        ) : (
          <div className="grid gap-3">
            {rankingFiltrado.map((item, index) => {
              const posicao = index + 1;

              return (
                <article
                  key={item.jogador.id}
                  className={`rounded-2xl border p-4 ${
                    posicao === 1
                      ? "border-[#E6AA00]/50 bg-[#FFF7D7]"
                      : "border-[#071A4A]/10 bg-[#FAF8F1]"
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-black ${classePosicao(
                          posicao
                        )}`}
                      >
                        {medalha(posicao)}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-xl font-black text-[#071A4A]">
                          {nomeJogador(item.jogador)}
                        </h3>

                        {item.jogador.apelido && (
                          <p className="truncate text-sm font-semibold text-slate-600">
                            {item.jogador.nome}
                          </p>
                        )}
                      </div>
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
            className="flex flex-col items-center justify-center rounded-2xl bg-[#FAF8F1] px-2 py-2 text-[#071A4A]"
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