"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Home,
  Loader2,
  PlayCircle,
  ReceiptText,
  RefreshCw,
  Trophy,
  Wallet,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type {
  DespesaCaixaComJogador,
  MensalidadeComJogador,
} from "@/types/truco";

type MesResumo = {
  chave: string;
  mes: number;
  ano: number;
  recebido: number;
  pendente: number;
  isento: number;
  despesas: number;
  saldo: number;
  mensalidades: MensalidadeComJogador[];
  despesasLista: DespesaCaixaComJogador[];
};

const meses = [
  { valor: 1, nome: "Janeiro" },
  { valor: 2, nome: "Fevereiro" },
  { valor: 3, nome: "Março" },
  { valor: 4, nome: "Abril" },
  { valor: 5, nome: "Maio" },
  { valor: 6, nome: "Junho" },
  { valor: 7, nome: "Julho" },
  { valor: 8, nome: "Agosto" },
  { valor: 9, nome: "Setembro" },
  { valor: 10, nome: "Outubro" },
  { valor: 11, nome: "Novembro" },
  { valor: 12, nome: "Dezembro" },
];

function anoAtual() {
  return new Date().getFullYear();
}

function nomeMes(numeroMes: number) {
  return meses.find((mes) => mes.valor === numeroMes)?.nome || String(numeroMes);
}

