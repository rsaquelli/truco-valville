"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Loader2,
  ReceiptText,
  RefreshCw,
  Save,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type {
  CategoriaDespesaCaixa,
  DespesaCaixaComJogador,
  Jogador,
} from "@/types/truco";

type FormState = {
  data_despesa: string;
  categoria: CategoriaDespesaCaixa;
  descricao: string;
  valor: string;
  jogador_responsavel_id: string;
  enviado_para_jogador: boolean;
  data_envio: string;
  forma_envio: string;
  observacoes: string;
};

const categorias: { valor: CategoriaDespesaCaixa; label: string }[] = [
  { valor: "churrasco", label: "Churrasco" },
  { valor: "cerveja", label: "Cerveja" },
  { valor: "gelo", label: "Gelo" },
  { valor: "carvao", label: "Carvão" },
  { valor: "descartaveis", label: "Descartáveis" },
  { valor: "trofeu", label: "Troféu" },
  { valor: "outros", label: "Outros" },
];

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

function criarFormInicial(): FormState {
  return {
    data_despesa: hojeISO(),
    categoria: "churrasco",
    descricao: "",
    valor: "",
    jogador_responsavel_id: "",
    enviado_para_jogador: false,
    data_envio: hojeISO(),
    forma_envio: "Pix",
    observacoes: "",
  };
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

function nomeJogador(jogador: Jogador | null) {
  if (!jogador) return "-";
  return jogador.apelido || jogador.nome;
}

function labelCategoria(categoria: CategoriaDespesaCaixa) {
  return categorias.find((item) => item.valor === categoria)?.label || categoria;
}

function limparNomeArquivo(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

export default function DespesasCaixaPage() {
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [despesas, setDespesas] = useState<DespesaCaixaComJogador[]>([]);
  const [form, setForm] = useState<FormState>(criarFormInicial());
  const [arquivoRecibo, setArquivoRecibo] = useState<File | null>(null);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  async function carregarDados() {
    setCarregando(true);
    setErro(null);

    const [jogadoresResult, despesasResult] = await Promise.all([
      supabase
        .from("jogadores")
        .select("*")
        .eq("ativo", true)
        .order("nome", { ascending: true }),

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

    if (jogadoresResult.error) {
      setErro(jogadoresResult.error.message);
      setCarregando(false);
      return;
    }

    if (despesasResult.error) {
      setErro(despesasResult.error.message);
      setCarregando(false);
      return;
    }

    setJogadores((jogadoresResult.data ?? []) as Jogador[]);
    setDespesas((despesasResult.data ?? []) as DespesaCaixaComJogador[]);
    setCarregando(false);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const resumo = useMemo(() => {
    const total = despesas.reduce(
      (soma, despesa) => soma + Number(despesa.valor || 0),
      0
    );

    const totalComRecibo = despesas.filter((despesa) => despesa.recibo_url).length;

    const totalEnviadoJogador = despesas
      .filter((despesa) => despesa.enviado_para_jogador)
      .reduce((soma, despesa) => soma + Number(despesa.valor || 0), 0);

    return {
      total,
      totalComRecibo,
      totalEnviadoJogador,
      quantidade: despesas.length,
    };
  }, [despesas]);

  function atualizarCampo<K extends keyof FormState>(
    campo: K,
    valor: FormState[K]
  ) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function validar() {
    if (!form.data_despesa) return "Informe a data da despesa.";
    if (!form.descricao.trim()) return "Informe a descrição da despesa.";

    const valor = Number(form.valor.replace(",", "."));

    if (!valor || valor <= 0) return "Informe um valor válido.";

    if (form.enviado_para_jogador && !form.jogador_responsavel_id) {
      return "Selecione o jogador responsável se o dinheiro foi enviado para alguém.";
    }

    if (form.enviado_para_jogador && !form.data_envio) {
      return "Informe a data do envio ao jogador.";
    }

    return null;
  }

  async function uploadRecibo() {
    if (!arquivoRecibo) {
      return {
        recibo_url: null,
        recibo_path: null,
        recibo_nome: null,
      };
    }

    const limiteMb = 10;
    const tamanhoMb = arquivoRecibo.size / 1024 / 1024;

    if (tamanhoMb > limiteMb) {
      throw new Error("O recibo deve ter no máximo 10MB.");
    }

    const nomeLimpo = limparNomeArquivo(arquivoRecibo.name);
    const ano = new Date().getFullYear();
    const path = `${ano}/${Date.now()}-${nomeLimpo}`;

    const { error } = await supabase.storage
      .from("recibos-caixa")
      .upload(path, arquivoRecibo, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw new Error(error.message);
    }

    const { data } = supabase.storage
      .from("recibos-caixa")
      .getPublicUrl(path);

    return {
      recibo_url: data.publicUrl,
      recibo_path: path,
      recibo_nome: arquivoRecibo.name,
    };
  }

  async function salvarDespesa() {
    setErro(null);
    setSucesso(null);

    const erroValidacao = validar();

    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    setSalvando(true);

    try {
      const recibo = await uploadRecibo();
      const valor = Number(form.valor.replace(",", "."));

      const { error } = await supabase.from("despesas_caixa").insert({
        data_despesa: form.data_despesa,
        categoria: form.categoria,
        descricao: form.descricao.trim(),
        valor,
        jogador_responsavel_id: form.jogador_responsavel_id || null,
        enviado_para_jogador: form.enviado_para_jogador,
        data_envio: form.enviado_para_jogador ? form.data_envio || null : null,
        forma_envio: form.enviado_para_jogador
          ? form.forma_envio.trim() || null
          : null,
        observacoes: form.observacoes.trim() || null,
        recibo_url: recibo.recibo_url,
        recibo_path: recibo.recibo_path,
        recibo_nome: recibo.recibo_nome,
      });

      if (error) {
        throw new Error(error.message);
      }

      setSucesso("Despesa registrada com sucesso.");
      setForm(criarFormInicial());
      setArquivoRecibo(null);
      await carregarDados();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao salvar despesa.");
    }

    setSalvando(false);
  }

  async function excluirDespesa(despesa: DespesaCaixaComJogador) {
    const confirmar = window.confirm("Excluir esta despesa?");

    if (!confirmar) return;

    setErro(null);
    setSucesso(null);
    setSalvando(true);

    if (despesa.recibo_path) {
      await supabase.storage.from("recibos-caixa").remove([despesa.recibo_path]);
    }

    const { error } = await supabase
      .from("despesas_caixa")
      .delete()
      .eq("id", despesa.id);

    if (error) {
      setErro(error.message);
      setSalvando(false);
      return;
    }

    setSucesso("Despesa excluída.");
    setSalvando(false);
    await carregarDados();
  }

  return (
    <main className="app-shell safe-bottom mx-auto flex w-full max-w-6xl flex-col px-4 pb-28 pt-5 sm:px-6 sm:pb-8 lg:px-8">
      <header className="mb-5 rounded-[1.5rem] border border-[#071A4A]/10 bg-white/90 p-4 shadow-xl shadow-[#071A4A]/5 sm:mb-8 sm:rounded-[2rem] sm:p-6">
        <div className="mb-4 flex flex-wrap gap-2">
          <Link
            href="/caixa"
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] px-4 py-2 text-sm font-black text-[#071A4A] transition active:scale-[0.99] sm:hover:border-[#E6AA00]/60"
          >
            <ArrowLeft size={18} />
            Caixa
          </Link>

          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#071A4A]/10 bg-white px-4 py-2 text-sm font-black text-[#071A4A] transition active:scale-[0.99] sm:hover:border-[#E6AA00]/60"
          >
            Início
          </Link>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#E6AA00]/35 bg-[#E6AA00]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#5A3924] sm:text-xs">
              <ReceiptText size={15} />
              Etapa 10
            </div>

            <h1 className="text-3xl font-black tracking-tight text-[#071A4A] sm:text-5xl">
              Despesas do Caixa
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700 sm:text-base">
              Registre saídas do caixa, anexe recibos e informe quando o valor
              foi enviado para algum jogador responsável pela compra.
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

      <section className="mb-5 grid gap-4 sm:mb-8 lg:grid-cols-4">
        <div className="rounded-[1.5rem] border border-[#071A4A]/10 bg-white/90 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-slate-500">Despesas</p>
          <p className="mt-1 text-3xl font-black text-[#071A4A]">
            {resumo.quantidade}
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-red-500/10 bg-red-50 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-red-600">Total gasto</p>
          <p className="mt-1 text-3xl font-black text-red-700">
            {formatarValor(resumo.total)}
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-[#E6AA00]/30 bg-[#FFF7D7] p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-[#5A3924]">Com recibo</p>
          <p className="mt-1 text-3xl font-black text-[#071A4A]">
            {resumo.totalComRecibo}
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-green-600/20 bg-green-50 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-green-700">
            Enviado a jogador
          </p>
          <p className="mt-1 text-3xl font-black text-green-800">
            {formatarValor(resumo.totalEnviadoJogador)}
          </p>
        </div>
      </section>

      <section className="mb-5 rounded-[1.5rem] border border-[#071A4A]/10 bg-white/90 p-4 shadow-xl shadow-[#071A4A]/5 sm:mb-8 sm:rounded-[1.75rem] sm:p-6">
        <div className="mb-5">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0B6B3A]">
            Nova despesa
          </p>
          <h2 className="mt-1 text-2xl font-black text-[#071A4A]">
            Registrar saída
          </h2>
        </div>

        <div className="grid gap-5">
          <div className="grid gap-5 lg:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-black text-[#071A4A]">
                Data *
              </label>
              <input
                type="date"
                value={form.data_despesa}
                onChange={(event) =>
                  atualizarCampo("data_despesa", event.target.value)
                }
                className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#0B6B3A]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-[#071A4A]">
                Categoria *
              </label>
              <select
                value={form.categoria}
                onChange={(event) =>
                  atualizarCampo(
                    "categoria",
                    event.target.value as CategoriaDespesaCaixa
                  )
                }
                className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#0B6B3A]"
              >
                {categorias.map((categoria) => (
                  <option key={categoria.valor} value={categoria.valor}>
                    {categoria.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-[#071A4A]">
                Valor *
              </label>
              <input
                value={form.valor}
                onChange={(event) => atualizarCampo("valor", event.target.value)}
                inputMode="decimal"
                placeholder="120,00"
                className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#0B6B3A]"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-[#071A4A]">
              Descrição *
            </label>
            <input
              value={form.descricao}
              onChange={(event) =>
                atualizarCampo("descricao", event.target.value)
              }
              placeholder="Ex: Compra de carnes para o churrasco"
              className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0B6B3A]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-[#071A4A]">
              Jogador responsável pela compra
            </label>
            <select
              value={form.jogador_responsavel_id}
              onChange={(event) =>
                atualizarCampo("jogador_responsavel_id", event.target.value)
              }
              className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#0B6B3A]"
            >
              <option value="">Não informado</option>
              {jogadores.map((jogador) => (
                <option key={jogador.id} value={jogador.id}>
                  {nomeJogador(jogador)}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] p-4">
            <input
              type="checkbox"
              checked={form.enviado_para_jogador}
              onChange={(event) =>
                atualizarCampo("enviado_para_jogador", event.target.checked)
              }
              className="mt-1 h-5 w-5"
            />
            <span>
              <strong className="block text-sm font-black text-[#071A4A]">
                Valor enviado para o jogador responsável
              </strong>
              <span className="mt-1 block text-sm font-semibold text-slate-600">
                Marque quando o dinheiro saiu do caixa e foi enviado para alguém
                comprar os itens.
              </span>
            </span>
          </label>

          {form.enviado_para_jogador && (
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-black text-[#071A4A]">
                  Data do envio *
                </label>
                <input
                  type="date"
                  value={form.data_envio}
                  onChange={(event) =>
                    atualizarCampo("data_envio", event.target.value)
                  }
                  className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#0B6B3A]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-[#071A4A]">
                  Forma de envio
                </label>
                <input
                  value={form.forma_envio}
                  onChange={(event) =>
                    atualizarCampo("forma_envio", event.target.value)
                  }
                  placeholder="Pix, dinheiro, transferência..."
                  className="min-h-12 w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0B6B3A]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-black text-[#071A4A]">
              Recibo / comprovante
            </label>

            <label className="flex min-h-20 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#071A4A]/25 bg-[#FAF8F1] p-4 text-center transition active:scale-[0.99]">
              <Upload size={24} className="mb-2 text-[#0B6B3A]" />
              <span className="text-sm font-black text-[#071A4A]">
                {arquivoRecibo ? arquivoRecibo.name : "Selecionar recibo"}
              </span>
              <span className="mt-1 text-xs font-semibold text-slate-500">
                PDF, JPG, PNG ou WEBP até 10MB
              </span>

              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) =>
                  setArquivoRecibo(event.target.files?.[0] ?? null)
                }
              />
            </label>
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
              placeholder="Detalhes adicionais da compra ou prestação de contas"
              className="w-full rounded-2xl border border-[#071A4A]/15 bg-[#FAF8F1] px-4 py-3 text-sm font-semibold leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0B6B3A]"
            />
          </div>

          <button
            type="button"
            disabled={salvando}
            onClick={salvarDespesa}
            className="touch-button inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0B6B3A] px-5 py-4 text-base font-black text-white shadow-lg shadow-[#0B6B3A]/20 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {salvando ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Save size={20} />
            )}
            Salvar despesa
          </button>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-[#071A4A]/10 bg-white/90 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-6">
        <div className="mb-5">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0B6B3A]">
            Histórico
          </p>
          <h2 className="mt-1 text-2xl font-black text-[#071A4A]">
            Saídas registradas
          </h2>
        </div>

        {carregando ? (
          <div className="flex min-h-32 items-center justify-center rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] p-5 text-sm font-bold text-slate-500">
            <Loader2 size={18} className="mr-2 animate-spin" />
            Carregando despesas...
          </div>
        ) : despesas.length === 0 ? (
          <div className="rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] p-5 text-sm font-bold text-slate-500">
            Nenhuma despesa registrada ainda.
          </div>
        ) : (
          <div className="grid gap-3">
            {despesas.map((despesa) => (
              <article
                key={despesa.id}
                className="rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-black text-[#071A4A]">
                        {despesa.descricao}
                      </h3>

                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase text-[#5A3924]">
                        {labelCategoria(despesa.categoria)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-semibold text-slate-600">
                      Data:{" "}
                      <strong className="text-slate-800">
                        {formatarData(despesa.data_despesa)}
                      </strong>
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-600">
                      Valor:{" "}
                      <strong className="text-red-700">
                        {formatarValor(despesa.valor)}
                      </strong>
                    </p>

                    {despesa.jogador_responsavel && (
                      <p className="mt-1 text-sm font-semibold text-slate-600">
                        Responsável:{" "}
                        <strong className="text-slate-800">
                          {nomeJogador(despesa.jogador_responsavel)}
                        </strong>
                      </p>
                    )}

                    {despesa.enviado_para_jogador && (
                      <p className="mt-1 text-sm font-semibold text-green-700">
                        Enviado para jogador em{" "}
                        {formatarData(despesa.data_envio)} via{" "}
                        {despesa.forma_envio || "-"}.
                      </p>
                    )}

                    {despesa.observacoes && (
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                        {despesa.observacoes}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2 lg:min-w-48">
                    {despesa.recibo_url ? (
                      <a
                        href={despesa.recibo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="touch-button inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0B6B3A] px-4 py-3 text-sm font-black text-white transition active:scale-[0.99]"
                      >
                        <FileText size={18} />
                        Ver recibo
                      </a>
                    ) : (
                      <span className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-black text-slate-400">
                        Sem recibo
                      </span>
                    )}

                    <button
                      type="button"
                      disabled={salvando}
                      onClick={() => excluirDespesa(despesa)}
                      className="touch-button inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white transition active:scale-[0.99] disabled:opacity-50"
                    >
                      <Trash2 size={18} />
                      Excluir
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
