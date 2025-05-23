import React, { useState, useEffect } from 'react';
import { useQuiniela } from '../context/QuinielaContext';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import { sortParticipantsByPoints } from '../utils/helpers';
import { fetchUsers } from '../utils/api';

const ParticipantList: React.FC = () => {
  const { currentQuiniela, leaveQuiniela } = useQuiniela();
  const { user } = useAuth();
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
  
  // Count finished matches (matches with results)
  const finishedMatches = currentQuiniela.matches.filter(
    m => m.homeScore !== undefined && m.homeScore !== null && 
         m.awayScore !== undefined && m.awayScore !== null
  ).length;
  
  // Sort participants by points (highest first)
  const sortedParticipants = sortParticipantsByPoints(currentQuiniela.participants);
  
  // Find the highest score to identify winners
  const highestScore = sortedParticipants.length > 0 ? sortedParticipants[0].points : 0;
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-2">Tabla de Posiciones</h3>
      
      {finishedMatches === 0 ? (
        <p className="text-sm text-yellow-600 mb-3">
          Aún no hay partidos finalizados para calcular puntos.
        </p>
      ) : (
        <p className="text-sm text-gray-600 mb-3">
          Puntos calculados para {finishedMatches} de {currentQuiniela.matches.length} partidos.
        </p>
      )}
      
      {sortedParticipants.length === 0 ? (
        <p className="text-gray-500">No hay participantes en esta quiniela.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">Posición</th>
                <th className="px-4 py-2 text-left">Nombre</th>
                <th className="px-4 py-2 text-center">Puntos</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {sortedParticipants.map((participant, index) => {
                const participantUser = userMap[participant.userId];
                const isCurrentUser = participant.userId === user?.id;
                const isWinner = participant.points === highestScore && highestScore > 0;
                
                return (
                  <tr 
                    key={participant.userId} 
                    className={`border-t ${isWinner ? 'bg-yellow-50' : isCurrentUser ? 'bg-green-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      {index + 1}
                      {index === 0 && highestScore > 0 && (
                        <span className="ml-2 text-yellow-500">👑</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {participantUser?.name || 'Usuario desconocido'}
                      {isCurrentUser && <span className="ml-2 text-xs text-gray-500">(Tú)</span>}
                      {isWinner && participant.points > 0 && (
                        <span className="ml-2 text-xs font-bold text-yellow-600">¡Ganador!</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold">{participant.points}</td>
                    <td className="px-4 py-3 text-right">
                      {isCurrentUser && currentQuiniela.createdBy !== user.id && (
                        <button
                          onClick={() => window.confirm('¿Estás seguro de abandonar esta quiniela?') && leaveQuiniela()}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Abandonar
                        </button>
                      )}
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

export default ParticipantList;
