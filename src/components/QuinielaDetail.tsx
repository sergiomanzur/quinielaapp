import React, { useEffect } from 'react';
import { useQuiniela } from '../context/QuinielaContext';
import { useAuth } from '../context/AuthContext';
import MatchForm from './MatchForm';
import MatchList from './MatchList';
import ParticipantForm from './ParticipantForm';
import ParticipantList from './ParticipantList';
import UserPredictions from './UserPredictions';
import ScoreSystemInfo from './ScoreSystemInfo';
import AllPredictionsView from './AllPredictionsView';
import { formatDateCST } from '../utils/dateUtils';

const QuinielaDetail: React.FC = () => {
  const { currentQuiniela, setCurrentQuiniela, canEditQuiniela, leaveQuiniela, calculateResults, refreshCurrentQuiniela } = useQuiniela();
  const { user } = useAuth();

  // Refresh data when component mounts
  useEffect(() => {
    // Refresh the current quiniela data when the component mounts
    if (currentQuiniela) {
      refreshCurrentQuiniela();
    }
  }, [currentQuiniela?.id]); // Only refresh when the quiniela ID changes

  if (!currentQuiniela) return null;

  const isAdmin = canEditQuiniela(currentQuiniela);
  const isCreator = currentQuiniela.createdBy === user?.id;
  const isParticipant = currentQuiniela.participants.some(p => p.userId === user?.id);

  const handleBack = () => {
    // Just set current quiniela to null to go back to the list
    setCurrentQuiniela(null);
  };

  const handleDelete = async () => {
    if (window.confirm('¿Estás seguro de eliminar esta quiniela? Esta acción eliminará todos los partidos y predicciones asociados y no se puede deshacer.')) {
      try {
        if (currentQuiniela) {
          //await deleteQuiniela(currentQuiniela.id);
          setCurrentQuiniela(null);
        }
      } catch (error) {
        console.error("Error deleting quiniela:", error);
        alert("Error al eliminar la quiniela. Por favor intenta de nuevo.");
      }
    }
  };

  const handleLeave = () => {
    if (window.confirm('¿Estás seguro de abandonar esta quiniela?')) {
      leaveQuiniela();
      setCurrentQuiniela(null);
    }
  };

  const handleCalculateResults = () => {
    if (window.confirm('¿Calcular los resultados para todos los participantes?')) {
      calculateResults();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={handleBack}
          className="text-blue-600 hover:underline flex items-center"
        >
          ← Volver
        </button>

        <div className="flex gap-2">
          {isAdmin && (
            <button
              onClick={handleCalculateResults}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
            >
              <span>🏆</span> Calcular Resultados
            </button>
          )}
          {/* {isParticipant && !isCreator && (
            <button
              onClick={handleLeave}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              Abandonar
            </button>
          )} */}
          {isCreator && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Eliminar
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold mb-2">{currentQuiniela.name}</h2>
        <div className="flex justify-between items-start">
          <p className="text-gray-600 text-sm">
            Creada: {formatDateCST(currentQuiniela.createdAt)}
          </p>
        </div>

        {/* Show scoring system info in the quiniela details */}
        <div className="mt-4 border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Reglas de puntuación:</h3>
          <ScoreSystemInfo />
        </div>
      </div>

      <ParticipantForm />

      {isAdmin && <MatchForm />}

      <MatchList />

      {isParticipant && <UserPredictions />}

      <ParticipantList />

      <AllPredictionsView />
    </div>
  );
};

export default QuinielaDetail;
