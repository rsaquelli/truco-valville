"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Loader2,
  MessageCircle,
  ReceiptText,
  RefreshCw,
  Save,
  Search,
  Users,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type {
  ConfiguracaoGrupo,
  DespesaCaixaComJogador,
  Jogador,
  MensalidadeComJogador,
  StatusMensalidade,
} from "@/types/truco";

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

function mesAtual() {
  return new Date().getMonth() + 1;
}

function anoAtual() {
  return new Date().getFullYear();
}

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

function nomeJogador(jogador: Jogador | null) {
  if (!jogador) return "-";
  return jogador.apelido || jogador.nome;
}

function somenteNumeros(valor: string | null) {
  if (!valor) return "";
  return valor.replace(/\D/g, "");
}

function formatarValor(valor: number | string | null | undefined) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function nomeMes(numeroMes: number) {
  return meses.find((mes) => mes.valor === numeroMes)?.nome || String(numeroMes);
}

function montarTextoCobranca(
  mensalidade: MensalidadeComJogador,
  configuracao: ConfiguracaoGrupo | null
) {
  const nome = nomeJogador(mensalidade.jogador);
  const valor = formatarValor(mensalidade.valor);
  const mes = nomeMes(mensalidade.competencia_mes);
  const ano = mensalidade.competencia_ano;
  const vencimento = configuracao?.dia_vencimento || 10;
  const nomeGrupo = configuracao?.nome_grupo || "Truco no Valville";

  return `Fala, ${nome}! Tudo bem?

Passando para lembrar da mensalidade do ${nomeGrupo}.

Competência: ${mes}/${ano}
Valor: ${valor}
Vencimento: dia ${vencimento}

Quem puder já mandar, ajuda no caixa do churrasco, cerveja e resenha. 🍻🃏`;
}

function montarLinkWhatsApp(
  mensalidade: MensalidadeComJogador,
  configuracao: ConfiguracaoGrupo | null
) {
  const telefone = somenteNumeros(mensalidade.jogador?.whatsapp || null);

  if (!telefone) return null;

  return `https://wa.me/55${telefone}?text=${encodeURIComponent(
    montarTextoCobranca(mensalidade, configuracao)
  )}`;
}

function classeStatus(status: StatusMensalidade) {
  if (status === "pago") {
    return "border-green-600/20 bg-green-50 text-green-700";
  }

  if (status === "isento") {
    return "border-slate-300 bg-slate-100 text-slate-700";
  }

  return "border-red-500/20 bg-red-50 text-red-700";
}

