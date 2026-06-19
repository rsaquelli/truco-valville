import Image from "next/image";
import Link from "next/link";
import {
  Cake,
  CalendarDays,
  CircleDollarSign,
  Club,
  Home as HomeIcon,
  Settings,
  Trophy,
  Users,
} from "lucide-react";

const modulos = [
  {
    titulo: "Jogadores",
    descricao: "Cadastro dos membros, apelidos, WhatsApp e aniversários.",
    href: "/jogadores",
    icone: Users,
    status: "Próxima etapa",
  },
  {
    titulo: "Rodadas",
    descricao: "Encontros semanais com data, local e status da noite.",
    href: "/rodadas",
    icone: CalendarDays,
    status: "Em breve",
  },
  {
    titulo: "Marcador",
    descricao: "Escolha as duplas rotativas e salve a vitória da partida.",
    href: "/partidas/nova",
    icone: Club,
    status: "Em breve",
  },
  {
    titulo: "Ranking",
    descricao: "Vitórias, derrotas e aproveitamento por noite, semana, mês e ano.",
    href: "/ranking",
    icone: Trophy,
    status: "Em breve",
  },
  {
    titulo: "Caixa",
    descricao: "Mensalidade configurável, entradas, saídas e saldo do churrasco.",
    href: "/caixa",
    icone: CircleDollarSign,
    status: "Fase 2",
  },
  {
    titulo: "Aniversários",
    descricao: "Lembretes dos aniversariantes e mensagens prontas para WhatsApp.",
    href: "/aniversarios",
    icone: Cake,
    status: "Em breve",
  },
];

const regras = [
  "Duplas rotativas, sem cadastro fixo de dupla.",
  "Ranking principal sempre individual por jogador.",
  "Vitória soma para os dois jogadores da dupla vencedora.",
  "Derrota soma para os dois jogadores da dupla perdedora.",
  "Mensalidade inicial de R$ 100,00, mas configurável no app.",
];

const atalhosMobile = [
  {
    titulo: "Início",
    href: "/",
    icone: HomeIcon,
  },
  {
    titulo: "Jogadores",
    href: "/jogadores",
    icone: Users,
  },
  {
    titulo: "Partida",
    href: "/partidas/nova",
    icone: Club,
  },
  {
    titulo: "Ranking",
    href: "/ranking",
    icone: Trophy,
  },
];

