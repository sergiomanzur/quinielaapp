import React from 'react';
import { useQuiniela } from '../context/QuinielaContext';
import { Match, Prediction } from '../types';
import { calculatePredictionPoints, arePredictionsAllowed } from '../utils/helpers';
import { formatDateCST } from '../utils/dateUtils';

const UserPredictions: React.FC = () => {
  const { currentQuiniela, updatePrediction, getCurrentUserParticipant } = useQuiniela();
  
  if (!currentQuiniela) return null;
  
  const participant = getCurrentUserParticipant();
  if (!participant) return null;

  const handlePredictionChange = (match: Match, homeScore: string, awayScore: string) => {
    // Convert to numbers
    const homeScoreNum = parseInt(homeScore, 10);
    const awayScoreNum = parseInt(awayScore, 10);
    
    // Only update if both scores are valid numbers
    if (!isNaN(homeScoreNum) && !isNaN(awayScoreNum)) {
      const prediction: Prediction = {
        matchId: match.id,
        homeScore: homeScoreNum,
        awayScore: awayScoreNum
      };
      
      updatePrediction(prediction);
    }
  };

  // Check if the match date has already passed
  const isMatchLocked = (match: Match): boolean => {
    const matchDate = new Date(match.date);
    return matchDate < new Date();
  };

  // Get existing prediction for a match
  const getPrediction = (matchId: string) => {
    return participant.predictions.find(p => p.matchId === matchId);
  };

  const predictionsAllowed = arePredictionsAllowed(currentQuiniela.matches);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Mis Predicciones</h3>
      
      {!predictionsAllowed && (
        <div className="mb-4 p-2 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded">
          Ya no es posible hacer predicciones para esta quiniela.
        </div>
      )}
      
      {currentQuiniela.matches.length === 0 ? (
        <p className="text-gray-500">No hay partidos disponibles para predecir.</p>
      ) : (
        <div className="space-y-4">
          {currentQuiniela.matches.map(match => {
            const prediction = getPrediction(match.id);
            const locked = isMatchLocked(match) || !predictionsAllowed;
            
            return (
              <div key={match.id} className={`border ${locked ? 'bg-gray-100' : ''} rounded-lg p-4`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">
                    {formatDateCST(match.date)}
                  </span>
                  {locked && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                      Cerrado
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex-1 text-right">
                    <p>{match.homeTeam}</p>
                  </div>
                  
                  <div className="flex items-center justify-center mx-4">
                    <input
                      type="number"
                      min="0"
                      value={prediction?.homeScore ?? ''}
                      onChange={(e) => handlePredictionChange(match, e.target.value, prediction?.awayScore?.toString() || '0')}
                      className="w-12 h-10 text-center border rounded mx-1"
                      disabled={locked}
                      placeholder="0"
                    />
                    <span className="mx-2">-</span>
                    <input
                      type="number"
                      min="0"
                      value={prediction?.awayScore ?? ''}
                      onChange={(e) => handlePredictionChange(match, prediction?.homeScore?.toString() || '0', e.target.value)}
                      className="w-12 h-10 text-center border rounded mx-1"
                      disabled={locked}
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <p>{match.awayTeam}</p>
                  </div>
                </div>
                
                {match.homeScore !== undefined && match.awayScore !== undefined && prediction && (
                  <div className="mt-2 text-center">
                    <div className="text-sm font-semibold">
                      Resultado: {match.homeScore} - {match.awayScore}
                    </div>
                    <div className="mt-1">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${getPointsClass(calculatePredictionPoints(prediction, match))}`}>
                        {getPointsText(calculatePredictionPoints(prediction, match))}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      <div className="mt-6">
        <h4 className="text-sm font-semibold mb-2">Sistema de puntuación:</h4>
        <ul className="list-disc pl-5 text-xs text-gray-600">
          <li>4 puntos por acertar el resultado exacto</li>
          <li>3 puntos por acertar victoria visitante</li>
          <li>2 puntos por acertar empate</li>
          <li>1 punto por acertar victoria local</li>
        </ul>
      </div>
      
      <p className="text-xs text-gray-500 mt-3">
        Nota: Las predicciones solo están disponibles hasta un día antes del primer partido.
      </p>
    </div>
  );
};

// Helper function to get CSS class for points display
const getPointsClass = (points: number): string => {
  switch(points) {
    case 4: return "bg-purple-100 text-purple-800";
    case 3: return "bg-green-100 text-green-800";
    case 2: return "bg-blue-100 text-blue-800";
    case 1: return "bg-yellow-100 text-yellow-800";
    default: return "bg-red-100 text-red-800";
  }
};

// Helper function to get text for points display
const getPointsText = (points: number): string => {
  switch(points) {
    case 4: return `¡${points} puntos! (Resultado exacto)`;
    case 3: return `${points} puntos (Victoria visitante)`;
    case 2: return `${points} puntos (Empate)`;
    case 1: return `${points} punto (Victoria local)`;
    default: return "0 puntos";
  }
};

export default UserPredictions;
