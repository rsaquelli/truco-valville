export type Jogador = {
  id: string;
  nome: string;
  apelido: string | null;
  whatsapp: string | null;
  data_nascimento: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

export type StatusRodada = "aberta" | "encerrada" | "cancelada";

export type Rodada = {
  id: string;
  data: string;
  horario: string | null;
  local: string | null;
  observacoes: string | null;
  status: StatusRodada;
  created_at: string;
  updated_at: string;
};

export type TipoPartida = "1x1" | "2x2" | "3x3";

export type StatusPartida = "em_andamento" | "encerrada" | "cancelada";

export type TimePartida = "A" | "B";

export type Partida = {
  id: string;
  rodada_id: string;
  tipo_partida: TipoPartida;
  status: StatusPartida;
  placar_time_a: number;
  placar_time_b: number;
  limite_pontos: number;
  time_vencedor: TimePartida | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  finalizada_at: string | null;
};

export type ParticipantePartida = {
  id: string;
  partida_id: string;
  jogador_id: string;
  time: TimePartida;
  created_at: string;
};

export type PontoPartida = {
  id: string;
  partida_id: string;
  time: TimePartida;
  valor: -1 | 1;
  created_at: string;
};

export type ParticipantePartidaComJogador = ParticipantePartida & {
  jogador: Jogador | null;
};

export type PartidaComRelacionamentos = Partida & {
  rodada: Rodada | null;
  participantes_partida: ParticipantePartidaComJogador[];
};