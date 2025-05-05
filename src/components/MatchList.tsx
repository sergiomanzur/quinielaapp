import React, { useState } from 'react';
import { useQuiniela } from '../context/QuinielaContext';
import { Match } from '../types';
import { arePredictionsAllowed } from '../utils/helpers';
import { formatDateCST } from '../utils/dateUtils';
import { updateMatchResult, updateMatchDate, deleteMatch } from '../utils/api';
import { toCST } from '../utils/dateUtils';
// Import Loader icon if you have it, otherwise use text
import { Loader } from 'lucide-react'; 

const MatchList: React.FC = () => {
  const { currentQuiniela, updateMatch, removeMatch, canEditQuiniela, refreshCurrentQuiniela } = useQuiniela();
  const [editMatchId, setEditMatchId] = useState<string | null>(null);
  const [homeScore, setHomeScore] = useState<string>('');
  const [awayScore, setAwayScore] = useState<string>('');
  const [editDateMatchId, setEditDateMatchId] = useState<string | null>(null);
  const [matchDate, setMatchDate] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isSavingResult, setIsSavingResult] = useState<boolean>(false); // Add saving state
  
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
      setIsSavingResult(true); // Start saving
      try {
        // Use the new API endpoint to update match result
        await updateMatchResult(matchId, homeScoreNum, awayScoreNum);
        
        // Refresh the current quiniela data from the server to get updated results and points
        await refreshCurrentQuiniela(); 
        
        setEditMatchId(null); // Close edit mode on success
      } catch (error) {
        console.error('Error saving match result:', error);
        // Optionally add error handling UI here
        alert('Error al guardar el resultado del partido. Por favor intenta de nuevo.'); // Added user feedback
      } finally {
        setIsSavingResult(false); // Stop saving regardless of outcome
      }
    } else {
       alert('Por favor ingresa marcadores válidos.'); // Added validation feedback
    }
  };
  
  const handleCancelEdit = () => {
    setEditMatchId(null);
    setEditDateMatchId(null);
  };

  // New functions for editing match date
  const handleEditDate = (match: Match) => {
    setEditDateMatchId(match.id);
    // Format date for input type="date" - YYYY-MM-DD
    const date = new Date(match.date);
    const formattedDate = date.toISOString().split('T')[0];
    setMatchDate(formattedDate);
  };

  const handleSaveDate = async (matchId: string) => {
    if (matchDate) {
      try {
        // Convert to CST before sending to API
        const cstDate = toCST(matchDate);
        await updateMatchDate(matchId, cstDate);
        
        // Update the local state
        const matchToUpdate = currentQuiniela.matches.find(m => m.id === matchId);
        if (matchToUpdate) {
          const updatedMatch = {
            ...matchToUpdate,
            date: cstDate
          };
          updateMatch(updatedMatch);
        }
        
        setEditDateMatchId(null);
      } catch (error) {
        console.error('Error saving match date:', error);
      }
    }
  };

  // New function for deleting a match
  const handleDeleteMatch = async (matchId: string) => {
    if (window.confirm('¿Estás seguro de eliminar este partido? Esta acción no se puede deshacer.')) {
      setIsDeleting(true);
      try {
        await deleteMatch(matchId);
        removeMatch(matchId);
        // Refresh the quiniela data after deleting a match
        await refreshCurrentQuiniela();
      } catch (error) {
        console.error('Error deleting match:', error);
        alert('Error al eliminar el partido. Por favor intenta de nuevo.');
      } finally {
        setIsDeleting(false);
      }
    }
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
                {editDateMatchId === match.id ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="date"
                      value={matchDate}
                      onChange={(e) => setMatchDate(e.target.value)}
                      className="px-2 py-1 border rounded text-sm"
                    />
                    <button 
                      onClick={() => handleSaveDate(match.id)}
                      className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                    >
                      Guardar
                    </button>
                    <button 
                      onClick={handleCancelEdit}
                      className="px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500">
                      {formatDateCST(match.date)}
                    </span>
                    {isAdmin && (
                      <button 
                        onClick={() => handleEditDate(match)}
                        className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                      >
                        Editar fecha
                      </button>
                    )}
                  </div>
                )}
                
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
                <div className="mt-4 flex justify-end space-x-2">
                  {editMatchId === match.id ? (
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleSaveResult(match.id)}
                        disabled={isSavingResult} // Disable button while saving
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 flex items-center"
                      >
                        {isSavingResult ? (
                          <>
                            <Loader size={16} className="animate-spin mr-2" /> 
                            Guardando...
                          </>
                        ) : (
                          'Guardar'
                        )}
                      </button>
                      <button 
                        onClick={handleCancelEdit}
                        disabled={isSavingResult} // Also disable cancel while saving
                        className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleEditResult(match)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        {match.homeScore !== undefined ? 'Actualizar Resultado' : 'Añadir Resultado'}
                      </button>
                      <button 
                        onClick={() => handleDeleteMatch(match.id)}
                        disabled={isDeleting}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        Eliminar Partido
                      </button>
                    </>
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
