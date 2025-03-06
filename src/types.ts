export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  homeScore?: number;
  awayScore?: number;
}

export interface Prediction {
  matchId: string;
  homeScore: number;
  awayScore: number;
}

export interface Participant {
  userId: string;
  predictions: Prediction[];
  points: number;
}

export interface Quiniela {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  matches: Match[];
  participants: Participant[];
}
