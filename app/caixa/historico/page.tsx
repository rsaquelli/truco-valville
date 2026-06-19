"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Loader2,
  ReceiptText,
  RefreshCw,
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
    <main className="app-shell safe-bottom mx-auto flex w-full max-w-6xl flex-col px-4 pb-28 pt-5 sm:px-6 sm:pb-8 lg:px-8">
      <header className="mb-5 rounded-[1.5rem] border border-[#071A4A]/10 bg-white/90 p-4 shadow-xl shadow-[#071A4A]/5 sm:mb-8 sm:rounded-[2rem] sm:p-6">
        <div className="mb-4 flex flex-wrap gap-2">
          <Link
            href="/caixa"
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] px-4 py-2 text-sm font-black text-[#071A4A] transition active:scale-[0.99]"
          >
            <ArrowLeft size={18} />
            Caixa
          </Link>

          <Link
            href="/caixa/despesas"
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#071A4A]/10 bg-white px-4 py-2 text-sm font-black text-[#071A4A] transition active:scale-[0.99]"
          >
            <ReceiptText size={18} />
            Despesas
          </Link>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#E6AA00]/35 bg-[#E6AA00]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#5A3924] sm:text-xs">
              <Wallet size={15} />
              Histórico
            </div>

            <h1 className="text-3xl font-black tracking-tight text-[#071A4A] sm:text-5xl">
              Histórico do Caixa
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700 sm:text-base">
              Visão mensal consolidada de mensalidades, despesas e saldo do
              caixa.
            </p>
          </div>

          <button
            type="button"
            onClick={carregarDados}
            className="touch-button inline-flex items-center justify-center gap-2 rounded-2xl border border-[#071A4A]/15 bg-white px-5 py-3 text-sm font-black text-[#071A4A] shadow-lg shadow-[#071A4A]/5 transition active:scale-[0.99]"
          >
            <RefreshCw size={18} />
            Atualizar
          </button>
        </div>
      </header>

      {erro && (
        <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-50 p-4 text-sm font-bold text-red-700">
          <XCircle size={18} className="mt-0.5 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      <section className="mb-5 rounded-[1.5rem] border border-[#071A4A]/10 bg-white/90 p-4 shadow-xl shadow-[#071A4A]/5 sm:mb-8 sm:rounded-[1.75rem] sm:p-6">
        <label className="mb-2 block text-sm font-black text-[#071A4A]">
          Ano
        </label>
        <input
          value={anoSelecionado}
          onChange={(event) => {
            setAnoSelecionado(Number(event.target.value));
            setMesAberto(null);
          }}
          inputMode="numeric"
          className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#0B6B3A]"
        />
      </section>

      <section className="mb-5 grid gap-4 sm:mb-8 lg:grid-cols-4">
        <div className="rounded-[1.5rem] border border-green-600/20 bg-green-50 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-green-700">Recebido no ano</p>
          <p className="mt-1 text-3xl font-black text-green-800">
            {formatarValor(resumoAno.recebido)}
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-red-500/10 bg-red-50 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-red-600">Despesas no ano</p>
          <p className="mt-1 text-3xl font-black text-red-700">
            {formatarValor(resumoAno.despesas)}
          </p>
        </div>

        <div
          className={`rounded-[1.5rem] border p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5 ${
            resumoAno.saldo >= 0
              ? "border-[#E6AA00]/30 bg-[#FFF7D7]"
              : "border-red-500/20 bg-red-50"
          }`}
        >
          <p
            className={`text-sm font-black ${
              resumoAno.saldo >= 0 ? "text-[#5A3924]" : "text-red-600"
            }`}
          >
            Saldo do ano
          </p>
          <p
            className={`mt-1 text-3xl font-black ${
              resumoAno.saldo >= 0 ? "text-[#071A4A]" : "text-red-700"
            }`}
          >
            {formatarValor(resumoAno.saldo)}
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-red-500/10 bg-red-50 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-red-600">Pendente no ano</p>
          <p className="mt-1 text-3xl font-black text-red-700">
            {formatarValor(resumoAno.pendente)}
          </p>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-[#071A4A]/10 bg-white/90 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E6AA00] text-[#071A4A]">
            <CalendarDays size={22} />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0B6B3A]">
              Mês a mês
            </p>
            <h2 className="text-2xl font-black text-[#071A4A]">
              Resumo mensal
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
            {resumoPorMes.map((mes) => {
              const aberto = mesAberto === mes.chave;
              const temMovimento =
                mes.mensalidades.length > 0 || mes.despesasLista.length > 0;

              return (
                <article
                  key={mes.chave}
                  className={`rounded-2xl border p-4 ${
                    temMovimento
                      ? "border-[#071A4A]/10 bg-[#FAF8F1]"
                      : "border-slate-200 bg-slate-50 opacity-80"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setMesAberto(aberto ? null : mes.chave)}
                    className="flex w-full items-center justify-between gap-3 text-left"
                  >
                    <div>
                      <h3 className="text-xl font-black text-[#071A4A]">
                        {nomeMes(mes.mes)} / {mes.ano}
                      </h3>
                      <p className="mt-1 text-sm font-semibold text-slate-600">
                        Recebido {formatarValor(mes.recebido)} · Despesas{" "}
                        {formatarValor(mes.despesas)} · Saldo{" "}
                        {formatarValor(mes.saldo)}
                      </p>
                    </div>

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#071A4A]">
                      {aberto ? (
                        <ChevronDown size={22} />
                      ) : (
                        <ChevronRight size={22} />
                      )}
                    </div>
                  </button>

                  {aberto && (
                    <div className="mt-4 grid gap-4">
                      <div className="grid gap-3 sm:grid-cols-4">
                        <div className="rounded-2xl bg-white p-3">
                          <p className="text-xs font-black text-slate-500">
                            Recebido
                          </p>
                          <p className="text-xl font-black text-green-700">
                            {formatarValor(mes.recebido)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white p-3">
                          <p className="text-xs font-black text-slate-500">
                            Pendente
                          </p>
                          <p className="text-xl font-black text-red-700">
                            {formatarValor(mes.pendente)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white p-3">
                          <p className="text-xs font-black text-slate-500">
                            Despesas
                          </p>
                          <p className="text-xl font-black text-red-700">
                            {formatarValor(mes.despesas)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white p-3">
                          <p className="text-xs font-black text-slate-500">
                            Saldo
                          </p>
                          <p
                            className={`text-xl font-black ${
                              mes.saldo >= 0 ? "text-[#071A4A]" : "text-red-700"
                            }`}
                          >
                            {formatarValor(mes.saldo)}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white p-4">
                        <p className="mb-3 text-sm font-black text-[#071A4A]">
                          Mensalidades
                        </p>

                        {mes.mensalidades.length === 0 ? (
                          <p className="text-sm font-semibold text-slate-500">
                            Nenhuma mensalidade gerada neste mês.
                          </p>
                        ) : (
                          <div className="grid gap-2">
                            {mes.mensalidades.map((mensalidade) => (
                              <div
                                key={mensalidade.id}
                                className="flex items-center justify-between gap-3 rounded-xl bg-[#FAF8F1] px-3 py-2 text-sm font-bold"
                              >
                                <span className="text-[#071A4A]">
                                  {nomeJogador(mensalidade.jogador)}
                                </span>
                                <span className="text-slate-600">
                                  {mensalidade.status} ·{" "}
                                  {formatarValor(mensalidade.valor)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="rounded-2xl bg-white p-4">
                        <p className="mb-3 text-sm font-black text-[#071A4A]">
                          Despesas
                        </p>

                        {mes.despesasLista.length === 0 ? (
                          <p className="text-sm font-semibold text-slate-500">
                            Nenhuma despesa registrada neste mês.
                          </p>
                        ) : (
                          <div className="grid gap-2">
                            {mes.despesasLista.map((despesa) => (
                              <div
                                key={despesa.id}
                                className="rounded-xl bg-[#FAF8F1] px-3 py-2"
                              >
                                <div className="flex items-center justify-between gap-3 text-sm font-bold">
                                  <span className="text-[#071A4A]">
                                    {despesa.descricao}
                                  </span>
                                  <span className="text-red-700">
                                    {formatarValor(despesa.valor)}
                                  </span>
                                </div>

                                <p className="mt-1 text-xs font-semibold text-slate-500">
                                  {formatarData(despesa.data_despesa)}
                                  {despesa.jogador_responsavel
                                    ? ` · Responsável: ${nomeResponsavel(
                                        despesa.jogador_responsavel
                                      )}`
                                    : ""}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}