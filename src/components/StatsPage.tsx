import React from 'react';
import GlobalLeaderboard from './GlobalLeaderboard';
import QuinielaPointsChart from './QuinielaPointsChart';
import UserPerformanceChart from './UserPerformanceChart';
import { useAuth } from '../context/AuthContext';

const StatsPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Estadísticas</h2>

      {user && <UserPerformanceChart />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlobalLeaderboard />
        <QuinielaPointsChart />
      </div>
    </div>
  );
};

export default StatsPage;
