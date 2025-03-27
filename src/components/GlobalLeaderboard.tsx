import React, { useState, useEffect } from 'react';
import { fetchUsers } from '../utils/api';
import { useQuiniela } from '../context/QuinielaContext';
import { User } from '../types';

type UserStatsType = {
  userId: string;
  userName: string;
  totalPoints: number;
  quinielasParticipated: number;
};

const GlobalLeaderboard: React.FC = () => {
  const { quinielas } = useQuiniela();
  const [userStats, setUserStats] = useState<UserStatsType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const calculateUserStats = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch all users from the API
        const users = await fetchUsers();
        const userMap: Record<string, User> = {};
        users.forEach(user => {
          userMap[user.id] = user;
        });
        
        // Calculate stats for each user
        const stats: Record<string, UserStatsType> = {};
        
        // Loop through all quinielas to collect points data
        quinielas.forEach(quiniela => {
          quiniela.participants.forEach(participant => {
            const userId = participant.userId;
            const userName = userMap[userId]?.name || 'Usuario desconocido';
            const points = participant.points || 0;
            
            if (!stats[userId]) {
              stats[userId] = {
                userId,
                userName,
                totalPoints: 0,
                quinielasParticipated: 0
              };
            }
            
            stats[userId].totalPoints += points;
            stats[userId].quinielasParticipated += 1;
          });
        });
        
        // Convert to array and sort by total points (descending)
        const sortedStats = Object.values(stats).sort((a, b) => 
          b.totalPoints - a.totalPoints
        );
        
        setUserStats(sortedStats);
      } catch (err) {
        console.error('Error calculating global stats:', err);
        setError('No se pudieron cargar las estadísticas globales');
      } finally {
        setIsLoading(false);
      }
    };
    
    calculateUserStats();
  }, [quinielas]);
  
  if (isLoading) {
    return <div className="text-center py-6">Cargando estadísticas globales...</div>;
  }
  
  if (error) {
    return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>;
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Tabla de Clasificación Global</h3>
      
      {userStats.length === 0 ? (
        <p className="text-gray-500">No hay datos de puntuación disponibles.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">Posición</th>
                <th className="px-4 py-2 text-left">Nombre</th>
                <th className="px-4 py-2 text-center">Quinielas</th>
                <th className="px-4 py-2 text-center">Puntos Totales</th>
              </tr>
            </thead>
            <tbody>
              {userStats.map((stat, index) => (
                <tr key={stat.userId} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {index + 1}
                    {index === 0 && <span className="ml-2 text-yellow-500">👑</span>}
                  </td>
                  <td className="px-4 py-3">{stat.userName}</td>
                  <td className="px-4 py-3 text-center">{stat.quinielasParticipated}</td>
                  <td className="px-4 py-3 text-center font-semibold">{stat.totalPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GlobalLeaderboard;
