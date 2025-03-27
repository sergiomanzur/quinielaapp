import React, { useState, useEffect } from 'react';
import { useQuiniela } from '../context/QuinielaContext';
import { useAuth } from '../context/AuthContext';

type UserQuinielaPerformance = {
  id: string;
  name: string;
  userPoints: number;
  maxPoints: number;
  position: number;
  totalParticipants: number;
};

const UserPerformanceChart: React.FC = () => {
  const { quinielas } = useQuiniela();
  const { user } = useAuth();
  const [performance, setPerformance] = useState<UserQuinielaPerformance[]>([]);

  useEffect(() => {
    if (!user) return;
    
    // Find quinielas where the current user participates
    const userQuinielas = quinielas.filter(quiniela => 
      quiniela.participants.some(p => p.userId === user.id)
    );
    
    // Calculate user performance for each quiniela
    const performanceData = userQuinielas.map(quiniela => {
      const userParticipant = quiniela.participants.find(p => p.userId === user.id);
      const userPoints = userParticipant?.points || 0;
      
      // Sort participants by points to find position
      const sortedParticipants = [...quiniela.participants].sort(
        (a, b) => (b.points || 0) - (a.points || 0)
      );
      
      const position = sortedParticipants.findIndex(p => p.userId === user.id) + 1;
      const maxPoints = sortedParticipants.length > 0 ? (sortedParticipants[0].points || 0) : 0;
      
      return {
        id: quiniela.id,
        name: quiniela.name,
        userPoints,
        maxPoints,
        position,
        totalParticipants: quiniela.participants.length
      };
    });
    
    // Sort by user points (descending)
    const sortedPerformance = [...performanceData].sort(
      (a, b) => b.userPoints - a.userPoints
    );
    
    setPerformance(sortedPerformance);
  }, [quinielas, user]);

  if (!user) {
    return null;
  }
  
  // Find the maximum points for scaling
  const chartMaxPoints = Math.max(...performance.map(p => Math.max(p.userPoints, p.maxPoints)), 1);
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Mi Rendimiento en Quinielas</h3>
      
      {performance.length === 0 ? (
        <p className="text-gray-500">No has participado en ninguna quiniela todavía.</p>
      ) : (
        <div className="space-y-6">
          {performance.map(p => (
            <div key={p.id} className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">{p.name}</span>
                <span className="text-sm">
                  Posición: {p.position}/{p.totalParticipants} • {p.userPoints} pts
                </span>
              </div>
              
              <div className="relative w-full pt-5">
                {/* Leader bar (if not the user) */}
                {p.maxPoints > p.userPoints && (
                  <div className="absolute top-0 left-0 text-xs text-gray-500">
                    Líder: {p.maxPoints} pts
                  </div>
                )}
                
                {/* Max points bar (gray background) */}
                <div className="w-full bg-gray-200 rounded-full h-4">
                  {/* Leader bar */}
                  <div 
                    className="bg-gray-400 h-4 rounded-full"
                    style={{ width: `${(p.maxPoints / chartMaxPoints) * 100}%` }}
                  ></div>
                </div>
                
                {/* User points bar */}
                <div 
                  className="bg-green-600 h-4 rounded-full absolute top-5"
                  style={{ width: `${(p.userPoints / chartMaxPoints) * 100}%` }}
                ></div>
                
                {/* User label */}
                <div className="absolute left-0 text-xs text-green-700">
                  Tus puntos: {p.userPoints}
                </div>
              </div>
              
              {/* Position indicator */}
              <div className="text-right text-xs">
                {p.position === 1 ? (
                  <span className="text-yellow-600 font-semibold">¡Vas en primer lugar! 🏆</span>
                ) : p.position <= 3 ? (
                  <span className="text-green-600">¡Estás en el podio!</span>
                ) : p.position === p.totalParticipants ? (
                  <span className="text-red-600">Última posición</span>
                ) : (
                  <span className="text-gray-600">
                    Te faltan {p.maxPoints - p.userPoints} puntos para alcanzar al líder
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserPerformanceChart;
