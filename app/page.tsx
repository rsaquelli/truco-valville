import Link from "next/link";
import {
  BarChart3,
  Cake,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Home,
  PlayCircle,
  ReceiptText,
  Settings,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";

const atalhosPrincipais = [
  {
    titulo: "Jogadores",
    descricao: "Cadastro dos participantes, apelidos, WhatsApp e aniversários.",
    href: "/jogadores",
    icone: Users,
  },
  {
    titulo: "Rodadas",
    descricao: "Organize os encontros semanais, local, data e status.",
    href: "/rodadas",
    icone: CalendarDays,
  },
  {
    titulo: "Nova partida",
    descricao: "Monte os times e use o marcador durante o jogo.",
    href: "/partidas/nova",
    icone: PlayCircle,
  },
  {
    titulo: "Ranking",
    descricao: "Vitórias, derrotas e aproveitamento individual.",
    href: "/ranking",
    icone: Trophy,
  },
];

const atalhosSecundarios = [
  {
    titulo: "Parcerias",
    descricao: "Melhores e piores duplas do truco.",
    href: "/ranking/parcerias",
    icone: BarChart3,
  },
  {
    titulo: "Caixa",
    descricao: "Mensalidades, pendências, recebido e saldo.",
    href: "/caixa",
    icone: Wallet,
  },
  {
    titulo: "Despesas",
    descricao: "Saídas do caixa, recibos e responsáveis.",
    href: "/caixa/despesas",
    icone: ReceiptText,
  },
  {
    titulo: "Histórico",
    descricao: "Resumo mensal do caixa e movimentações.",
    href: "/caixa/historico",
    icone: ClipboardList,
  },
  {
    titulo: "Aniversários",
    descricao: "Lembretes e mensagens prontas para WhatsApp.",
    href: "/aniversarios",
    icone: Cake,
  },
  {
    titulo: "Configurações",
    descricao: "Valor da mensalidade, textos padrão e dados do grupo.",
    href: "/configuracoes",
    icone: Settings,
  },
];

export default function HomePage() {
  return (
    <main className="app-shell safe-bottom mx-auto flex w-full max-w-6xl flex-col px-4 pb-28 pt-5 sm:px-6 sm:pb-8 lg:px-8">
      <section className="mb-5 overflow-hidden rounded-[1.75rem] border border-[#071A4A]/10 bg-white/95 shadow-xl shadow-[#071A4A]/5 sm:mb-8 sm:rounded-[2rem]">
        <div className="grid gap-0 lg:grid-cols-[340px_1fr]">
          <div className="flex items-center justify-center bg-[#FAF8F1] p-5 sm:p-8">
            <div className="flex aspect-square w-full max-w-[240px] items-center justify-center rounded-[1.75rem] border border-[#E6AA00]/30 bg-white p-4 shadow-xl shadow-[#071A4A]/10">
              <img
                src="/logo_truco.png"
                alt="Truco no Valville"
                className="h-full w-full object-contain"
              />
            </div>
          </div>

          <div className="flex flex-col justify-center p-5 sm:p-8 lg:p-10">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-[#E6AA00]/40 bg-[#FFF7D7] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#5A3924]">
              <Home size={14} />
              App oficial do truco semanal
            </div>

            <h1 className="max-w-2xl text-4xl font-black leading-[0.95] tracking-tight text-[#071A4A] sm:text-5xl lg:text-6xl">
              Ranking, resenha e churrasco sem mimimi.
            </h1>

            <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-slate-700 sm:text-base">
              Controle jogadores, rodadas, partidas, ranking, aniversários,
              mensalidades, despesas e o saldo do caixa do Truco no Valville.
            </p>

            <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
              <Link
                href="/partidas/nova"
                className="touch-button inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0B6B3A] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#0B6B3A]/20 transition active:scale-[0.99]"
              >
                <PlayCircle size={18} />
                Iniciar partida
              </Link>

              <Link
                href="/ranking"
                className="touch-button inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#071A4A]/10 bg-white px-5 py-3 text-sm font-black text-[#071A4A] shadow-lg shadow-[#071A4A]/5 transition active:scale-[0.99]"
              >
                <Trophy size={18} />
                Ver ranking
              </Link>

              <Link
                href="/caixa"
                className="touch-button inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#071A4A]/10 bg-white px-5 py-3 text-sm font-black text-[#071A4A] shadow-lg shadow-[#071A4A]/5 transition active:scale-[0.99]"
              >
                <CircleDollarSign size={18} />
                Caixa
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-5 grid gap-3 sm:mb-8 sm:grid-cols-3">
        <div className="rounded-[1.5rem] border border-[#071A4A]/10 bg-white/95 p-4 shadow-xl shadow-[#071A4A]/5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0B6B3A]">
            Grupo
          </p>
          <p className="mt-2 text-3xl font-black text-[#071A4A]">
            Truco no Valville
          </p>
          <p className="mt-2 text-sm font-semibold leading-5 text-slate-600">
            Controle simples para a resenha semanal.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-[#071A4A]/10 bg-white/95 p-4 shadow-xl shadow-[#071A4A]/5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0B6B3A]">
            Mensalidade
          </p>
          <p className="mt-2 text-3xl font-black text-[#071A4A]">R$ 100,00</p>
          <p className="mt-2 text-sm font-semibold leading-5 text-slate-600">
            Valor padrão ajustável nas configurações.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-[#071A4A]/10 bg-white/95 p-4 shadow-xl shadow-[#071A4A]/5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0B6B3A]">
            Ranking
          </p>
          <p className="mt-2 text-3xl font-black text-[#071A4A]">Individual</p>
          <p className="mt-2 text-sm font-semibold leading-5 text-slate-600">
            Cada jogador soma vitórias e derrotas.
          </p>
        </div>
      </section>

      <section className="mb-5 sm:mb-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0B6B3A]">
              Acesso rápido
            </p>
            <h2 className="mt-1 text-2xl font-black text-[#071A4A]">
              Principais funções
            </h2>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {atalhosPrincipais.map((atalho) => {
            const Icone = atalho.icone;

            return (
              <Link
                key={atalho.href}
                href={atalho.href}
                className="group rounded-[1.5rem] border border-[#071A4A]/10 bg-white/95 p-4 shadow-xl shadow-[#071A4A]/5 transition active:scale-[0.99] sm:hover:-translate-y-0.5 sm:hover:border-[#E6AA00]/50"
              >
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0B6B3A] text-white shadow-lg shadow-[#0B6B3A]/20">
                    <Icone size={22} />
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FAF8F1] text-[#071A4A] transition sm:group-hover:bg-[#FFF7D7]">
                    <ChevronRight size={22} />
                  </div>
                </div>

                <h3 className="text-xl font-black text-[#071A4A]">
                  {atalho.titulo}
                </h3>

                <p className="mt-2 min-h-12 text-sm font-semibold leading-5 text-slate-600">
                  {atalho.descricao}
                </p>

                <p className="mt-4 text-sm font-black text-[#0B6B3A]">
                  Abrir
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0B6B3A]">
              Gestão do grupo
            </p>
            <h2 className="mt-1 text-2xl font-black text-[#071A4A]">
              Mais opções
            </h2>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {atalhosSecundarios.map((atalho) => {
            const Icone = atalho.icone;

            return (
              <Link
                key={atalho.href}
                href={atalho.href}
                className="group rounded-[1.5rem] border border-[#071A4A]/10 bg-white/95 p-4 shadow-xl shadow-[#071A4A]/5 transition active:scale-[0.99] sm:hover:-translate-y-0.5 sm:hover:border-[#E6AA00]/50"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E6AA00] text-[#071A4A] shadow-lg shadow-[#E6AA00]/20">
                    <Icone size={21} />
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FAF8F1] text-[#071A4A] transition sm:group-hover:bg-[#FFF7D7]">
                    <ChevronRight size={22} />
                  </div>
                </div>

                <h3 className="text-lg font-black text-[#071A4A]">
                  {atalho.titulo}
                </h3>

                <p className="mt-2 text-sm font-semibold leading-5 text-slate-600">
                  {atalho.descricao}
                </p>

                <p className="mt-4 text-sm font-black text-[#0B6B3A]">
                  Abrir
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#071A4A]/10 bg-white/95 px-3 py-2 shadow-2xl shadow-[#071A4A]/20 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
          <Link
            href="/"
            className="flex flex-col items-center justify-center rounded-2xl bg-[#FAF8F1] px-2 py-2 text-[#071A4A]"
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