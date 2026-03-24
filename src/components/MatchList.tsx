import React, { useState } from 'react';
import { useQuiniela } from '../context/QuinielaContext';
import { Match } from '../types';
import { arePredictionsAllowed } from '../utils/helpers';
import { formatDateCST } from '../utils/dateUtils';
import { updateMatchResult, updateMatchDate, updateMatchType, deleteMatch } from '../utils/api';
import { toCST } from '../utils/dateUtils';
import { Loader, ChevronDown, ChevronUp } from 'lucide-react';

const MATCH_TYPE_SUGGESTIONS = ['LIGA', 'COPA', 'AMISTOSO', 'MUNDIAL', 'MUNDIAL DE CLUBES', 'CHAMPIONS LEAGUE', 'EUROPA LEAGUE', 'ELIMINATORIA'];

const MatchList: React.FC = () => {
  const { currentQuiniela, updateMatch, removeMatch, canEditQuiniela, refreshCurrentQuiniela } = useQuiniela();
  const [editMatchId, setEditMatchId] = useState<string | null>(null);
  const [homeScore, setHomeScore] = useState<string>('');
  const [awayScore, setAwayScore] = useState<string>('');
  const [editDateMatchId, setEditDateMatchId] = useState<string | null>(null);
  const [matchDate, setMatchDate] = useState<string>('');
  const [editTypeMatchId, setEditTypeMatchId] = useState<string | null>(null);
  const [matchTypeInput, setMatchTypeInput] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isSavingResult, setIsSavingResult] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  if (!currentQuiniela) return null;

  const isAdmin = canEditQuiniela(currentQuiniela);

  const handleEditResult = (match: Match) => {
    setEditMatchId(match.id);
    setHomeScore(match.homeScore !== undefined && match.homeScore !== null ? match.homeScore.toString() : '');
    setAwayScore(match.awayScore !== undefined && match.awayScore !== null ? match.awayScore.toString() : '');
  };

  const handleSaveResult = async (matchId: string) => {
    const homeScoreNum = parseInt(homeScore, 10);
    const awayScoreNum = parseInt(awayScore, 10);

    if (!isNaN(homeScoreNum) && !isNaN(awayScoreNum)) {
      setIsSavingResult(true);
      try {
        await updateMatchResult(matchId, homeScoreNum, awayScoreNum);
        await refreshCurrentQuiniela();
        setEditMatchId(null);
      } catch (error) {
        console.error('Error saving match result:', error);
        alert('Error al guardar el resultado del partido. Por favor intenta de nuevo.');
      } finally {
        setIsSavingResult(false);
      }
    } else {
      alert('Por favor ingresa marcadores válidos.');
    }
  };

  const handleCancelEdit = () => {
    setEditMatchId(null);
    setEditDateMatchId(null);
    setEditTypeMatchId(null);
  };

  const handleEditDate = (match: Match) => {
    setEditDateMatchId(match.id);
    const date = new Date(match.date);
    setMatchDate(date.toISOString().split('T')[0]);
  };

  const handleSaveDate = async (matchId: string) => {
    if (matchDate) {
      try {
        const cstDate = toCST(matchDate);
        await updateMatchDate(matchId, cstDate);
        const matchToUpdate = currentQuiniela.matches.find(m => m.id === matchId);
        if (matchToUpdate) {
          updateMatch({ ...matchToUpdate, date: cstDate });
        }
        setEditDateMatchId(null);
      } catch (error) {
        console.error('Error saving match date:', error);
      }
    }
  };

  const handleEditType = (match: Match) => {
    setEditTypeMatchId(match.id);
    setMatchTypeInput(match.matchType || '');
  };

  const handleSaveType = async (matchId: string) => {
    try {
      const newType = matchTypeInput.trim().toUpperCase();
      await updateMatchType(matchId, newType);
      await refreshCurrentQuiniela();
      setEditTypeMatchId(null);
    } catch (error) {
      console.error('Error saving match type:', error);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (window.confirm('¿Estás seguro de eliminar este partido? Esta acción no se puede deshacer.')) {
      setIsDeleting(true);
      try {
        await deleteMatch(matchId);
        removeMatch(matchId);
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
    <div className="bg-white rounded-lg shadow-md mb-6">
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <h3 className="text-lg font-semibold">Partidos</h3>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {isOpen && (
      <div className="px-6 pb-6">
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

              {/* Top row: date + type badge + finished badge */}
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Date */}
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
                      <span className="text-sm text-gray-500">{formatDateCST(match.date)}</span>
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

                  {/* Match type badge / editor */}
                  {editTypeMatchId === match.id ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        list="matchTypeSuggestionsList"
                        value={matchTypeInput}
                        onChange={(e) => setMatchTypeInput(e.target.value)}
                        placeholder="Tipo de partido..."
                        className="px-2 py-1 border rounded text-xs w-44"
                      />
                      <datalist id="matchTypeSuggestionsList">
                        {MATCH_TYPE_SUGGESTIONS.map(t => <option key={t} value={t} />)}
                      </datalist>
                      <button
                        onClick={() => handleSaveType(match.id)}
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
                    <>
                      {match.matchType && (
                        <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded">
                          {match.matchType}
                        </span>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => handleEditType(match)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          {match.matchType ? 'Editar tipo' : '+ Tipo'}
                        </button>
                      )}
                    </>
                  )}
                </div>

                {new Date(match.date) < new Date() && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    Finalizado
                  </span>
                )}
              </div>

              {/* Match row */}
              <div className="grid items-center gap-x-3 [grid-template-columns:1fr_auto_1fr]">
                <div className="min-w-0 text-right">
                  <p className="font-medium">{match.homeTeam}</p>
                </div>

                <div className="flex items-center justify-center">
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

                <div className="min-w-0">
                  <p className="font-medium">{match.awayTeam}</p>
                </div>
              </div>

              {/* Admin action buttons */}
              {isAdmin && (
                <div className="mt-4 flex justify-end space-x-2">
                  {editMatchId === match.id ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSaveResult(match.id)}
                        disabled={isSavingResult}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 flex items-center"
                      >
                        {isSavingResult ? (
                          <><Loader size={16} className="animate-spin mr-2" />Guardando...</>
                        ) : 'Guardar'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={isSavingResult}
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
      )}
    </div>
  );
};

export default MatchList;
