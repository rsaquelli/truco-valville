"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Home,
  PlayCircle,
  Share2,
  Smartphone,
  Trophy,
  Wallet,
} from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

function detectarDispositivo() {
  if (typeof navigator === "undefined") {
    return {
      isIOS: false,
      isAndroid: false,
      isStandalone: false,
    };
  }

  const userAgent = navigator.userAgent.toLowerCase();

  const isIOS =
    /iphone|ipad|ipod/.test(userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  const isAndroid = /android/.test(userAgent);

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari iOS
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));

  return {
    isIOS,
    isAndroid,
    isStandalone,
  };
}

export default function InstalarPage() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [instalado, setInstalado] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [urlAtual, setUrlAtual] = useState("");

  const dispositivo = useMemo(() => detectarDispositivo(), []);

  useEffect(() => {
    setUrlAtual(window.location.origin);

    const estadoAtual = detectarDispositivo();
    setInstalado(estadoAtual.isStandalone);

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    }

    function handleAppInstalled() {
      setInstalado(true);
      setMensagem("App instalado com sucesso.");
      setInstallPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function instalarApp() {
    if (!installPrompt) {
      setMensagem(
        "Se o botão de instalação não apareceu, use o menu do navegador e escolha “Adicionar à tela inicial”."
      );
      return;
    }

    await installPrompt.prompt();

    const escolha = await installPrompt.userChoice;

    if (escolha.outcome === "accepted") {
      setMensagem("Instalação iniciada.");
      setInstalado(true);
    } else {
      setMensagem("Instalação cancelada. Você pode tentar novamente depois.");
    }

    setInstallPrompt(null);
  }

  async function copiarMensagem() {
    const texto = `🃏🍻 Pessoal, app oficial do Truco no Valville no ar!

Agora vamos controlar partidas, ranking, parcerias, aniversários e caixa pelo app.

Acesse pelo celular:
${urlAtual || "https://SEU-LINK-AQUI"}

Para instalar como app:

📱 Android:
Abra no Chrome e toque em “Instalar app” ou “Adicionar à tela inicial”.

🍎 iPhone:
Abra no Safari, toque em compartilhar e depois em “Adicionar à Tela de Início”.

Bora parar de perder conta no grito e deixar o ranking oficial! 😂🃏`;

    try {
      await navigator.clipboard.writeText(texto);
      setMensagem("Mensagem copiada para mandar no WhatsApp.");
    } catch {
      setMensagem("Não consegui copiar automaticamente. Selecione e copie a mensagem manualmente.");
    }
  }

  return (
    <main className="app-shell safe-bottom mx-auto flex w-full max-w-5xl flex-col px-4 pb-64 pt-5 md:pb-8 sm:px-6 lg:px-8">
      <header className="mb-5 rounded-[1.5rem] border border-[#071A4A]/10 bg-white/95 p-4 shadow-xl shadow-[#071A4A]/5 sm:mb-8 sm:rounded-[2rem] sm:p-6">
        <div className="mb-4 flex flex-wrap gap-2">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] px-4 py-2 text-sm font-black text-[#071A4A] transition active:scale-[0.99] sm:hover:border-[#E6AA00]/60"
          >
            <ArrowLeft size={18} />
            Voltar
          </Link>
        </div>

        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#E6AA00]/35 bg-[#E6AA00]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#5A3924] sm:text-xs">
            <Smartphone size={15} />
            Instalar app
          </div>

          <h1 className="text-3xl font-black tracking-tight text-[#071A4A] sm:text-5xl">
            Instale o Truco Valville
          </h1>

          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-700 sm:text-base">
            Adicione o app na tela inicial do celular para abrir como aplicativo,
            sem precisar procurar o link no WhatsApp toda vez.
          </p>
        </div>
      </header>

      {mensagem && (
        <div className="mb-4 flex items-start gap-2 rounded-2xl border border-green-600/20 bg-green-50 p-4 text-sm font-bold text-green-700">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <span>{mensagem}</span>
        </div>
      )}

      <section className="mb-5 grid gap-4 sm:mb-8 lg:grid-cols-3">
        <div className="rounded-[1.5rem] border border-[#E6AA00]/30 bg-[#FFF7D7] p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-[#5A3924]">Status</p>
          <p className="mt-1 text-2xl font-black text-[#071A4A]">
            {instalado ? "Já instalado" : "Pronto para instalar"}
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#5A3924]">
            {instalado
              ? "Você já está usando em modo app."
              : "Instale na tela inicial do celular."}
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-[#071A4A]/10 bg-white/95 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-slate-500">Android</p>
          <p className="mt-1 text-2xl font-black text-[#071A4A]">
            Chrome
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            Pode aparecer o botão direto de instalação.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-[#071A4A]/10 bg-white/95 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-slate-500">iPhone</p>
          <p className="mt-1 text-2xl font-black text-[#071A4A]">
            Safari
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            Precisa usar o botão compartilhar do Safari.
          </p>
        </div>
      </section>

      <section className="mb-5 rounded-[1.5rem] border border-[#071A4A]/10 bg-white/95 p-4 shadow-xl shadow-[#071A4A]/5 sm:mb-8 sm:rounded-[1.75rem] sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0B6B3A] text-white">
            <Smartphone size={22} />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0B6B3A]">
              Instalação
            </p>
            <h2 className="text-2xl font-black text-[#071A4A]">
              Instalar como app
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={instalarApp}
          disabled={instalado}
          className="touch-button inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#0B6B3A] px-5 py-4 text-base font-black text-white shadow-lg shadow-[#0B6B3A]/20 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          <Smartphone size={20} />
          {instalado ? "App já instalado" : "Instalar agora"}
        </button>

        {!installPrompt && !instalado && (
          <p className="mt-4 rounded-2xl border border-[#E6AA00]/30 bg-[#FFF7D7] p-4 text-sm font-bold leading-6 text-[#5A3924]">
            No iPhone ou quando o botão automático não aparecer, use o passo a
            passo abaixo.
          </p>
        )}
      </section>

      <section className="mb-5 grid gap-4 sm:mb-8 lg:grid-cols-2">
        <div className="rounded-[1.5rem] border border-[#071A4A]/10 bg-white/95 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#071A4A] text-white">
              <Smartphone size={22} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0B6B3A]">
                Android
              </p>
              <h2 className="text-2xl font-black text-[#071A4A]">
                Pelo Chrome
              </h2>
            </div>
          </div>

          <ol className="grid gap-3 text-sm font-semibold leading-6 text-slate-700">
            <li className="rounded-2xl bg-[#FAF8F1] p-4">
              1. Abra o link no Chrome.
            </li>
            <li className="rounded-2xl bg-[#FAF8F1] p-4">
              2. Toque em “Instalar app” nesta tela ou no menu ⋮.
            </li>
            <li className="rounded-2xl bg-[#FAF8F1] p-4">
              3. Confirme em “Instalar” ou “Adicionar à tela inicial”.
            </li>
            <li className="rounded-2xl bg-[#FAF8F1] p-4">
              4. Abra pelo ícone criado na tela inicial.
            </li>
          </ol>
        </div>

        <div className="rounded-[1.5rem] border border-[#071A4A]/10 bg-white/95 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E6AA00] text-[#071A4A]">
              <Share2 size={22} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0B6B3A]">
                iPhone
              </p>
              <h2 className="text-2xl font-black text-[#071A4A]">
                Pelo Safari
              </h2>
            </div>
          </div>

          <ol className="grid gap-3 text-sm font-semibold leading-6 text-slate-700">
            <li className="rounded-2xl bg-[#FAF8F1] p-4">
              1. Abra o link no Safari.
            </li>
            <li className="rounded-2xl bg-[#FAF8F1] p-4">
              2. Toque no botão de compartilhar.
            </li>
            <li className="rounded-2xl bg-[#FAF8F1] p-4">
              3. Escolha “Adicionar à Tela de Início”.
            </li>
            <li className="rounded-2xl bg-[#FAF8F1] p-4">
              4. Confirme em “Adicionar”.
            </li>
          </ol>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-[#071A4A]/10 bg-white/95 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-6">
        <div className="mb-4">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0B6B3A]">
            WhatsApp
          </p>
          <h2 className="mt-1 text-2xl font-black text-[#071A4A]">
            Mensagem para o grupo
          </h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            Copie e mande no grupo quando o app estiver publicado.
          </p>
        </div>

        <button
          type="button"
          onClick={copiarMensagem}
          className="touch-button inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] px-5 py-4 text-sm font-black text-[#071A4A] transition active:scale-[0.99] sm:w-auto"
        >
          <Copy size={18} />
          Copiar mensagem
        </button>
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
