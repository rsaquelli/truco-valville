"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Save,
  Settings,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { ConfiguracaoGrupo } from "@/types/truco";

type FormState = {
  nome_grupo: string;
  valor_mensalidade: string;
  dia_vencimento: string;
  whatsapp_responsavel: string;
  texto_cobranca: string;
  texto_convite_rodada: string;
};

function formatarValorBR(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function limparTelefone(valor: string) {
  return valor.replace(/\D/g, "");
}

function criarFormInicial(): FormState {
  return {
    nome_grupo: "Truco no Valville",
    valor_mensalidade: "100",
    dia_vencimento: "10",
    whatsapp_responsavel: "",
    texto_cobranca:
      "Fala, pessoal! Passando para lembrar da mensalidade do Truco no Valville. Valor: R$ 100,00. Quem puder já mandar, ajuda no caixa do churrasco, cerveja e resenha. 🍻🃏",
    texto_convite_rodada:
      "Fala, turma! Hoje tem Truco no Valville. Bora confirmar presença para organizar a resenha, o churrasco e a jogatina. 🃏🍻",
  };
}

export default function ConfiguracoesPage() {
  const [configuracao, setConfiguracao] = useState<ConfiguracaoGrupo | null>(
    null
  );
  const [form, setForm] = useState<FormState>(criarFormInicial());

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  async function carregarConfiguracao() {
    setCarregando(true);
    setErro(null);
    setSucesso(null);

    const { data, error } = await supabase
      .from("configuracoes_grupo")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      setErro(error.message);
      setCarregando(false);
      return;
    }

    if (!data) {
      setErro("Nenhuma configuração encontrada. Rode o SQL da etapa 8.");
      setCarregando(false);
      return;
    }

    const config = data as ConfiguracaoGrupo;

    setConfiguracao(config);
    setForm({
      nome_grupo: config.nome_grupo || "Truco no Valville",
      valor_mensalidade: String(Number(config.valor_mensalidade || 0)),
      dia_vencimento: String(config.dia_vencimento || 10),
      whatsapp_responsavel: config.whatsapp_responsavel || "",
      texto_cobranca: config.texto_cobranca || "",
      texto_convite_rodada: config.texto_convite_rodada || "",
    });

    setCarregando(false);
  }

  useEffect(() => {
    carregarConfiguracao();
  }, []);

  function validar() {
    if (!form.nome_grupo.trim()) {
      return "Informe o nome do grupo.";
    }

    const valor = Number(form.valor_mensalidade.replace(",", "."));

    if (!valor || valor <= 0) {
      return "Informe um valor de mensalidade válido.";
    }

    const dia = Number(form.dia_vencimento);

    if (!dia || dia < 1 || dia > 31) {
      return "Informe um dia de vencimento entre 1 e 31.";
    }

    if (!form.texto_cobranca.trim()) {
      return "Informe o texto padrão de cobrança.";
    }

    if (!form.texto_convite_rodada.trim()) {
      return "Informe o texto padrão de convite da rodada.";
    }

    return null;
  }

  async function salvarConfiguracao() {
    setErro(null);
    setSucesso(null);

    const erroValidacao = validar();

    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    const valorMensalidade = Number(form.valor_mensalidade.replace(",", "."));
    const diaVencimento = Number(form.dia_vencimento);

    setSalvando(true);

    if (!configuracao) {
      const { error } = await supabase.from("configuracoes_grupo").insert({
        nome_grupo: form.nome_grupo.trim(),
        valor_mensalidade: valorMensalidade,
        dia_vencimento: diaVencimento,
        whatsapp_responsavel: limparTelefone(form.whatsapp_responsavel) || null,
        texto_cobranca: form.texto_cobranca.trim(),
        texto_convite_rodada: form.texto_convite_rodada.trim(),
      });

      if (error) {
        setErro(error.message);
        setSalvando(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from("configuracoes_grupo")
        .update({
          nome_grupo: form.nome_grupo.trim(),
          valor_mensalidade: valorMensalidade,
          dia_vencimento: diaVencimento,
          whatsapp_responsavel:
            limparTelefone(form.whatsapp_responsavel) || null,
          texto_cobranca: form.texto_cobranca.trim(),
          texto_convite_rodada: form.texto_convite_rodada.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", configuracao.id);

      if (error) {
        setErro(error.message);
        setSalvando(false);
        return;
      }
    }

    setSucesso("Configurações salvas com sucesso.");
    setSalvando(false);
    await carregarConfiguracao();
  }

  function atualizarCampo(campo: keyof FormState, valor: string) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  const valorPreview = Number(form.valor_mensalidade.replace(",", ".") || 0);

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
              <Settings size={15} />
              Etapa 8
            </div>

            <h1 className="text-3xl font-black tracking-tight text-[#071A4A] sm:text-5xl">
              Configurações
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700 sm:text-base">
              Parametrize o grupo, mensalidade, vencimento e mensagens padrão
              para cobrança e convite de rodada.
            </p>
          </div>

          <button
            type="button"
            onClick={carregarConfiguracao}
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

      <section className="mb-5 grid gap-4 sm:mb-8 lg:grid-cols-3">
        <div className="rounded-[1.5rem] border border-[#071A4A]/10 bg-white/90 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-slate-500">Grupo</p>
          <p className="mt-1 truncate text-2xl font-black text-[#071A4A]">
            {form.nome_grupo || "-"}
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-[#E6AA00]/30 bg-[#FFF7D7] p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-[#5A3924]">Mensalidade</p>
          <p className="mt-1 text-3xl font-black text-[#071A4A]">
            {formatarValorBR(valorPreview || 0)}
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-green-600/20 bg-green-50 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-green-700">Vencimento</p>
          <p className="mt-1 text-3xl font-black text-green-800">
            Dia {form.dia_vencimento || "-"}
          </p>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-[#071A4A]/10 bg-white/90 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-6">
        {carregando ? (
          <div className="flex min-h-48 items-center justify-center rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] p-5 text-sm font-bold text-slate-500">
            <Loader2 size={18} className="mr-2 animate-spin" />
            Carregando configurações...
          </div>
        ) : (
          <div className="grid gap-5">
            <div className="grid gap-5 lg:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-black text-[#071A4A]">
                  Nome do grupo *
                </label>
                <input
                  value={form.nome_grupo}
                  onChange={(event) =>
                    atualizarCampo("nome_grupo", event.target.value)
                  }
                  className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#0B6B3A]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-[#071A4A]">
                  Valor mensalidade *
                </label>
                <input
                  value={form.valor_mensalidade}
                  onChange={(event) =>
                    atualizarCampo("valor_mensalidade", event.target.value)
                  }
                  inputMode="decimal"
                  placeholder="100"
                  className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#0B6B3A]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-[#071A4A]">
                  Dia vencimento *
                </label>
                <input
                  value={form.dia_vencimento}
                  onChange={(event) =>
                    atualizarCampo("dia_vencimento", event.target.value)
                  }
                  inputMode="numeric"
                  placeholder="10"
                  className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#0B6B3A]"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-[#071A4A]">
                WhatsApp do responsável
              </label>
              <input
                value={form.whatsapp_responsavel}
                onChange={(event) =>
                  atualizarCampo("whatsapp_responsavel", event.target.value)
                }
                inputMode="tel"
                placeholder="11999999999"
                className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#0B6B3A]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-[#071A4A]">
                Texto padrão de cobrança *
              </label>
              <textarea
                value={form.texto_cobranca}
                onChange={(event) =>
                  atualizarCampo("texto_cobranca", event.target.value)
                }
                rows={5}
                className="w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] px-4 py-3 text-sm font-semibold leading-6 text-slate-800 outline-none transition focus:border-[#0B6B3A]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-[#071A4A]">
                Texto padrão de convite da rodada *
              </label>
              <textarea
                value={form.texto_convite_rodada}
                onChange={(event) =>
                  atualizarCampo("texto_convite_rodada", event.target.value)
                }
                rows={5}
                className="w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] px-4 py-3 text-sm font-semibold leading-6 text-slate-800 outline-none transition focus:border-[#0B6B3A]"
              />
            </div>

            <button
              type="button"
              onClick={salvarConfiguracao}
              disabled={salvando}
              className="touch-button inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0B6B3A] px-5 py-4 text-base font-black text-white shadow-lg shadow-[#0B6B3A]/20 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:hover:bg-[#064527]"
            >
              {salvando ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Save size={20} />
              )}
              Salvar configurações
            </button>
          </div>
        )}
      </section>
    </main>
  );
}