import React, { useState, useEffect } from 'react';
import { useQuiniela } from '../context/QuinielaContext';

type QuinielaStatsType = {
  id: string;
  name: string;
  totalPoints: number;
  participantsCount: number;
  averagePoints: number;
};

const QuinielaPointsChart: React.FC = () => {
  const { quinielas } = useQuiniela();
  const [quinielaStats, setQuinielaStats] = useState<QuinielaStatsType[]>([]);

  useEffect(() => {
    // Calculate stats for each quiniela
    const stats = quinielas.map(quiniela => {
      const totalPoints = quiniela.participants.reduce(
        (sum, participant) => sum + (participant.points || 0), 
        0
      );
      
      const participantsCount = quiniela.participants.length;
      const averagePoints = participantsCount > 0 
        ? Math.round((totalPoints / participantsCount) * 10) / 10 
        : 0;
      
      return {
        id: quiniela.id,
        name: quiniela.name,
        totalPoints,
        participantsCount,
        averagePoints
      };
    });
    
    // Sort by total points (descending)
    const sortedStats = [...stats].sort((a, b) => b.totalPoints - a.totalPoints);
    setQuinielaStats(sortedStats);
  }, [quinielas]);

  // Find the maximum points to scale the bars
  const maxPoints = Math.max(...quinielaStats.map(q => q.totalPoints), 1);
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Puntos por Quiniela</h3>
      
      {quinielaStats.length === 0 ? (
        <p className="text-gray-500">No hay datos disponibles para mostrar.</p>
      ) : (
        <div className="space-y-4">
          {quinielaStats.map(stat => (
            <div key={stat.id} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium truncate max-w-[220px]">{stat.name}</span>
                <span>{stat.totalPoints} pts ({stat.participantsCount} participantes)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div 
                  className="bg-blue-600 h-4 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(stat.totalPoints / maxPoints) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-end text-xs text-gray-500">
                Promedio: {stat.averagePoints} pts/participante
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-6 text-xs text-gray-500">
        <p>Este gráfico muestra la suma total de puntos acumulados en cada quiniela.</p>
        <p>Las quinielas con más participantes o partidos suelen mostrar totales más altos.</p>
      </div>
    </div>
  );
};

export default QuinielaPointsChart;
