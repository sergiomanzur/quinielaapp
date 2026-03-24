import React, { useState, useEffect } from 'react';
import { fetchUsers } from '../utils/api';
import { useQuiniela } from '../context/QuinielaContext';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import { calculatePredictionPoints } from '../utils/helpers';

type UserStatsType = {
  userId: string;
  userName: string;
  totalPoints: number;
  quinielasParticipated: number;
  avgPoints: number;
  exactScores: number;
  correctPredictions: number;
  totalPredicted: number;
};

const MEDALS = ['🥇', '🥈', '🥉'];

const GlobalLeaderboard: React.FC = () => {
  const { quinielas } = useQuiniela();
  const { user: currentUser } = useAuth();
  const [userStats, setUserStats] = useState<UserStatsType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const calculateStats = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const users = await fetchUsers();
        const userMap: Record<string, User> = {};
        users.forEach(u => { userMap[u.id] = u; });

        const stats: Record<string, UserStatsType> = {};

        quinielas.forEach(quiniela => {
          quiniela.participants.forEach(participant => {
            const { userId } = participant;
            if (!stats[userId]) {
              stats[userId] = {
                userId,
                userName: userMap[userId]?.name || 'Desconocido',
                totalPoints: 0,
                quinielasParticipated: 0,
                avgPoints: 0,
                exactScores: 0,
                correctPredictions: 0,
                totalPredicted: 0,
              };
            }

            stats[userId].totalPoints += participant.points || 0;
            stats[userId].quinielasParticipated += 1;

            participant.predictions.forEach(prediction => {
              const match = quiniela.matches.find(m => m.id === prediction.matchId);
              if (
                !match ||
                match.homeScore === undefined || match.homeScore === null ||
                match.awayScore === undefined || match.awayScore === null
              ) return;

              stats[userId].totalPredicted++;
              const pts = calculatePredictionPoints(prediction, match);
              if (pts === 4) stats[userId].exactScores++;
              if (pts > 0) stats[userId].correctPredictions++;
            });
          });
        });

        const sorted = Object.values(stats)
          .map(s => ({
            ...s,
            avgPoints: s.quinielasParticipated > 0
              ? Math.round((s.totalPoints / s.quinielasParticipated) * 10) / 10
              : 0,
          }))
          .sort((a, b) => b.totalPoints - a.totalPoints);

        setUserStats(sorted);
      } catch (err) {
        console.error('Error:', err);
        setError('No se pudieron cargar las estadísticas globales');
      } finally {
        setIsLoading(false);
      }
    };

    calculateStats();
  }, [quinielas]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
        Cargando clasificación...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Clasificación Global</h3>

      {userStats.length === 0 ? (
        <p className="text-gray-500">No hay datos de puntuación disponibles.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wide border-b">
                <th className="pb-2 text-left font-medium">#</th>
                <th className="pb-2 text-left font-medium">Jugador</th>
                <th className="pb-2 text-right font-medium">Pts</th>
                <th className="pb-2 text-right font-medium">Avg</th>
                <th className="pb-2 text-right font-medium">⭐ Exactos</th>
                <th className="pb-2 text-right font-medium hidden sm:table-cell">% Acierto</th>
                <th className="pb-2 text-right font-medium hidden md:table-cell">Quinielas</th>
              </tr>
            </thead>
            <tbody>
              {userStats.map((stat, index) => {
                const isMe = currentUser?.id === stat.userId;
                const accuracy = stat.totalPredicted > 0
                  ? Math.round((stat.correctPredictions / stat.totalPredicted) * 100)
                  : 0;
                return (
                  <tr
                    key={stat.userId}
                    className={`border-b last:border-0 transition-colors ${
                      isMe ? 'bg-green-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="py-2.5 pr-2 w-8 font-semibold text-gray-400">
                      {index < 3
                        ? <span className="text-base">{MEDALS[index]}</span>
                        : index + 1}
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${isMe ? 'text-green-700' : ''}`}>
                          {stat.userName}
                        </span>
                        {isMe && (
                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                            tú
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 text-right font-bold text-gray-800">
                      {stat.totalPoints}
                    </td>
                    <td className="py-2.5 text-right text-gray-500">{stat.avgPoints}</td>
                    <td className="py-2.5 text-right text-amber-600 font-medium">
                      {stat.exactScores}
                    </td>
                    <td className="py-2.5 text-right hidden sm:table-cell">
                      <span className={`font-medium ${
                        accuracy >= 60 ? 'text-green-600' :
                        accuracy >= 40 ? 'text-yellow-600' :
                        'text-red-500'
                      }`}>
                        {accuracy}%
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-gray-500 hidden md:table-cell">
                      {stat.quinielasParticipated}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GlobalLeaderboard;
