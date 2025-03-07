import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Quiniela, Match, Participant, Prediction } from '../types';
import { 
  getQuinielas, saveQuiniela, deleteQuiniela,
  getQuinielasSync, saveQuinielaSync, deleteQuinielaSync 
} from '../utils/storage';
import { generateId, updateParticipantPoints, isUserParticipant } from '../utils/helpers';
import { useAuth } from './AuthContext';
import { toCST } from '../utils/dateUtils';

interface QuinielaContextType {
  quinielas: Quiniela[];
  currentQuiniela: Quiniela | null;
  setCurrentQuiniela: (quiniela: Quiniela | null) => void;
  createQuiniela: (name: string) => void;
  updateQuiniela: (quiniela: Quiniela) => void;
  removeQuiniela: (id: string) => void;
  addMatch: (match: Omit<Match, 'id'>) => void;
  updateMatch: (match: Match) => void;
  removeMatch: (id: string) => void;
  joinQuiniela: () => void;
  updatePrediction: (prediction: Prediction) => void;
  leaveQuiniela: () => void;
  calculateResults: () => void;
  isLoading: boolean;
  error: string | null;
  canEditQuiniela: (quiniela: Quiniela) => boolean;
  getCurrentUserParticipant: () => Participant | undefined;
}

const QuinielaContext = createContext<QuinielaContextType | undefined>(undefined);

