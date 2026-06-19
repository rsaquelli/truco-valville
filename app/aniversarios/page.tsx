"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Cake,
  CheckCircle2,
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { Jogador } from "@/types/truco";

type JogadorAniversario = {
  jogador: Jogador;
  diasParaAniversario: number;
  proximaData: Date;
  hoje: boolean;
};

function nomeJogador(jogador: Jogador) {
  return jogador.apelido || jogador.nome;
}

function somenteNumeros(valor: string | null) {
  if (!valor) return "";
  return valor.replace(/\D/g, "");
}

function formatarDataNascimento(data: string | null) {
  if (!data) return "-";

  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function formatarDiaMes(data: Date) {
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function calcularIdade(dataNascimento: string | null) {
  if (!dataNascimento) return null;

  const hoje = new Date();
  const [ano, mes, dia] = dataNascimento.split("-").map(Number);

  if (!ano || !mes || !dia) return null;

  let idade = hoje.getFullYear() - ano;
  const aniversarioEsteAno = new Date(hoje.getFullYear(), mes - 1, dia);

  if (hoje < aniversarioEsteAno) {
    idade -= 1;
  }

  return idade;
}

function calcularAniversario(jogador: Jogador): JogadorAniversario | null {
  if (!jogador.data_nascimento) return null;

  const [ano, mes, dia] = jogador.data_nascimento.split("-").map(Number);

  if (!ano || !mes || !dia) return null;

  const agora = new Date();
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());

  const aniversarioEsteAno = new Date(hoje.getFullYear(), mes - 1, dia);
  const proximaData =
    aniversarioEsteAno >= hoje
      ? aniversarioEsteAno
      : new Date(hoje.getFullYear() + 1, mes - 1, dia);

  const diffMs = proximaData.getTime() - hoje.getTime();
  const diasParaAniversario = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return {
    jogador,
    diasParaAniversario,
    proximaData,
    hoje: diasParaAniversario === 0,
  };
}

function montarMensagem(jogador: Jogador) {
  const nome = nomeJogador(jogador);

  return `🎂🎉 Hoje é aniversário do ${nome}!

Que venham muitos anos de vida, saúde, truco, churrasco e poucas derrotas.

Parabéns, ${nome}! 🍻🃏`;
}

function montarLinkWhatsApp(jogador: Jogador) {
  const telefone = somenteNumeros(jogador.whatsapp);

  if (!telefone) return null;

  return `https://wa.me/55${telefone}?text=${encodeURIComponent(
    montarMensagem(jogador)
  )}`;
}

export default function AniversariosPage() {
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagemCopiada, setMensagemCopiada] = useState<string | null>(null);

  async function carregarJogadores() {
    setCarregando(true);
    setErro(null);
    setMensagemCopiada(null);

    const { data, error } = await supabase
      .from("jogadores")
      .select("*")
      .eq("ativo", true)
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

  const aniversarios = useMemo(() => {
    return jogadores
      .map((jogador) => calcularAniversario(jogador))
      .filter((item): item is JogadorAniversario => Boolean(item))
      .sort((a, b) => a.diasParaAniversario - b.diasParaAniversario);
  }, [jogadores]);

  const aniversariosHoje = useMemo(() => {
    return aniversarios.filter((item) => item.hoje);
  }, [aniversarios]);

  const aniversariantesDoMes = useMemo(() => {
    const mesAtual = new Date().getMonth() + 1;

    return aniversarios.filter((item) => {
      if (!item.jogador.data_nascimento) return false;

      const mes = Number(item.jogador.data_nascimento.split("-")[1]);
      return mes === mesAtual;
    });
  }, [aniversarios]);

  const aniversariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return aniversarios;

    return aniversarios.filter((item) => {
      const jogador = item.jogador;

      return (
        jogador.nome.toLowerCase().includes(termo) ||
        Boolean(jogador.apelido?.toLowerCase().includes(termo)) ||
        Boolean(jogador.whatsapp?.toLowerCase().includes(termo))
      );
    });
  }, [aniversarios, busca]);

  const proximoAniversario = aniversarios[0] ?? null;

  async function copiarMensagem(jogador: Jogador) {
    try {
      await navigator.clipboard.writeText(montarMensagem(jogador));
      setMensagemCopiada(`Mensagem copiada para ${nomeJogador(jogador)}.`);
    } catch {
      setErro("Não foi possível copiar a mensagem.");
    }
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
              <Cake size={15} />
              Etapa 7
            </div>

            <h1 className="text-3xl font-black tracking-tight text-[#071A4A] sm:text-5xl">
              Aniversários
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700 sm:text-base">
              Controle os aniversariantes do grupo e gere mensagem pronta para
              WhatsApp com a resenha do truco.
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

      {mensagemCopiada && (
        <div className="mb-4 flex items-start gap-2 rounded-2xl border border-green-600/20 bg-green-50 p-4 text-sm font-bold text-green-700">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <span>{mensagemCopiada}</span>
        </div>
      )}

      <section className="mb-5 grid gap-4 sm:mb-8 lg:grid-cols-3">
        <div className="rounded-[1.5rem] border border-[#071A4A]/10 bg-white/90 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-slate-500">
            Aniversariantes hoje
          </p>
          <p className="mt-1 text-3xl font-black text-[#071A4A] sm:text-4xl">
            {aniversariosHoje.length}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {aniversariosHoje.length > 0
              ? "Hoje tem parabéns e zoeira."
              : "Nenhum aniversário hoje."}
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-[#E6AA00]/30 bg-[#FFF7D7] p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-[#5A3924]">
            Próximo aniversário
          </p>
          <p className="mt-1 truncate text-2xl font-black text-[#071A4A]">
            {proximoAniversario
              ? nomeJogador(proximoAniversario.jogador)
              : "-"}
          </p>
          <p className="mt-2 text-sm leading-6 text-[#5A3924]">
            {proximoAniversario
              ? proximoAniversario.hoje
                ? "É hoje!"
                : `Faltam ${proximoAniversario.diasParaAniversario} dia(s).`
              : "Cadastre datas de nascimento."}
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-green-600/20 bg-green-50 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-green-700">Neste mês</p>
          <p className="mt-1 text-3xl font-black text-green-800 sm:text-4xl">
            {aniversariantesDoMes.length}
          </p>
          <p className="mt-2 text-sm leading-6 text-green-700/80">
            Aniversariantes do mês atual.
          </p>
        </div>
      </section>

      {aniversariosHoje.length > 0 && (
        <section className="mb-5 rounded-[1.5rem] border border-[#E6AA00]/30 bg-[#FFF7D7] p-4 shadow-xl shadow-[#071A4A]/5 sm:mb-8 sm:rounded-[1.75rem] sm:p-6">
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#5A3924]">
              Hoje
            </p>
            <h2 className="text-2xl font-black text-[#071A4A]">
              Tem aniversariante no truco
            </h2>
          </div>

          <div className="grid gap-3">
            {aniversariosHoje.map((item) => {
              const whatsappLink = montarLinkWhatsApp(item.jogador);

              return (
                <article
                  key={item.jogador.id}
                  className="rounded-2xl border border-[#E6AA00]/30 bg-white p-4"
                >
                  <h3 className="text-xl font-black text-[#071A4A]">
                    🎂 {nomeJogador(item.jogador)}
                  </h3>

                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    {item.jogador.nome}
                  </p>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => copiarMensagem(item.jogador)}
                      className="touch-button rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] px-4 py-3 text-sm font-black text-[#071A4A] transition active:scale-[0.99]"
                    >
                      Copiar mensagem
                    </button>

                    {whatsappLink && (
                      <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noreferrer"
                        className="touch-button inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 text-sm font-black text-white transition active:scale-[0.99]"
                      >
                        <MessageCircle size={18} />
                        Enviar WhatsApp
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="mb-5 rounded-[1.5rem] border border-[#071A4A]/10 bg-white/90 p-4 shadow-xl shadow-[#071A4A]/5 sm:mb-8 sm:rounded-[1.75rem] sm:p-6">
        <div className="mb-5">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0B6B3A]">
            Busca
          </p>
          <h2 className="mt-1 text-2xl font-black text-[#071A4A]">
            Próximos aniversários
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
            placeholder="Buscar jogador"
            className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] py-3 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0B6B3A]"
          />
        </label>
      </section>

      <section className="rounded-[1.5rem] border border-[#071A4A]/10 bg-white/90 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-6">
        {carregando ? (
          <div className="flex min-h-32 items-center justify-center rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] p-5 text-sm font-bold text-slate-500">
            <Loader2 size={18} className="mr-2 animate-spin" />
            Carregando aniversários...
          </div>
        ) : aniversariosFiltrados.length === 0 ? (
          <div className="rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] p-5 text-sm font-bold text-slate-500">
            Nenhum aniversário encontrado. Cadastre a data de nascimento dos
            jogadores.
          </div>
        ) : (
          <div className="grid gap-3">
            {aniversariosFiltrados.map((item) => {
              const idade = calcularIdade(item.jogador.data_nascimento);
              const whatsappLink = montarLinkWhatsApp(item.jogador);

              return (
                <article
                  key={item.jogador.id}
                  className={`rounded-2xl border p-4 ${
                    item.hoje
                      ? "border-[#E6AA00]/50 bg-[#FFF7D7]"
                      : "border-[#071A4A]/10 bg-[#FAF8F1]"
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-xl font-black text-[#071A4A]">
                        {item.hoje ? "🎂 " : ""}
                        {nomeJogador(item.jogador)}
                      </h3>

                      {item.jogador.apelido && (
                        <p className="mt-1 text-sm font-semibold text-slate-600">
                          {item.jogador.nome}
                        </p>
                      )}

                      <p className="mt-2 text-sm font-semibold text-slate-600">
                        Nascimento:{" "}
                        <strong className="text-slate-800">
                          {formatarDataNascimento(
                            item.jogador.data_nascimento
                          )}
                        </strong>
                        {idade !== null ? ` — ${idade} anos` : ""}
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-600">
                        Próximo aniversário:{" "}
                        <strong className="text-slate-800">
                          {formatarDiaMes(item.proximaData)}
                        </strong>
                      </p>
                    </div>

                    <div className="grid gap-2 sm:min-w-56">
                      <span className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-[#071A4A]">
                        {item.hoje
                          ? "É hoje!"
                          : `Faltam ${item.diasParaAniversario} dia(s)`}
                      </span>

                      <button
                        type="button"
                        onClick={() => copiarMensagem(item.jogador)}
                        className="touch-button rounded-2xl border border-[#071A4A]/15 bg-white px-4 py-3 text-sm font-black text-[#071A4A] transition active:scale-[0.99]"
                      >
                        Copiar msg
                      </button>

                      {whatsappLink && (
                        <a
                          href={whatsappLink}
                          target="_blank"
                          rel="noreferrer"
                          className="touch-button inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 text-sm font-black text-white transition active:scale-[0.99]"
                        >
                          <MessageCircle size={18} />
                          WhatsApp
                        </a>
                      )}
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
