import React, { useState, useEffect } from 'react';
import { fetchUsers } from '../utils/api';
import { useQuiniela } from '../context/QuinielaContext';
import { User } from '../types';

type QuinielaHistoryType = {
  id: string;
  name: string;
  winnersNames: string[];
  topScore: number;
  participantsCount: number;
  matchesWithResults: number;
  totalMatches: number;
};

const QuinielaPointsChart: React.FC = () => {
  const { quinielas } = useQuiniela();
  const [history, setHistory] = useState<QuinielaHistoryType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const compute = async () => {
      setIsLoading(true);
      try {
        const users = await fetchUsers();
        const userMap: Record<string, User> = {};
        users.forEach(u => { userMap[u.id] = u; });

        const data: QuinielaHistoryType[] = [...quinielas].reverse().map(quiniela => {
          const sorted = [...quiniela.participants].sort(
            (a, b) => (b.points || 0) - (a.points || 0)
          );
          const topScore = sorted.length > 0 ? (sorted[0].points || 0) : 0;
          const winnersNames = topScore > 0
            ? sorted
                .filter(p => (p.points || 0) === topScore)
                .map(p => userMap[p.userId]?.name || 'Desconocido')
            : [];
          const matchesWithResults = quiniela.matches.filter(
            m => m.homeScore !== undefined && m.homeScore !== null
          ).length;

          return {
            id: quiniela.id,
            name: quiniela.name,
            winnersNames,
            topScore,
            participantsCount: quiniela.participants.length,
            matchesWithResults,
            totalMatches: quiniela.matches.length,
          };
        });

        setHistory(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    compute();
  }, [quinielas]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
        Cargando historial...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Historial de Quinielas</h3>

      {history.length === 0 ? (
        <p className="text-gray-500">No hay quinielas disponibles.</p>
      ) : (
        <div className="space-y-3">
          {history.map(q => {
            const progress = q.totalMatches > 0
              ? Math.round((q.matchesWithResults / q.totalMatches) * 100)
              : 0;
            const isFinished = progress === 100;
            const isOngoing = progress > 0 && progress < 100;

            return (
              <div key={q.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-medium text-sm">{q.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">👥 {q.participantsCount}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      isFinished ? 'bg-blue-100 text-blue-700' :
                      isOngoing  ? 'bg-yellow-100 text-yellow-700' :
                                   'bg-gray-100 text-gray-500'
                    }`}>
                      {isFinished ? 'Finalizada' : isOngoing ? 'En curso' : 'Pendiente'}
                    </span>
                  </div>
                </div>

                {q.winnersNames.length > 0 ? (
                  <div className="text-sm text-amber-600 font-medium mb-2">
                    🏆 {q.winnersNames.join(', ')} · {q.topScore} pts
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 mb-2">Sin resultados aún</div>
                )}

                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        isFinished ? 'bg-blue-500' : 'bg-yellow-400'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {q.matchesWithResults}/{q.totalMatches} partidos
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QuinielaPointsChart;