export const QuinielaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [quinielas, setQuinielas] = useState<Quiniela[]>([]);
  const [currentQuiniela, setCurrentQuiniela] = useState<Quiniela | null>(null);
  const [isFileStorageAvailable, setIsFileStorageAvailable] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    const loadQuinielas = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Loading quinielas...');
        const storedQuinielas = await getQuinielas();
        setQuinielas(storedQuinielas);
        setIsFileStorageAvailable(true);
        console.log(`Loaded ${storedQuinielas.length} quinielas successfully`);
      } catch (error) {
        console.error('Error loading quinielas, using sync method:', error);
        const storedQuinielas = getQuinielasSync();
        setQuinielas(storedQuinielas);
        setIsFileStorageAvailable(false);
        setError('Error loading quinielas from server, using local storage instead');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadQuinielas();
  }, []);

  // Check if user can edit a quiniela (admin or creator)
  const canEditQuiniela = (quiniela: Quiniela): boolean => {
    if (!user) return false;
    return isAdmin() || quiniela.createdBy === user.id;
  };
  
  // Get the current user's participant object from the current quiniela
  const getCurrentUserParticipant = (): Participant | undefined => {
    if (!currentQuiniela || !user) return undefined;
    return currentQuiniela.participants.find(p => p.userId === user.id);
  };

  const createQuiniela = (name: string) => {
    if (!user) return;
    
    try {
      const newQuiniela: Quiniela = {
        id: generateId(),
        name,
        matches: [],
        createdAt: toCST(new Date()),
        participants: [],
        createdBy: user.id // Set the creator
      };
      
      setQuinielas(prev => [...prev, newQuiniela]);
      
      if (isFileStorageAvailable) {
        saveQuiniela(newQuiniela).catch(error => {
          console.error('Error saving quiniela, using sync method:', error);
          saveQuinielaSync(newQuiniela);
          setError('Error saving to server, saved locally instead');
        });
      } else {
        saveQuinielaSync(newQuiniela);
      }
      
      setCurrentQuiniela(newQuiniela);
    } catch (error) {
      console.error('Error creating quiniela:', error);
      setError('Failed to create quiniela');
    }
  };

  const updateQuiniela = (quiniela: Quiniela) => {
    try {
      setQuinielas(prev => 
        prev.map(q => q.id === quiniela.id ? quiniela : q)
      );
      
      if (isFileStorageAvailable) {
        saveQuiniela(quiniela).catch(error => {
          console.error('Error updating quiniela, using sync method:', error);
          saveQuinielaSync(quiniela);
          setError('Error saving to server, saved locally instead');
        });
      } else {
        saveQuinielaSync(quiniela);
      }
      
      if (currentQuiniela?.id === quiniela.id) {
        setCurrentQuiniela(quiniela);
      }
    } catch (error) {
      console.error('Error updating quiniela:', error);
      setError('Failed to update quiniela');
    }
  };

  const removeQuiniela = (id: string) => {
    try {
      // Check if quiniela exists and user has permission
      const quinielaToRemove = quinielas.find(q => q.id === id);
      if (!quinielaToRemove || !canEditQuiniela(quinielaToRemove)) {
        setError('No tienes permiso para eliminar esta quiniela');
        return;
      }
      
      setQuinielas(prev => prev.filter(q => q.id !== id));
      
      if (isFileStorageAvailable) {
        deleteQuiniela(id).catch(error => {
          console.error('Error deleting quiniela, using sync method:', error);
          deleteQuinielaSync(id);
          setError('Error deleting from server, deleted locally instead');
        });
      } else {
        deleteQuinielaSync(id);
      }
      
      if (currentQuiniela?.id === id) {
        setCurrentQuiniela(null);
      }
    } catch (error) {
      console.error('Error removing quiniela:', error);
      setError('Failed to remove quiniela');
    }
  };

  const addMatch = (matchData: Omit<Match, 'id'>) => {
    if (!currentQuiniela || !canEditQuiniela(currentQuiniela)) {
      setError('No tienes permiso para agregar partidos');
      return;
    }
    
    try {
      const newMatch: Match = {
        ...matchData,
        id: generateId()
      };
      
      const updatedQuiniela = {
        ...currentQuiniela,
        matches: [...currentQuiniela.matches, newMatch]
      };
      
      updateQuiniela(updatedQuiniela);
    } catch (error) {
      console.error('Error adding match:', error);
      setError('Failed to add match');
    }
  };

  const updateMatch = (match: Match) => {
    if (!currentQuiniela || !canEditQuiniela(currentQuiniela)) {
      setError('No tienes permiso para actualizar partidos');
      return;
    }
    
    try {
      const updatedQuiniela = {
        ...currentQuiniela,
        matches: currentQuiniela.matches.map(m => 
          m.id === match.id ? match : m
        )
      };
      
      updateQuiniela(updatedQuiniela);
    } catch (error) {
      console.error('Error updating match:', error);
      setError('Failed to update match');
    }
  };

  const removeMatch = (id: string) => {
    if (!currentQuiniela || !canEditQuiniela(currentQuiniela)) {
      setError('No tienes permiso para eliminar partidos');
      return;
    }
    
    try {
      const updatedQuiniela = {
        ...currentQuiniela,
        matches: currentQuiniela.matches.filter(m => m.id !== id)
      };
      
      updateQuiniela(updatedQuiniela);
    } catch (error) {
      console.error('Error removing match:', error);
      setError('Failed to remove match');
    }
  };

  // Replace addParticipant with joinQuiniela
  const joinQuiniela = () => {
    if (!currentQuiniela || !user) {
      setError('Debes iniciar sesión para unirte a una quiniela');
      return;
    }
    
    try {
      // Check if user is already a participant
      if (isUserParticipant(currentQuiniela.participants, user.id)) {
        setError('Ya eres participante de esta quiniela');
        return;
      }
      
      const newParticipant: Participant = {
        userId: user.id,
        predictions: [],
        points: 0
      };
      
      const updatedQuiniela = {
        ...currentQuiniela,
        participants: [...currentQuiniela.participants, newParticipant]
      };
      
      updateQuiniela(updatedQuiniela);
    } catch (error) {
      console.error('Error joining quiniela:', error);
      setError('Error al unirte a la quiniela');
    }
  };

  // Replace updateParticipantPrediction with updatePrediction
  const updatePrediction = (prediction: Prediction) => {
    if (!currentQuiniela || !user) {
      setError('Debes iniciar sesión para actualizar predicciones');
      return;
    }
    
    try {
      const updatedParticipants = currentQuiniela.participants.map(participant => {
        // Only update the current user's predictions
        if (participant.userId !== user.id) return participant;
        
        const existingPredictionIndex = participant.predictions.findIndex(
          p => p.matchId === prediction.matchId
        );
        
        let updatedPredictions = [...participant.predictions];
        
        if (existingPredictionIndex >= 0) {
          updatedPredictions[existingPredictionIndex] = prediction;
        } else {
          updatedPredictions.push(prediction);
        }
        
        return {
          ...participant,
          predictions: updatedPredictions
        };
      });
      
      const updatedQuiniela = {
        ...currentQuiniela,
        participants: updatedParticipants
      };
      
      updateQuiniela(updatedQuiniela);
    } catch (error) {
      console.error('Error updating prediction:', error);
      setError('Error al actualizar la predicción');
    }
  };

  // Replace removeParticipant with leaveQuiniela
  const leaveQuiniela = () => {
    if (!currentQuiniela || !user) {
      setError('Debes iniciar sesión para abandonar la quiniela');
      return;
    }
    
    try {
      // Don't allow the creator to leave
      if (currentQuiniela.createdBy === user.id) {
        setError('El creador de la quiniela no puede abandonarla');
        return;
      }
      
      const updatedQuiniela = {
        ...currentQuiniela,
        participants: currentQuiniela.participants.filter(p => p.userId !== user.id)
      };
      
      updateQuiniela(updatedQuiniela);
    } catch (error) {
      console.error('Error leaving quiniela:', error);
      setError('Error al abandonar la quiniela');
    }
  };

  // Calculate points for all participants
  const calculateResults = () => {
    if (!currentQuiniela) return;
    
    const updatedParticipants = currentQuiniela.participants.map(participant => {
      let totalPoints = 0;
      
      // Calculate points for each prediction
      participant.predictions.forEach(prediction => {
        const match = currentQuiniela.matches.find(m => m.id === prediction.matchId);
        if (!match || match.homeScore === undefined || match.awayScore === undefined) {
          return;
        }
        
        // Exact score: 4 points
        if (prediction.homeScore === match.homeScore && prediction.awayScore === match.awayScore) {
          totalPoints += 4;
          return;
        }
        
        // Correct result type
        const predictionResult = prediction.homeScore > prediction.awayScore ? 'H' : 
                               prediction.homeScore < prediction.awayScore ? 'A' : 'D';
        const matchResult = match.homeScore > match.awayScore ? 'H' : 
                          match.homeScore < match.awayScore ? 'A' : 'D';
        
        if (predictionResult === matchResult) {
          // Correct draw: 2 points
          if (matchResult === 'D') {
            totalPoints += 2;
          }
          // Correct home win: 1 point
          else if (matchResult === 'H') {
            totalPoints += 1;
          }
          // Correct away win: 3 points
          else if (matchResult === 'A') {
            totalPoints += 3;
          }
        }
      });
      
      return {
        ...participant,
        points: totalPoints
      };
    });
    
    const updatedQuiniela = {
      ...currentQuiniela,
      participants: updatedParticipants
    };
    
    updateQuiniela(updatedQuiniela);
    
    alert(`Resultados calculados para todos los participantes`);
  };

  const value = {
    quinielas,
    currentQuiniela,
    setCurrentQuiniela,
    createQuiniela,
    updateQuiniela,
    removeQuiniela,
    addMatch,
    updateMatch,
    removeMatch,
    joinQuiniela,
    updatePrediction,
    leaveQuiniela,
    calculateResults,
    isLoading,
    error,
    canEditQuiniela,
    getCurrentUserParticipant
  };

  return (
    <QuinielaContext.Provider value={value}>
      {children}
    </QuinielaContext.Provider>
  );
};

export const useQuiniela = () => {
  const context = useContext(QuinielaContext);
  if (context === undefined) {
    throw new Error('useQuiniela must be used within a QuinielaProvider');
  }
  return context;
};