export default function Home() {
  return (
    <main className="app-shell safe-bottom mx-auto flex w-full max-w-7xl flex-col px-4 pb-28 pt-5 sm:px-6 sm:pb-8 lg:px-8">
      <header className="mb-5 overflow-hidden rounded-[1.6rem] border border-[#071A4A]/10 bg-white/90 shadow-2xl shadow-[#071A4A]/10 backdrop-blur sm:mb-8 sm:rounded-[2rem]">
        <div className="grid gap-5 p-4 sm:gap-8 sm:p-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-center lg:p-10">
          <div className="flex justify-center lg:justify-start">
            <div className="relative w-full max-w-[260px] rounded-[1.5rem] border border-[#E6AA00]/25 bg-[#FAF8F1] p-3 shadow-xl shadow-[#071A4A]/10 sm:max-w-sm sm:rounded-[2rem] sm:p-4">
              <Image
                src="/logo_truco.png"
                alt="Truco no Valville"
                width={900}
                height={900}
                priority
                className="h-auto w-full"
              />
            </div>
          </div>

          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#E6AA00]/35 bg-[#E6AA00]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#5A3924] sm:px-4 sm:text-xs sm:tracking-[0.25em]">
              <Club size={15} />
              App oficial do truco semanal
            </div>

            <h1 className="text-balance max-w-4xl text-3xl font-black tracking-tight text-[#071A4A] sm:text-5xl lg:text-6xl">
              Ranking, resenha e churrasco sem caô.
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-700 sm:mt-5 sm:text-lg sm:leading-7">
              O app do Truco no Valville vai controlar as noites de jogo,
              registrar partidas com duplas rotativas, montar ranking individual,
              acompanhar o caixa mensal e lembrar os aniversários da turma.
            </p>

            <div className="mt-6 grid gap-3 sm:flex sm:flex-row">
              <Link
                href="/jogadores"
                className="touch-button inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0B6B3A] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#0B6B3A]/20 transition active:scale-[0.99] sm:hover:bg-[#064527]"
              >
                <Users size={18} />
                Começar pelos jogadores
              </Link>

              <Link
                href="/configuracoes"
                className="touch-button inline-flex items-center justify-center gap-2 rounded-2xl border border-[#071A4A]/15 bg-white px-5 py-3 text-sm font-black text-[#071A4A] shadow-lg shadow-[#071A4A]/5 transition active:scale-[0.99] sm:hover:border-[#E6AA00]/50 sm:hover:bg-[#FAF8F1]"
              >
                <Settings size={18} />
                Configurações
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="mb-5 grid gap-4 sm:mb-8 lg:grid-cols-3">
        <div className="rounded-[1.5rem] border border-[#071A4A]/10 bg-white/90 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-slate-500">
            Mensalidade inicial
          </p>
          <p className="mt-1 text-3xl font-black text-[#071A4A] sm:mt-2 sm:text-4xl">
            R$ 100,00
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Valor inicial por membro, mas configurável no app.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-[#071A4A]/10 bg-white/90 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-slate-500">Grupo atual</p>
          <p className="mt-1 text-3xl font-black text-[#071A4A] sm:mt-2 sm:text-4xl">
            12 membros
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            O sistema aceitará mais ou menos jogadores ativos.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-[#071A4A]/10 bg-white/90 p-4 shadow-xl shadow-[#071A4A]/5 sm:rounded-[1.75rem] sm:p-5">
          <p className="text-sm font-black text-slate-500">
            Ranking principal
          </p>
          <p className="mt-1 text-3xl font-black text-[#071A4A] sm:mt-2 sm:text-4xl">
            Individual
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            As duplas mudam, mas a zoeira fica registrada por jogador.
          </p>
        </div>
      </section>

      <section className="mb-5 grid gap-4 sm:mb-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="card-valville rounded-[1.5rem] p-4 sm:rounded-[1.75rem] sm:p-6">
          <div className="mb-4 flex items-center gap-3 sm:mb-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E6AA00] text-[#071A4A]">
              <Trophy size={22} />
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0B6B3A] sm:text-xs sm:tracking-[0.22em]">
                Desenho do MVP
              </p>
              <h2 className="text-xl font-black text-[#071A4A] sm:text-2xl">
                Regras principais
              </h2>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {regras.map((regra, index) => (
              <div
                key={regra}
                className="rounded-2xl border border-[#071A4A]/10 bg-[#FAF8F1] p-4"
              >
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#0B6B3A] text-sm font-black text-white">
                  {index + 1}
                </div>
                <p className="text-sm leading-6 text-slate-700">{regra}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-[1.5rem] border border-[#5A3924]/15 bg-[#5A3924] p-4 text-white shadow-xl shadow-[#5A3924]/20 sm:rounded-[1.75rem] sm:p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F4C542] sm:text-xs sm:tracking-[0.25em]">
            Status do projeto
          </p>

          <h2 className="mt-3 text-3xl font-black">Etapa 1.1</h2>

          <p className="mt-3 text-sm leading-6 text-white/80">
            Base visual mobile first, identidade do app, dashboard inicial e
            preparação para instalação como PWA no celular.
          </p>

          <div className="mt-5 rounded-2xl border border-white/15 bg-white/10 p-4">
            <p className="text-sm font-black text-[#F4C542]">
              Próximo passo técnico
            </p>
            <p className="mt-1 text-sm leading-6 text-white/85">
              Criar a tabela e a tela de jogadores, com nome, apelido, WhatsApp,
              aniversário e status ativo/inativo.
            </p>
          </div>
        </aside>
      </section>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modulos.map((modulo) => {
          const Icone = modulo.icone;

          return (
            <Link
              key={modulo.titulo}
              href={modulo.href}
              className="group rounded-[1.5rem] border border-[#071A4A]/10 bg-white/90 p-4 shadow-xl shadow-[#071A4A]/5 transition active:scale-[0.99] sm:rounded-[1.75rem] sm:p-5 sm:hover:-translate-y-1 sm:hover:border-[#E6AA00]/60 sm:hover:shadow-2xl sm:hover:shadow-[#071A4A]/10"
            >
              <div className="mb-4 flex items-start justify-between gap-3 sm:mb-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0B6B3A] text-white transition sm:group-hover:bg-[#E6AA00] sm:group-hover:text-[#071A4A]">
                  <Icone size={24} />
                </div>

                <span className="rounded-full border border-[#071A4A]/10 bg-[#FAF8F1] px-3 py-1 text-xs font-black text-[#5A3924]">
                  {modulo.status}
                </span>
              </div>

              <h2 className="text-xl font-black text-[#071A4A]">
                {modulo.titulo}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600 sm:min-h-12">
                {modulo.descricao}
              </p>

              <span className="mt-5 inline-flex text-sm font-black text-[#0B6B3A] group-hover:text-[#5A3924]">
                Abrir módulo
              </span>
            </Link>
          );
        })}
      </section>

      <footer className="mt-auto border-t border-[#071A4A]/10 py-6 text-center text-xs font-bold text-slate-500">
        Truco no Valville — App oficial do truco semanal
      </footer>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#071A4A]/10 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-2xl shadow-[#071A4A]/15 backdrop-blur sm:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
          {atalhosMobile.map((atalho) => {
            const Icone = atalho.icone;

            return (
              <Link
                key={atalho.href}
                href={atalho.href}
                className="flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[#071A4A] active:bg-[#FAF8F1]"
              >
                <Icone size={21} />
                <span className="text-[11px] font-black">{atalho.titulo}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </main>
  );
}