function formatarValor(valor: number | string | null | undefined) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data: string | null | undefined) {
  if (!data) return "-";

  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function nomeJogador(jogador: MensalidadeComJogador["jogador"]) {
  if (!jogador) return "-";
  return jogador.apelido || jogador.nome;
}

function nomeResponsavel(jogador: DespesaCaixaComJogador["jogador_responsavel"]) {
  if (!jogador) return "-";
  return jogador.apelido || jogador.nome;
}

function obterMesDespesa(data: string) {
  const [, mes] = data.split("-").map(Number);
  return mes;
}

function obterAnoDespesa(data: string) {
  const [ano] = data.split("-").map(Number);
  return ano;
}

function labelStatus(status: string) {
  if (status === "pago") return "Pago";
  if (status === "pendente") return "Pendente";
  if (status === "isento") return "Isento";
  return status;
}

function classeStatus(status: string) {
  if (status === "pago") return "bg-green-100 text-green-700";
  if (status === "pendente") return "bg-red-100 text-red-700";
  if (status === "isento") return "bg-slate-200 text-slate-700";
  return "bg-slate-100 text-slate-600";
}

function labelCategoria(categoria: string | null | undefined) {
  if (!categoria) return "Outros";

  const labels: Record<string, string> = {
    churrasco: "Churrasco",
    cerveja: "Cerveja",
    gelo: "Gelo",
    carvao: "Carvão",
    descartaveis: "Descartáveis",
    trofeu: "Troféu",
    outros: "Outros",
  };

  return labels[categoria] || categoria;
}

export default function HistoricoCaixaPage() {
  const [mensalidades, setMensalidades] = useState<MensalidadeComJogador[]>([]);
  const [despesas, setDespesas] = useState<DespesaCaixaComJogador[]>([]);
  const [anoSelecionado, setAnoSelecionado] = useState(anoAtual());
  const [mesAberto, setMesAberto] = useState<string | null>(null);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  async function carregarDados() {
    setCarregando(true);
    setErro(null);

    const [mensalidadesResult, despesasResult] = await Promise.all([
      supabase
        .from("mensalidades_jogadores")
        .select(
          `
          *,
          jogador:jogadores (*)
        `
        )
        .eq("competencia_ano", anoSelecionado)
        .order("competencia_mes", { ascending: false }),

      supabase
        .from("despesas_caixa")
        .select(
          `
          *,
          jogador_responsavel:jogadores (*)
        `
        )
        .gte("data_despesa", `${anoSelecionado}-01-01`)
        .lte("data_despesa", `${anoSelecionado}-12-31`)
        .order("data_despesa", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);

    if (mensalidadesResult.error) {
      setErro(mensalidadesResult.error.message);
      setCarregando(false);
      return;
    }

    if (despesasResult.error) {
      setErro(despesasResult.error.message);
      setCarregando(false);
      return;
    }

    setMensalidades(
      (mensalidadesResult.data ?? []) as MensalidadeComJogador[]
    );
    setDespesas((despesasResult.data ?? []) as DespesaCaixaComJogador[]);
    setCarregando(false);
  }

  useEffect(() => {
    carregarDados();
  }, [anoSelecionado]);

  const anosDisponiveis = useMemo(() => {
    const base = anoAtual();
    return [base + 1, base, base - 1, base - 2, base - 3];
  }, []);

  const resumoPorMes = useMemo(() => {
    const mapa = new Map<string, MesResumo>();

    meses.forEach((mes) => {
      const chave = `${anoSelecionado}-${String(mes.valor).padStart(2, "0")}`;

      mapa.set(chave, {
        chave,
        mes: mes.valor,
        ano: anoSelecionado,
        recebido: 0,
        pendente: 0,
        isento: 0,
        despesas: 0,
        saldo: 0,
        mensalidades: [],
        despesasLista: [],
      });
    });

    mensalidades.forEach((mensalidade) => {
      const chave = `${mensalidade.competencia_ano}-${String(
        mensalidade.competencia_mes
      ).padStart(2, "0")}`;

      const registro = mapa.get(chave);

      if (!registro) return;

      registro.mensalidades.push(mensalidade);

      if (mensalidade.status === "pago") {
        registro.recebido += Number(mensalidade.valor || 0);
      }

      if (mensalidade.status === "pendente") {
        registro.pendente += Number(mensalidade.valor || 0);
      }

      if (mensalidade.status === "isento") {
        registro.isento += Number(mensalidade.valor || 0);
      }
    });

    despesas.forEach((despesa) => {
      const ano = obterAnoDespesa(despesa.data_despesa);
      const mes = obterMesDespesa(despesa.data_despesa);
      const chave = `${ano}-${String(mes).padStart(2, "0")}`;

      const registro = mapa.get(chave);

      if (!registro) return;

      registro.despesas += Number(despesa.valor || 0);
      registro.despesasLista.push(despesa);
    });

    const lista = Array.from(mapa.values()).map((item) => ({
      ...item,
      saldo: item.recebido - item.despesas,
    }));

    return lista.sort((a, b) => b.mes - a.mes);
  }, [mensalidades, despesas, anoSelecionado]);

  const resumoAno = useMemo(() => {
    const recebido = resumoPorMes.reduce((soma, item) => soma + item.recebido, 0);
    const pendente = resumoPorMes.reduce((soma, item) => soma + item.pendente, 0);
    const isento = resumoPorMes.reduce((soma, item) => soma + item.isento, 0);
    const despesasTotal = resumoPorMes.reduce(
      (soma, item) => soma + item.despesas,
      0
    );

    return {
      recebido,
      pendente,
      isento,
      despesas: despesasTotal,
      saldo: recebido - despesasTotal,
    };
  }, [resumoPorMes]);

  return (
    <main className="app-shell safe-bottom mx-auto flex w-full max-w-6xl flex-col px-4 pb-64 pt-5 md:pb-8 sm:px-6 lg:px-8">
      <header className="mb-5 rounded-[1.5rem] border border-[#071A4A]/10 bg-white/95 p-4 shadow-xl shadow-[#071A4A]/5 sm:mb-8 sm:rounded-[2rem] sm:p-6">
        <div className="mb-4 flex flex-wrap gap-2">
          <Link
            href="/caixa"
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] px-4 py-2 text-sm font-black text-[#071A4A] transition active:scale-[0.99] sm:hover:border-[#E6AA00]/60"
          >
            <ArrowLeft size={18} />
            Caixa
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

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#E6AA00]/35 bg-[#E6AA00]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#5A3924] sm:text-xs">
              <ReceiptText size={15} />
              Histórico
            </div>

            <h1 className="text-3xl font-black tracking-tight text-[#071A4A] sm:text-5xl">
              Histórico do caixa
            </h1>

            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-700 sm:text-base">
              Resumo mensal de mensalidades, despesas e saldo do grupo.
            </p>
          </div>

          <div className="w-full sm:w-48">
            <label className="mb-2 block text-sm font-black text-[#071A4A]">
              Ano
            </label>
            <select
              value={anoSelecionado}
              onChange={(event) => {
                setAnoSelecionado(Number(event.target.value));
                setMesAberto(null);
              }}
              className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#0B6B3A]"
            >
              {anosDisponiveis.map((ano) => (
                <option key={ano} value={ano}>
                  {ano}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {erro && (
        <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-50 p-4 text-sm font-bold text-red-700">
          <XCircle size={18} className="mt-0.5 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      <section className="mb-5 grid gap-4 sm:mb-8 lg:grid-cols-4">
        <div className="rounded-[1.5rem] border border-green-600/20 bg-green-50 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-green-700">Recebido</p>
          <p className="mt-1 text-3xl font-black text-green-800">
            {formatarValor(resumoAno.recebido)}
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-red-500/10 bg-red-50 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-red-600">Despesas</p>
          <p className="mt-1 text-3xl font-black text-red-700">
            {formatarValor(resumoAno.despesas)}
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-[#E6AA00]/30 bg-[#FFF7D7] p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-[#5A3924]">Saldo</p>
          <p className="mt-1 text-3xl font-black text-[#071A4A]">
            {formatarValor(resumoAno.saldo)}
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-[#071A4A]/10 bg-white/95 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-slate-500">Pendente</p>
          <p className="mt-1 text-3xl font-black text-[#071A4A]">
            {formatarValor(resumoAno.pendente)}
          </p>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-[#071A4A]/10 bg-white/95 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0B6B3A] text-white">
            <CalendarDays size={22} />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0B6B3A]">
              Mensal
            </p>
            <h2 className="text-2xl font-black text-[#071A4A]">
              Resumo por mês
            </h2>
          </div>
        </div>

        {carregando ? (
          <div className="flex min-h-32 items-center justify-center rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] p-5 text-sm font-bold text-slate-500">
            <Loader2 size={18} className="mr-2 animate-spin" />
            Carregando histórico...
          </div>
        ) : (
          <div className="grid gap-3">
            {resumoPorMes.map((item) => {
              const aberto = mesAberto === item.chave;
              const temMovimento =
                item.recebido > 0 ||
                item.pendente > 0 ||
                item.isento > 0 ||
                item.despesas > 0 ||
                item.mensalidades.length > 0 ||
                item.despesasLista.length > 0;

              return (
                <article
                  key={item.chave}
                  className={`overflow-hidden rounded-2xl border ${
                    temMovimento
                      ? "border-[#071A4A]/10 bg-[#FAF8F1]"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setMesAberto(aberto ? null : item.chave)}
                    className="flex w-full items-start justify-between gap-3 p-4 text-left transition active:scale-[0.99]"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-black text-[#071A4A]">
                          {nomeMes(item.mes)}
                        </h3>

                        {!temMovimento && (
                          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-black uppercase text-slate-600">
                            Sem movimento
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-sm font-semibold text-slate-600">
                        Recebido {formatarValor(item.recebido)} · Despesas {formatarValor(item.despesas)}
                      </p>
                    </div>

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#071A4A]">
                      {aberto ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                    </div>
                  </button>

                  <div className="grid grid-cols-2 gap-2 px-4 pb-4 sm:grid-cols-4">
                    <div className="rounded-2xl bg-white p-3 text-center">
                      <p className="text-xs font-black text-slate-500">Recebido</p>
                      <p className="mt-1 text-sm font-black text-green-700 sm:text-base">
                        {formatarValor(item.recebido)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-3 text-center">
                      <p className="text-xs font-black text-slate-500">Despesas</p>
                      <p className="mt-1 text-sm font-black text-red-700 sm:text-base">
                        {formatarValor(item.despesas)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-3 text-center">
                      <p className="text-xs font-black text-slate-500">Saldo</p>
                      <p className="mt-1 text-sm font-black text-[#071A4A] sm:text-base">
                        {formatarValor(item.saldo)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-3 text-center">
                      <p className="text-xs font-black text-slate-500">Pendente</p>
                      <p className="mt-1 text-sm font-black text-[#5A3924] sm:text-base">
                        {formatarValor(item.pendente)}
                      </p>
                    </div>
                  </div>

                  {aberto && (
                    <div className="border-t border-[#071A4A]/10 p-4">
                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="rounded-2xl bg-white p-4">
                          <h4 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-[#0B6B3A]">
                            Mensalidades
                          </h4>

                          {item.mensalidades.length === 0 ? (
                            <p className="rounded-2xl bg-[#FAF8F1] p-4 text-sm font-bold text-slate-500">
                              Nenhuma mensalidade neste mês.
                            </p>
                          ) : (
                            <div className="grid gap-2">
                              {item.mensalidades.map((mensalidade) => (
                                <div
                                  key={mensalidade.id}
                                  className="rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] p-3"
                                >
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0">
                                      <p className="truncate text-base font-black text-[#071A4A]">
                                        {nomeJogador(mensalidade.jogador)}
                                      </p>
                                      <p className="mt-1 text-sm font-semibold text-slate-600">
                                        {formatarValor(mensalidade.valor)}
                                      </p>
                                    </div>

                                    <span
                                      className={`w-fit rounded-full px-3 py-1 text-xs font-black uppercase ${classeStatus(
                                        mensalidade.status
                                      )}`}
                                    >
                                      {labelStatus(mensalidade.status)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="rounded-2xl bg-white p-4">
                          <h4 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-red-600">
                            Despesas
                          </h4>

                          {item.despesasLista.length === 0 ? (
                            <p className="rounded-2xl bg-[#FAF8F1] p-4 text-sm font-bold text-slate-500">
                              Nenhuma despesa neste mês.
                            </p>
                          ) : (
                            <div className="grid gap-2">
                              {item.despesasLista.map((despesa) => (
                                <div
                                  key={despesa.id}
                                  className="rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] p-3"
                                >
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                      <p className="break-words text-base font-black text-[#071A4A]">
                                        {despesa.descricao}
                                      </p>
                                      <p className="mt-1 text-sm font-semibold text-slate-600">
                                        {formatarData(despesa.data_despesa)} · {labelCategoria(despesa.categoria)}
                                      </p>
                                      <p className="mt-1 text-sm font-semibold text-slate-600">
                                        Responsável: {nomeResponsavel(despesa.jogador_responsavel)}
                                      </p>
                                    </div>

                                    <p className="shrink-0 text-lg font-black text-red-700">
                                      {formatarValor(despesa.valor)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
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
            className="flex flex-col items-center justify-center rounded-2xl bg-[#FAF8F1] px-2 py-2 text-[#071A4A]"
          >
            <Wallet size={20} />
            <span className="mt-1 text-[10px] font-black">Caixa</span>
          </Link>
        </div>
      </nav>
    </main>
  );
}
