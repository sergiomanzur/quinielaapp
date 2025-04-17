import React, { useState, useEffect, useRef } from 'react';
import { useQuiniela } from '../context/QuinielaContext';
import { Match, Prediction } from '../types';
import { calculatePredictionPoints, arePredictionsAllowed } from '../utils/helpers';
import { formatDateCST } from '../utils/dateUtils';
import { Save } from 'lucide-react';

const UserPredictions: React.FC = () => {
  const { currentQuiniela, updatePrediction, getCurrentUserParticipant } = useQuiniela();
  const [tempPredictions, setTempPredictions] = useState<Record<string, {homeScore: string, awayScore: string}>>({});
  const [savedPredictions, setSavedPredictions] = useState<Record<string, boolean>>({});
  const [unsavedMatches, setUnsavedMatches] = useState<Set<string>>(new Set());
  const [isEditing, setIsEditing] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const isInitialRender = useRef(true);
  // No longer need saveTimers since we'll save on blur

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

    // Add to unsaved matches
    setUnsavedMatches(prev => new Set([...prev, matchId]));

    // Clear saved status when input changes
    setSavedPredictions(prev => ({
      ...prev,
      [matchId]: false
    }));
    
    // No longer trigger debounced save here - we'll save on blur
  };

  // Save prediction to database on blur
  const handleInputBlur = (matchId: string) => {
    const prediction = tempPredictions[matchId];
    
    if (!prediction) return;
    
    const homeScoreNum = parseInt(prediction.homeScore, 10);
    const awayScoreNum = parseInt(prediction.awayScore, 10);
    
    if (!isNaN(homeScoreNum) && !isNaN(awayScoreNum)) {
      // Add visual feedback while saving
      setSavedPredictions(prev => ({
        ...prev,
        [matchId]: false
      }));
      
      // Show saving indicator
      setUnsavedMatches(prev => new Set([...prev, matchId]));
      
      // Save the prediction - removing the Promise chain since updatePrediction may not return a Promise
      updatePrediction({
        matchId,
        homeScore: homeScoreNum,
        awayScore: awayScoreNum
      });
      
      // Use setTimeout to show saved status after a brief delay
      setTimeout(() => {
        // Set saved status
        setSavedPredictions(prev => ({
          ...prev,
          [matchId]: true
        }));
        
        // Remove from unsaved matches
        setUnsavedMatches(prev => {
          const updated = new Set([...prev]);
          updated.delete(matchId);
          return updated;
        });
        
        // Reset editing status if no unsaved matches remain
        if (unsavedMatches.size <= 1) {
          setIsEditing(false);
        }
        
        // Clear saved status after a delay
        setTimeout(() => {
          setSavedPredictions(prev => ({
            ...prev,
            [matchId]: false
          }));
        }, 3000);
      }, 500); // Short delay to simulate async operation completion
    }
  };

  // Save all predictions at once
  const handleSaveAllPredictions = async () => {
    setSavingAll(true);
    
    try {
      // Save each valid prediction
      const promises = Object.entries(tempPredictions)
        .filter(([, prediction]) => {
          const homeScoreNum = parseInt(prediction.homeScore, 10);
          const awayScoreNum = parseInt(prediction.awayScore, 10);
          return !isNaN(homeScoreNum) && !isNaN(awayScoreNum);
        })
        .map(async ([matchId, prediction]) => {
          await updatePrediction({
            matchId,
            homeScore: parseInt(prediction.homeScore, 10),
            awayScore: parseInt(prediction.awayScore, 10)
          });
          return matchId;
        });
      
      const savedIds = await Promise.all(promises);
      
      // Update saved status for all
      const newSavedStatus: Record<string, boolean> = {};
      savedIds.forEach(id => {
        newSavedStatus[id] = true;
      });
      
      setSavedPredictions(newSavedStatus);
      setUnsavedMatches(new Set());
      setIsEditing(false);
      
      // Clear saved indicators after delay
      setTimeout(() => {
        setSavedPredictions({});
      }, 3000);
    } catch (error) {
      console.error('Error saving all predictions:', error);
    } finally {
      setSavingAll(false);
    }
  };

  // Handle focus event
  const handleInputFocus = () => {
    setIsEditing(true);
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

  // Count how many predictions are entered
  const predictionsCount = Object.values(tempPredictions).reduce((count, prediction) => {
    return (prediction.homeScore !== '' && prediction.awayScore !== '') ? count + 1 : count;
  }, 0);

  // Count how many valid predictions are available to save
  const validPredictionsCount = Object.values(tempPredictions).filter(prediction => {
    const homeScoreNum = parseInt(prediction.homeScore, 10);
    const awayScoreNum = parseInt(prediction.awayScore, 10);
    return !isNaN(homeScoreNum) && !isNaN(awayScoreNum);
  }).length;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Mis Predicciones</h3>
        
        {predictionsAllowed && validPredictionsCount > 0 && (
          <button
            onClick={handleSaveAllPredictions}
            disabled={savingAll}
            className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 flex items-center"
          >
            <Save size={16} className="mr-2" />
            {savingAll ? "Guardando..." : "Guardar Todas"}
          </button>
        )}
      </div>

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
            const isUnsaved = unsavedMatches.has(match.id);

            return (
              <div key={match.id} className={`border ${locked ? 'bg-gray-100' : ''} rounded-lg p-4`}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-500">{formatDateCST(match.date)}</span>
                  {isSaved && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Guardado
                    </span>
                  )}
                  {isUnsaved && !isSaved && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      Guardando...
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
                          inputMode="numeric"
                          min="0"
                          value={tempPrediction.homeScore}
                          onChange={(e) => handleInputChange(match.id, 'homeScore', e.target.value)}
                          onFocus={handleInputFocus}
                          onBlur={() => handleInputBlur(match.id)}
                          className="w-12 h-10 text-center border rounded mx-1 touch-manipulation"
                        />
                        <span className="mx-2">-</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          value={tempPrediction.awayScore}
                          onChange={(e) => handleInputChange(match.id, 'awayScore', e.target.value)}
                          onFocus={handleInputFocus}
                          onBlur={() => handleInputBlur(match.id)}
                          className="w-12 h-10 text-center border rounded mx-1 touch-manipulation"
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
