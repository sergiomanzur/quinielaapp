import React, { useState } from 'react';
import { useQuiniela } from '../context/QuinielaContext';
import { Match } from '../types';
import { arePredictionsAllowed } from '../utils/helpers';
import { formatDateCST } from '../utils/dateUtils';
import { updateMatchResult } from '../utils/api';

const MatchList: React.FC = () => {
  const { currentQuiniela, updateMatch, canEditQuiniela } = useQuiniela();
  const [editMatchId, setEditMatchId] = useState<string | null>(null);
  const [homeScore, setHomeScore] = useState<string>('');
  const [awayScore, setAwayScore] = useState<string>('');
  
  if (!currentQuiniela) return null;
  
  const isAdmin = canEditQuiniela(currentQuiniela);
  
  const handleEditResult = (match: Match) => {
    setEditMatchId(match.id);
    // Fix: Use empty string as default when homeScore/awayScore is null or undefined
    setHomeScore(match.homeScore !== undefined && match.homeScore !== null ? match.homeScore.toString() : '');
    setAwayScore(match.awayScore !== undefined && match.awayScore !== null ? match.awayScore.toString() : '');
  };
  
  const handleSaveResult = async (matchId: string) => {
    const homeScoreNum = parseInt(homeScore, 10);
    const awayScoreNum = parseInt(awayScore, 10);
    
    if (!isNaN(homeScoreNum) && !isNaN(awayScoreNum)) {
      try {
        // Use the new API endpoint to update match result
        await updateMatchResult(matchId, homeScoreNum, awayScoreNum);
        
        // Update the local state to reflect the change
        const matchToUpdate = currentQuiniela.matches.find(m => m.id === matchId);
        if (matchToUpdate) {
          const updatedMatch = {
            ...matchToUpdate,
            homeScore: homeScoreNum,
            awayScore: awayScoreNum
          };
          updateMatch(updatedMatch);
        }
        
        setEditMatchId(null);
      } catch (error) {
        console.error('Error saving match result:', error);
        // Optionally add error handling UI here
      }
    }
  };
  
  const handleCancelEdit = () => {
    setEditMatchId(null);
  };

  const predictionsAllowed = arePredictionsAllowed(currentQuiniela.matches);
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Partidos</h3>
      
      {!predictionsAllowed && (
        <div className="mb-4 p-2 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded">
          Las predicciones ya no están disponibles. La quiniela está en curso o finalizada.
        </div>
      )}
      
      {currentQuiniela.matches.length === 0 ? (
        <p className="text-gray-500">No hay partidos en esta quiniela.</p>
      ) : (
        <div className="space-y-4">
          {currentQuiniela.matches.map(match => (
            <div key={match.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">
                  {formatDateCST(match.date)}
                </span>
                {new Date(match.date) < new Date() && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    Finalizado
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex-1 text-right">
                  <p className="font-medium">{match.homeTeam}</p>
                </div>
                
                <div className="flex items-center justify-center mx-4">
                  {editMatchId === match.id ? (
                    <>
                      <input
                        type="number"
                        min="0"
                        value={homeScore}
                        onChange={(e) => setHomeScore(e.target.value)}
                        className="w-12 h-10 text-center border rounded mx-1"
                      />
                      <span className="mx-2">-</span>
                      <input
                        type="number"
                        min="0"
                        value={awayScore}
                        onChange={(e) => setAwayScore(e.target.value)}
                        className="w-12 h-10 text-center border rounded mx-1"
                      />
                    </>
                  ) : (
                    <div className="text-xl font-bold">
                      {match.homeScore !== undefined && match.homeScore !== null && 
                       match.awayScore !== undefined && match.awayScore !== null
                        ? `${match.homeScore} - ${match.awayScore}`
                        : "- - -"}
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <p className="font-medium">{match.awayTeam}</p>
                </div>
              </div>
              
              {isAdmin && (
                <div className="mt-4 flex justify-end">
                  {editMatchId === match.id ? (
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleSaveResult(match.id)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Guardar
                      </button>
                      <button 
                        onClick={handleCancelEdit}
                        className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleEditResult(match)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      {match.homeScore !== undefined ? 'Actualizar Resultado' : 'Añadir Resultado'}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MatchList;