export default function CaixaPage() {
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [configuracao, setConfiguracao] = useState<ConfiguracaoGrupo | null>(
    null
  );
  const [mensalidades, setMensalidades] = useState<MensalidadeComJogador[]>([]);
  const [despesas, setDespesas] = useState<DespesaCaixaComJogador[]>([]);

  const [competenciaMes, setCompetenciaMes] = useState(mesAtual());
  const [competenciaAno, setCompetenciaAno] = useState(anoAtual());
  const [busca, setBusca] = useState("");
  const [mostrarMensalidades, setMostrarMensalidades] = useState(true);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  async function carregarDados() {
    setCarregando(true);
    setErro(null);

    const [configResult, jogadoresResult, mensalidadesResult, despesasResult] =
      await Promise.all([
        supabase
          .from("configuracoes_grupo")
          .select("*")
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle(),

        supabase
          .from("jogadores")
          .select("*")
          .eq("ativo", true)
          .order("nome", { ascending: true }),

        supabase
          .from("mensalidades_jogadores")
          .select(
            `
            *,
            jogador:jogadores (*)
          `
          )
          .eq("competencia_mes", competenciaMes)
          .eq("competencia_ano", competenciaAno)
          .order("status", { ascending: false })
          .order("created_at", { ascending: true }),

        supabase
          .from("despesas_caixa")
          .select(
            `
            *,
            jogador_responsavel:jogadores (*)
          `
          )
          .order("data_despesa", { ascending: false })
          .order("created_at", { ascending: false }),
      ]);

    if (configResult.error) {
      setErro(configResult.error.message);
      setCarregando(false);
      return;
    }

    if (jogadoresResult.error) {
      setErro(jogadoresResult.error.message);
      setCarregando(false);
      return;
    }

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

    setConfiguracao((configResult.data ?? null) as ConfiguracaoGrupo | null);
    setJogadores((jogadoresResult.data ?? []) as Jogador[]);
    setMensalidades(
      (mensalidadesResult.data ?? []) as MensalidadeComJogador[]
    );
    setDespesas((despesasResult.data ?? []) as DespesaCaixaComJogador[]);

    setCarregando(false);
  }

  useEffect(() => {
    carregarDados();
  }, [competenciaMes, competenciaAno]);

  const valorMensalidade = Number(configuracao?.valor_mensalidade || 100);

  const resumo = useMemo(() => {
    const totalRegistros = mensalidades.length;

    const totalEsperado = mensalidades
      .filter((item) => item.status !== "isento")
      .reduce((soma, item) => soma + Number(item.valor || 0), 0);

    const totalRecebido = mensalidades
      .filter((item) => item.status === "pago")
      .reduce((soma, item) => soma + Number(item.valor || 0), 0);

    const totalPendente = mensalidades
      .filter((item) => item.status === "pendente")
      .reduce((soma, item) => soma + Number(item.valor || 0), 0);

    const totalDespesas = despesas.reduce(
      (soma, despesa) => soma + Number(despesa.valor || 0),
      0
    );

    const saldoCaixa = totalRecebido - totalDespesas;

    const pendentes = mensalidades.filter((item) => item.status === "pendente");
    const pagos = mensalidades.filter((item) => item.status === "pago");
    const isentos = mensalidades.filter((item) => item.status === "isento");

    return {
      totalRegistros,
      totalEsperado,
      totalRecebido,
      totalPendente,
      totalDespesas,
      saldoCaixa,
      pendentes,
      pagos,
      isentos,
    };
  }, [mensalidades, despesas]);

  const mensalidadesFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    const lista = [...mensalidades].sort((a, b) => {
      if (a.status !== b.status) {
        const ordem: Record<StatusMensalidade, number> = {
          pendente: 1,
          pago: 2,
          isento: 3,
        };

        return ordem[a.status] - ordem[b.status];
      }

      return nomeJogador(a.jogador).localeCompare(nomeJogador(b.jogador));
    });

    if (!termo) return lista;

    return lista.filter((item) => {
      return (
        item.jogador?.nome.toLowerCase().includes(termo) ||
        item.jogador?.apelido?.toLowerCase().includes(termo) ||
        item.jogador?.whatsapp?.toLowerCase().includes(termo) ||
        item.status.toLowerCase().includes(termo)
      );
    });
  }, [mensalidades, busca]);

  async function gerarMensalidades() {
    setErro(null);
    setSucesso(null);

    if (jogadores.length === 0) {
      setErro("Nenhum jogador ativo encontrado.");
      return;
    }

    const jogadoresComMensalidade = new Set(
      mensalidades.map((mensalidade) => mensalidade.jogador_id)
    );

    const novasMensalidades = jogadores
      .filter((jogador) => !jogadoresComMensalidade.has(jogador.id))
      .map((jogador) => ({
        jogador_id: jogador.id,
        competencia_mes: competenciaMes,
        competencia_ano: competenciaAno,
        valor: valorMensalidade,
        status: "pendente" as StatusMensalidade,
      }));

    if (novasMensalidades.length === 0) {
      setSucesso("Todas as mensalidades desta competência já foram geradas.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase
      .from("mensalidades_jogadores")
      .insert(novasMensalidades);

    if (error) {
      setErro(error.message);
      setSalvando(false);
      return;
    }

    setSucesso(`${novasMensalidades.length} mensalidade(s) gerada(s).`);
    setSalvando(false);
    await carregarDados();
  }

  async function atualizarStatus(
    mensalidade: MensalidadeComJogador,
    status: StatusMensalidade,
    formaPagamento?: string
  ) {
    setErro(null);
    setSucesso(null);
    setSalvando(true);

    const payload =
      status === "pago"
        ? {
            status,
            data_pagamento: hojeISO(),
            forma_pagamento: formaPagamento || "Pix",
            updated_at: new Date().toISOString(),
          }
        : {
            status,
            data_pagamento: null,
            forma_pagamento: null,
            updated_at: new Date().toISOString(),
          };

    const { error } = await supabase
      .from("mensalidades_jogadores")
      .update(payload)
      .eq("id", mensalidade.id);

    if (error) {
      setErro(error.message);
      setSalvando(false);
      return;
    }

    setSucesso(`Mensalidade de ${nomeJogador(mensalidade.jogador)} atualizada.`);
    setSalvando(false);
    await carregarDados();
  }

  async function alterarValor(mensalidade: MensalidadeComJogador, valor: string) {
    const valorNumerico = Number(valor.replace(",", "."));

    if (!valorNumerico || valorNumerico < 0) {
      setErro("Informe um valor válido.");
      return;
    }

    setErro(null);
    setSucesso(null);
    setSalvando(true);

    const { error } = await supabase
      .from("mensalidades_jogadores")
      .update({
        valor: valorNumerico,
        updated_at: new Date().toISOString(),
      })
      .eq("id", mensalidade.id);

    if (error) {
      setErro(error.message);
      setSalvando(false);
      return;
    }

    setSucesso(`Valor de ${nomeJogador(mensalidade.jogador)} atualizado.`);
    setSalvando(false);
    await carregarDados();
  }

  return (
    <main className="app-shell safe-bottom mx-auto flex w-full max-w-6xl flex-col px-4 pb-28 pt-5 sm:px-6 sm:pb-8 lg:px-8">
      <header className="mb-5 rounded-[1.5rem] border border-[#071A4A]/10 bg-white/90 p-4 shadow-xl shadow-[#071A4A]/5 sm:mb-8 sm:rounded-[2rem] sm:p-6">
        <div className="mb-4 flex flex-wrap gap-2">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] px-4 py-2 text-sm font-black text-[#071A4A] transition active:scale-[0.99] sm:hover:border-[#E6AA00]/60"
          >
            <ArrowLeft size={18} />
            Voltar
          </Link>

          <Link
            href="/caixa/despesas"
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#071A4A]/10 bg-white px-4 py-2 text-sm font-black text-[#071A4A] transition active:scale-[0.99] sm:hover:border-[#E6AA00]/60"
          >
            <ReceiptText size={18} />
            Despesas
          </Link>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#E6AA00]/35 bg-[#E6AA00]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#5A3924] sm:text-xs">
              <CircleDollarSign size={15} />
              Caixa
            </div>

            <h1 className="text-3xl font-black tracking-tight text-[#071A4A] sm:text-5xl">
              Caixa
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700 sm:text-base">
              Controle as mensalidades do grupo por competência, veja pendentes,
              recebidos, despesas e saldo atual do caixa.
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

      <section className="mb-5 rounded-[1.5rem] border border-[#071A4A]/10 bg-white/90 p-4 shadow-xl shadow-[#071A4A]/5 sm:mb-8 sm:rounded-[1.75rem] sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <div>
            <label className="mb-2 block text-sm font-black text-[#071A4A]">
              Mês
            </label>
            <select
              value={competenciaMes}
              onChange={(event) => {
                setCompetenciaMes(Number(event.target.value));
                setMostrarMensalidades(true);
              }}
              className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#0B6B3A]"
            >
              {meses.map((mes) => (
                <option key={mes.valor} value={mes.valor}>
                  {mes.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-[#071A4A]">
              Ano
            </label>
            <input
              value={competenciaAno}
              onChange={(event) => {
                setCompetenciaAno(Number(event.target.value));
                setMostrarMensalidades(true);
              }}
              inputMode="numeric"
              className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#0B6B3A]"
            />
          </div>

          <button
            type="button"
            onClick={gerarMensalidades}
            disabled={salvando || carregando}
            className="touch-button inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0B6B3A] px-5 py-4 text-sm font-black text-white shadow-lg shadow-[#0B6B3A]/20 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {salvando ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            Gerar mensalidades
          </button>
        </div>

        <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
          Valor padrão vindo das configurações:{" "}
          <strong className="text-[#071A4A]">
            {formatarValor(valorMensalidade)}
          </strong>
          .
        </p>
      </section>

      <section className="mb-5 grid gap-4 sm:mb-8 lg:grid-cols-4">
        <div className="rounded-[1.5rem] border border-green-600/20 bg-green-50 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-green-700">Recebido</p>
          <p className="mt-1 text-3xl font-black text-green-800">
            {formatarValor(resumo.totalRecebido)}
          </p>
          <p className="mt-2 text-sm text-green-700/80">
            {resumo.pagos.length} mensalidade(s) paga(s).
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-red-500/10 bg-red-50 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-red-600">Despesas</p>
          <p className="mt-1 text-3xl font-black text-red-700">
            {formatarValor(resumo.totalDespesas)}
          </p>
          <p className="mt-2 text-sm text-red-700/80">
            Saídas registradas no caixa.
          </p>
        </div>

        <div
          className={`rounded-[1.5rem] border p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5 ${
            resumo.saldoCaixa >= 0
              ? "border-[#E6AA00]/30 bg-[#FFF7D7]"
              : "border-red-500/20 bg-red-50"
          }`}
        >
          <p
            className={`text-sm font-black ${
              resumo.saldoCaixa >= 0 ? "text-[#5A3924]" : "text-red-600"
            }`}
          >
            Saldo do caixa
          </p>
          <p
            className={`mt-1 text-3xl font-black ${
              resumo.saldoCaixa >= 0 ? "text-[#071A4A]" : "text-red-700"
            }`}
          >
            {formatarValor(resumo.saldoCaixa)}
          </p>
          <p
            className={`mt-2 text-sm ${
              resumo.saldoCaixa >= 0 ? "text-[#5A3924]" : "text-red-700/80"
            }`}
          >
            Recebido menos despesas.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-red-500/10 bg-red-50 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-red-600">Pendente</p>
          <p className="mt-1 text-3xl font-black text-red-700">
            {formatarValor(resumo.totalPendente)}
          </p>
          <p className="mt-2 text-sm text-red-700/80">
            {resumo.pendentes.length} pendente(s).
          </p>
        </div>
      </section>

      {resumo.pendentes.length > 0 && (
        <section className="mb-5 rounded-[1.5rem] border border-red-500/10 bg-red-50 p-4 shadow-xl shadow-[#071A4A]/5 sm:mb-8 sm:rounded-[1.75rem] sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-600 text-white">
              <Users size={22} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-red-600">
                Pendências
              </p>
              <h2 className="text-2xl font-black text-red-700">
                Inadimplentes da competência
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {resumo.pendentes.map((mensalidade) => (
              <span
                key={mensalidade.id}
                className="rounded-full bg-white px-3 py-2 text-sm font-black text-red-700"
              >
                {nomeJogador(mensalidade.jogador)}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-[1.5rem] border border-[#071A4A]/10 bg-white/90 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-6">
        <button
          type="button"
          onClick={() => setMostrarMensalidades((atual) => !atual)}
          className="mb-5 flex w-full items-center justify-between gap-4 rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] p-4 text-left transition active:scale-[0.99]"
        >
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0B6B3A]">
              Mensalidades
            </p>
            <h2 className="mt-1 text-2xl font-black text-[#071A4A]">
              {nomeMes(competenciaMes)} / {competenciaAno}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              {resumo.totalRegistros} registro(s), {resumo.pagos.length} pago(s),{" "}
              {resumo.pendentes.length} pendente(s), {resumo.isentos.length}{" "}
              isento(s).
            </p>
          </div>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#071A4A]">
            {mostrarMensalidades ? (
              <ChevronDown size={24} />
            ) : (
              <ChevronRight size={24} />
            )}
          </div>
        </button>

        {mostrarMensalidades && (
          <>
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold leading-6 text-slate-600">
                  Lista detalhada da competência selecionada.
                </p>
              </div>

              <label className="relative block">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  placeholder="Buscar jogador ou status"
                  className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] py-3 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0B6B3A] sm:min-w-80"
                />
              </label>
            </div>

            {carregando ? (
              <div className="flex min-h-32 items-center justify-center rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] p-5 text-sm font-bold text-slate-500">
                <Loader2 size={18} className="mr-2 animate-spin" />
                Carregando caixa...
              </div>
            ) : mensalidadesFiltradas.length === 0 ? (
              <div className="rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] p-5 text-sm font-bold text-slate-500">
                Nenhuma mensalidade gerada para esta competência. Clique em
                “Gerar mensalidades”.
              </div>
            ) : (
              <div className="grid gap-3">
                {mensalidadesFiltradas.map((mensalidade) => {
                  const whatsappLink = montarLinkWhatsApp(
                    mensalidade,
                    configuracao
                  );

                  return (
                    <article
                      key={mensalidade.id}
                      className="rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] p-4"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xl font-black text-[#071A4A]">
                              {nomeJogador(mensalidade.jogador)}
                            </h3>

                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${classeStatus(
                                mensalidade.status
                              )}`}
                            >
                              {mensalidade.status}
                            </span>
                          </div>

                          {mensalidade.jogador?.apelido && (
                            <p className="mt-1 text-sm font-semibold text-slate-600">
                              {mensalidade.jogador.nome}
                            </p>
                          )}

                          <p className="mt-2 text-sm font-semibold text-slate-600">
                            Valor:{" "}
                            <strong className="text-slate-800">
                              {formatarValor(mensalidade.valor)}
                            </strong>
                          </p>

                          {mensalidade.data_pagamento && (
                            <p className="mt-1 text-sm font-semibold text-green-700">
                              Pago em {mensalidade.data_pagamento} via{" "}
                              {mensalidade.forma_pagamento || "-"}
                            </p>
                          )}
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[430px]">
                          <button
                            type="button"
                            disabled={salvando}
                            onClick={() =>
                              atualizarStatus(mensalidade, "pago", "Pix")
                            }
                            className="touch-button rounded-2xl bg-green-600 px-4 py-3 text-sm font-black text-white transition active:scale-[0.99] disabled:opacity-50"
                          >
                            Marcar pago
                          </button>

                          <button
                            type="button"
                            disabled={salvando}
                            onClick={() =>
                              atualizarStatus(mensalidade, "pendente")
                            }
                            className="touch-button rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white transition active:scale-[0.99] disabled:opacity-50"
                          >
                            Pendente
                          </button>

                          <button
                            type="button"
                            disabled={salvando}
                            onClick={() =>
                              atualizarStatus(mensalidade, "isento")
                            }
                            className="touch-button rounded-2xl border border-[#071A4A]/15 bg-white px-4 py-3 text-sm font-black text-[#071A4A] transition active:scale-[0.99] disabled:opacity-50"
                          >
                            Isentar
                          </button>

                          {whatsappLink ? (
                            <a
                              href={whatsappLink}
                              target="_blank"
                              rel="noreferrer"
                              className="touch-button inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0B6B3A] px-4 py-3 text-sm font-black text-white transition active:scale-[0.99]"
                            >
                              <MessageCircle size={18} />
                              Cobrar
                            </a>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="touch-button rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-black text-slate-400"
                            >
                              Sem WhatsApp
                            </button>
                          )}

                          <form
                            className="sm:col-span-2"
                            onSubmit={(event) => {
                              event.preventDefault();
                              const formData = new FormData(
                                event.currentTarget
                              );
                              const valor = String(formData.get("valor") || "");
                              alterarValor(mensalidade, valor);
                            }}
                          >
                            <div className="grid grid-cols-[1fr_auto] gap-2">
                              <input
                                name="valor"
                                defaultValue={String(
                                  Number(mensalidade.valor)
                                )}
                                inputMode="decimal"
                                className="min-h-12 rounded-2xl border border-[#071A4A]/15 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#0B6B3A]"
                              />

                              <button
                                type="submit"
                                disabled={salvando}
                                className="touch-button rounded-2xl border border-[#071A4A]/15 bg-white px-4 py-3 text-sm font-black text-[#071A4A] transition active:scale-[0.99] disabled:opacity-50"
                              >
                                Valor
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}