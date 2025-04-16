import React, { useState, useEffect, useRef } from 'react';
import { useQuiniela } from '../context/QuinielaContext';
import { Match, Prediction } from '../types';
import { calculatePredictionPoints, arePredictionsAllowed } from '../utils/helpers';
import { formatDateCST } from '../utils/dateUtils';

const UserPredictions: React.FC = () => {
  const { currentQuiniela, updatePrediction, getCurrentUserParticipant } = useQuiniela();
  const [tempPredictions, setTempPredictions] = useState<Record<string, {homeScore: string, awayScore: string}>>({});
  const [savedPredictions, setSavedPredictions] = useState<Record<string, boolean>>({});
  const [isEditing, setIsEditing] = useState(false);
  const isInitialRender = useRef(true);

  if (!currentQuiniela) return null;
  
  const participant = getCurrentUserParticipant();
  if (!participant) return null;

  // Initialize temp predictions from existing predictions
  useEffect(() => {
    const initialPredictions: Record<string, {homeScore: string, awayScore: string}> = {};

    currentQuiniela.matches.forEach(match => {
      const existingPrediction = participant.predictions.find(p => p.matchId === match.id);

      // Keep current temp prediction if it exists and hasn't been saved yet
      const currentTempPrediction = tempPredictions[match.id];
      const savedStatus = savedPredictions[match.id];

      // Don't override fields user is currently editing
      if (isEditing && currentTempPrediction && !savedStatus) {
        initialPredictions[match.id] = currentTempPrediction;
      }
      else if (existingPrediction) {
        // If we have an existing prediction in the database
        initialPredictions[match.id] = {
          homeScore: existingPrediction.homeScore.toString(),
          awayScore: existingPrediction.awayScore.toString()
        };
      }
      else if (currentTempPrediction && !savedStatus) {
        // If we have a temporary unsaved prediction, keep it
        initialPredictions[match.id] = currentTempPrediction;
      }
      else {
        // Otherwise start with empty values
        initialPredictions[match.id] = {
          homeScore: '',
          awayScore: ''
        };
      }
    });

    setTempPredictions(initialPredictions);
  }, [currentQuiniela.matches, participant.predictions]);

  // Update local state without saving
  const handleInputChange = (matchId: string, field: 'homeScore' | 'awayScore', value: string) => {
    // Mark that user is currently editing
    setIsEditing(true);

    setTempPredictions(prev => ({
      ...prev,
      [matchId]: {
        ...(prev[matchId] || { homeScore: '', awayScore: '' }),
        [field]: value
      }
    }));

    // Clear saved status when input changes
    setSavedPredictions(prev => ({
      ...prev,
      [matchId]: false
    }));
  };

  // Save prediction to database
  const handleSavePrediction = (matchId: string) => {
    const prediction = tempPredictions[matchId];
    
    if (!prediction) return;
    
    const homeScoreNum = parseInt(prediction.homeScore, 10);
    const awayScoreNum = parseInt(prediction.awayScore, 10);
    
    if (!isNaN(homeScoreNum) && !isNaN(awayScoreNum)) {
      updatePrediction({
        matchId,
        homeScore: homeScoreNum,
        awayScore: awayScoreNum
      });
      
      // Set saved status
      setSavedPredictions(prev => ({
        ...prev,
        [matchId]: true
      }));
      
      // Reset editing status
      setIsEditing(false);
      
      // Clear saved status after a delay
      setTimeout(() => {
        setSavedPredictions(prev => ({
          ...prev,
          [matchId]: false
        }));
      }, 3000);
    }
  };

  // Handle focus and blur for inputs
  const handleInputFocus = () => {
    setIsEditing(true);
  };

  const handleInputBlur = () => {
    // Small timeout to allow for clicking the save button
    setTimeout(() => {
      setIsEditing(false);
    }, 200);
  };

  // Check if the match date has already passed
  const isMatchLocked = (match: Match): boolean => {
    const matchDate = new Date(match.date);
    return matchDate < new Date();
  };

  // Check if match has results (both home and away scores are defined)
  const matchHasResults = (match: Match): boolean => {
    return match.homeScore !== undefined && match.homeScore !== null && 
           match.awayScore !== undefined && match.awayScore !== null;
  };

  // Get existing prediction for a match
  const getPrediction = (matchId: string) => {
    return participant.predictions.find(p => p.matchId === matchId);
  };

  const predictionsAllowed = arePredictionsAllowed(currentQuiniela.matches);

  // Helper functions for displaying points
  const getPointsClass = (points: number) => {
    if (points === 0) return 'bg-red-100 text-red-800';
    if (points === 1) return 'bg-yellow-100 text-yellow-800';
    if (points === 2) return 'bg-orange-100 text-orange-800';
    if (points === 3) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  const getPointsText = (points: number) => {
    if (points === 0) return '0 pts';
    if (points === 1) return '1 pt';
    return `${points} pts`;
  };

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
            const hasResults = matchHasResults(match);
            const tempPrediction = tempPredictions[match.id] || { homeScore: '', awayScore: '' };
            const isSaved = savedPredictions[match.id];

            return (
              <div key={match.id} className={`border ${locked ? 'bg-gray-100' : ''} rounded-lg p-4`}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-500">{formatDateCST(match.date)}</span>
                  {isSaved && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Guardado
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex-1 text-right">
                    <p className="font-medium">{match.homeTeam}</p>
                  </div>
                  
                  <div className="flex items-center justify-center mx-4">
                    {!locked ? (
                      <div className="flex items-center">
                        <input
                          type="number"
                          min="0"
                          value={tempPrediction.homeScore}
                          onChange={(e) => handleInputChange(match.id, 'homeScore', e.target.value)}
                          onFocus={handleInputFocus}
                          onBlur={handleInputBlur}
                          className="w-12 h-10 text-center border rounded mx-1"
                        />
                        <span className="mx-2">-</span>
                        <input
                          type="number"
                          min="0"
                          value={tempPrediction.awayScore}
                          onChange={(e) => handleInputChange(match.id, 'awayScore', e.target.value)}
                          onFocus={handleInputFocus}
                          onBlur={handleInputBlur}
                          className="w-12 h-10 text-center border rounded mx-1"
                        />
                      </div>
                    ) : (
                      <div className="text-xl font-bold">
                        {prediction 
                          ? `${prediction.homeScore} - ${prediction.awayScore}`
                          : "No predicción"}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-medium">{match.awayTeam}</p>
                  </div>
                </div>
                
                {!locked && (
                  <div className="mt-3 flex justify-center">
                    <button
                      onClick={() => handleSavePrediction(match.id)}
                      disabled={
                        tempPrediction.homeScore === '' || 
                        tempPrediction.awayScore === ''
                      }
                      className="px-4 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Guardar Predicción
                    </button>
                  </div>
                )}
                
                {/* Only show results and points if the match has actual results */}
                {hasResults && prediction ? (
                  <div className="mt-3 bg-gray-50 p-2 rounded flex justify-between items-center">
                    <div className="text-sm">
                      <span className="text-gray-600">Resultado:</span> 
                      <span className="font-semibold ml-1">
                        {match.homeScore} - {match.awayScore}
                      </span>
                    </div>
                    <div>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${getPointsClass(calculatePredictionPoints(prediction, match))}`}>
                        {getPointsText(calculatePredictionPoints(prediction, match))}
                      </span>
                    </div>
                  </div>
                ) : null}
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

export default UserPredictions;
