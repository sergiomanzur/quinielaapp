import React, { useState, useEffect } from 'react';
import { useQuiniela } from '../context/QuinielaContext';
import { useAuth } from '../context/AuthContext';
import { calculatePredictionPoints } from '../utils/helpers';

type UserGlobalStats = {
  totalPoints: number;
  exactScores: number;
  correctPredictions: number;
  totalPredicted: number;
  bestPosition: number;
};

type UserQuinielaPerformance = {
  id: string;
  name: string;
  userPoints: number;
  leaderPoints: number;
  position: number;
  totalParticipants: number;
};

const POSITION_LABELS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

const UserPerformanceChart: React.FC = () => {
  const { quinielas } = useQuiniela();
  const { user } = useAuth();
  const [globalStats, setGlobalStats] = useState<UserGlobalStats | null>(null);
  const [performance, setPerformance] = useState<UserQuinielaPerformance[]>([]);

  useEffect(() => {
    if (!user) return;

    let totalPoints = 0;
    let exactScores = 0;
    let correctPredictions = 0;
    let totalPredicted = 0;
    let bestPosition = Infinity;

    const perfData: UserQuinielaPerformance[] = [];

    quinielas.forEach(quiniela => {
      const participant = quiniela.participants.find(p => p.userId === user.id);
      if (!participant) return;

      const userPoints = participant.points || 0;
      totalPoints += userPoints;

      participant.predictions.forEach(prediction => {
        const match = quiniela.matches.find(m => m.id === prediction.matchId);
        if (
          !match ||
          match.homeScore === undefined || match.homeScore === null ||
          match.awayScore === undefined || match.awayScore === null
        ) return;

        totalPredicted++;
        const pts = calculatePredictionPoints(prediction, match);
        if (pts === 4) exactScores++;
        if (pts > 0) correctPredictions++;
      });

      const sorted = [...quiniela.participants].sort(
        (a, b) => (b.points || 0) - (a.points || 0)
      );
      const position = sorted.findIndex(p => p.userId === user.id) + 1;
      const leaderPoints = sorted.length > 0 ? (sorted[0].points || 0) : 0;

      if (position > 0 && position < bestPosition) bestPosition = position;

      perfData.push({
        id: quiniela.id,
        name: quiniela.name,
        userPoints,
        leaderPoints,
        position,
        totalParticipants: quiniela.participants.length,
      });
    });

    setGlobalStats({
      totalPoints,
      exactScores,
      correctPredictions,
      totalPredicted,
      bestPosition: bestPosition === Infinity ? 0 : bestPosition,
    });

    setPerformance(perfData);
  }, [quinielas, user]);

  if (!user || !globalStats) return null;

  const accuracy = globalStats.totalPredicted > 0
    ? Math.round((globalStats.correctPredictions / globalStats.totalPredicted) * 100)
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Mi Rendimiento</h3>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-700">{globalStats.totalPoints}</div>
          <div className="text-xs text-blue-500 mt-0.5">Puntos totales</div>
        </div>
        <div className="bg-amber-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-amber-600">{globalStats.exactScores}</div>
          <div className="text-xs text-amber-500 mt-0.5">Marcadores exactos</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{accuracy}%</div>
          <div className="text-xs text-green-500 mt-0.5">% Acierto</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {globalStats.bestPosition > 0 ? `#${globalStats.bestPosition}` : '—'}
          </div>
          <div className="text-xs text-purple-500 mt-0.5">Mejor posición</div>
        </div>
      </div>

      {/* Per-quiniela breakdown */}
      {performance.length === 0 ? (
        <p className="text-gray-500 text-sm">No has participado en ninguna quiniela todavía.</p>
      ) : (
        <div className="space-y-3">
          {performance.map(p => {
            const pct = p.leaderPoints > 0
              ? Math.round((p.userPoints / p.leaderPoints) * 100)
              : 0;
            const posLabel = POSITION_LABELS[p.position] ?? `#${p.position}`;
            const isLeading = p.position === 1;

            return (
              <div key={p.id}>
                <div className="flex justify-between items-center mb-1 text-sm">
                  <span className="font-medium truncate mr-2">{p.name}</span>
                  <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
                    <span className="font-semibold">{posLabel}</span>
                    <span className="text-gray-600">{p.userPoints} pts</span>
                    {!isLeading && p.leaderPoints > 0 && (
                      <span className="text-gray-400">· líder {p.leaderPoints}</span>
                    )}
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      p.position === 1 ? 'bg-amber-400' :
                      p.position <= 3 ? 'bg-green-400' :
                      'bg-blue-400'
                    }`}
                    style={{ width: `${Math.max(pct, p.userPoints > 0 ? 3 : 0)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserPerformanceChart;
