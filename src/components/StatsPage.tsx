import React from 'react';
import GlobalLeaderboard from './GlobalLeaderboard';
import QuinielaPointsChart from './QuinielaPointsChart';
import UserPerformanceChart from './UserPerformanceChart';
import { useAuth } from '../context/AuthContext';

const StatsPage: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Estadísticas</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlobalLeaderboard />
        <QuinielaPointsChart />
      </div>
      
      {user && <UserPerformanceChart />}
    </div>
  );
};

export default StatsPage;
