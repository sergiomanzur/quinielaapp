import React, { useState, useEffect } from 'react';
import { useQuiniela } from '../context/QuinielaContext';
import { Match, Participant, Prediction, User } from '../types';
import { formatDateCST } from '../utils/dateUtils';
import { calculatePredictionPoints } from '../utils/helpers';
import { fetchUsers } from '../utils/api';

const AllPredictionsView: React.FC = () => {
  const { currentQuiniela } = useQuiniela();
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [userMap, setUserMap] = useState<Record<string, User>>({});

  useEffect(() => {
    // Load users from API to map user IDs to names
    const loadUsers = async () => {
      try {
        const users = await fetchUsers();
        const map: Record<string, User> = {};
        users.forEach(user => {
          map[user.id] = user;
        });
        setUserMap(map);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };

    loadUsers();
  }, []);

  if (!currentQuiniela) return null;

  // Find a match by ID
  const findMatch = (matchId: string): Match | undefined => {
    return currentQuiniela.matches.find(m => m.id === matchId);
  };

  // Check if a match has results
  const matchHasResults = (match: Match): boolean => {
    return match.homeScore !== undefined && match.homeScore !== null && 
           match.awayScore !== undefined && match.awayScore !== null;
  };

  // Toggle selected participant
  const toggleParticipant = (userId: string) => {
    if (selectedParticipant === userId) {
      setSelectedParticipant(null);
    } else {
      setSelectedParticipant(userId);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Predicciones de Todos los Participantes</h3>

      {currentQuiniela.participants.length === 0 ? (
        <p className="text-gray-500">No hay participantes en esta quiniela.</p>
      ) : (
        <div className="space-y-4">
          {currentQuiniela.participants.map(participant => (
            <div key={participant.userId} className="border rounded-md overflow-hidden">
              <div
                onClick={() => toggleParticipant(participant.userId)}
                className="bg-gray-100 p-3 flex justify-between items-center cursor-pointer hover:bg-gray-200"
              >
                <div>
                  <span className="font-medium">
                    {userMap[participant.userId]?.name || 'Usuario desconocido'}
                  </span>
                  <span className="ml-2 text-sm text-gray-600">
                    ({participant.predictions.length} predicciones)
                  </span>
                  <span className="ml-2 text-sm text-gray-600">
                    ({participant.points} puntos)
                  </span>
                </div>
                <span>{selectedParticipant === participant.userId ? '▼' : '▶'}</span>
              </div>

              {selectedParticipant === participant.userId && (
                <div className="p-3">
                  {participant.predictions.length === 0 ? (
                    <p className="text-gray-500 text-sm">Este participante no ha hecho predicciones.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-2 py-1 text-left">Partido</th>
                            <th className="px-2 py-1 text-center">Predicción</th>
                            <th className="px-2 py-1 text-center">Resultado Real</th>
                            <th className="px-2 py-1 text-center">Puntos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {participant.predictions.map(prediction => {
                            const match = findMatch(prediction.matchId);
                            if (!match) return null;

                            const hasResults = matchHasResults(match);
                            const points = hasResults ? calculatePredictionPoints(prediction, match) : 0;

                            return (
                              <tr key={prediction.matchId} className="border-t hover:bg-gray-50">
                                <td className="px-2 py-1">
                                  <div>{match.homeTeam} vs {match.awayTeam}</div>
                                  <div className="text-xs text-gray-500">{formatDateCST(match.date)}</div>
                                </td>
                                <td className="px-2 py-1 text-center">
                                  {prediction.homeScore} - {prediction.awayScore}
                                </td>
                                <td className="px-2 py-1 text-center">
                                  {hasResults
                                    ? `${match.homeScore} - ${match.awayScore}`
                                    : 'Pendiente'}
                                </td>
                                <td className="px-2 py-1 text-center">
                                  {hasResults ? points : '-'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllPredictionsView;
