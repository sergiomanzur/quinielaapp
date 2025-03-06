export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  homeScore?: number;
  awayScore?: number;
}

export interface Quiniela {
  id: string;
  name: string;
  matches: Match[];
  createdAt: string;
  participants: Participant[];
  createdBy: string; // Add createdBy field to track ownership
}

export interface Prediction {
  matchId: string;
  homeScore: number;
  awayScore: number;
}

export interface Participant {
  userId: string;  // Reference to the user
  predictions: Prediction[];
  points?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // In a real app, this would be hashed
  role: 'admin' | 'user';
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}
