import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Quiniela, Match, Participant, Prediction } from '../types';
import { getQuinielasFromS3, saveQuinielasToS3, deleteQuinielaFromS3 } from '../utils/s3Storage';
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
  joinQuiniela: () => Promise<{success: boolean; error?: string}>;
  updatePrediction: (prediction: Prediction) => void;
  leaveQuiniela: () => void;
  calculateResults: () => void;
  isLoading: boolean;
  error: string | null;
  canEditQuiniela: (quiniela: Quiniela) => boolean;
  getCurrentUserParticipant: () => Participant | undefined;
  refreshCurrentQuiniela: () => Promise<void>;
  loadQuinielas: () => Promise<void>; // Add this function to load all quinielas
}

const QuinielaContext = createContext<QuinielaContextType | undefined>(undefined);

export const QuinielaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [quinielas, setQuinielas] = useState<Quiniela[]>([]);
  const [currentQuiniela, setCurrentQuiniela] = useState<Quiniela | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAdmin } = useAuth();
  const [isJoining, setIsJoining] = useState<boolean>(false);

  // Load all quinielas
  const loadQuinielas = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const storedQuinielas = await getQuinielasFromS3();
      setQuinielas(storedQuinielas);
    } catch (error) {
      console.error('Error loading quinielas:', error);
      setError('Error loading quinielas from server');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load of quinielas when the app starts
  useEffect(() => {
    loadQuinielas();
  }, []);

  const canEditQuiniela = (quiniela: Quiniela): boolean => {
    if (!user) return false;
    return isAdmin() || quiniela.createdBy === user.id;
  };

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
        createdBy: user.id
      };

      setQuinielas(prev => [...prev, newQuiniela]);
      saveQuinielasToS3([...quinielas, newQuiniela]);
      setCurrentQuiniela(newQuiniela);
    } catch (error) {
      console.error('Error creating quiniela:', error);
      setError('Failed to create quiniela');
    }
  };

  const updateQuiniela = (quiniela: Quiniela) => {
    try {
      const updatedQuinielas = quinielas.map(q => q.id === quiniela.id ? quiniela : q);
      setQuinielas(updatedQuinielas);
      saveQuinielasToS3(updatedQuinielas);
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
      const updatedQuinielas = quinielas.filter(q => q.id !== id);
      setQuinielas(updatedQuinielas);
      deleteQuinielaFromS3(id);
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

      // Update points for participants if the match has scores
      if (match.homeScore !== undefined && match.awayScore !== undefined) {
        // Recalculate points for all participants
        const updatedParticipants = updateParticipantPoints(
          updatedQuiniela.participants,
          updatedQuiniela.matches
        );
        updatedQuiniela.participants = updatedParticipants;
      }

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
      // Filter out the match to be removed
      const updatedMatches = currentQuiniela.matches.filter(m => m.id !== id);
      
      // Also filter out any predictions related to this match
      const updatedParticipants = currentQuiniela.participants.map(participant => {
        return {
          ...participant,
          predictions: participant.predictions.filter(p => p.matchId !== id)
        };
      });

      const updatedQuiniela = {
        ...currentQuiniela,
        matches: updatedMatches,
        participants: updatedParticipants
      };

      // Calculate updated points if needed
      const participantsWithUpdatedPoints = updateParticipantPoints(
        updatedQuiniela.participants,
        updatedQuiniela.matches
      );
      
      // Create final quiniela with updated points
      const finalUpdatedQuiniela = {
        ...updatedQuiniela,
        participants: participantsWithUpdatedPoints
      };

      updateQuiniela(finalUpdatedQuiniela);
    } catch (error) {
      console.error('Error removing match:', error);
      setError('Failed to remove match');
    }
  };

  const joinQuiniela = async (): Promise<{success: boolean; error?: string}> => {
    if (!currentQuiniela || !user) {
      const errorMsg = 'Debes iniciar sesión para unirte a una quiniela';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    try {
      setIsJoining(true);
      
      if (isUserParticipant(currentQuiniela.participants, user.id)) {
        const errorMsg = 'Ya eres participante de esta quiniela';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      const newParticipant: Participant = {
        id: generateId(), // Explicitly assign a unique ID
        userId: user.id,
        predictions: [],
        points: 0
      };

      const updatedQuiniela = {
        ...currentQuiniela,
        participants: [...currentQuiniela.participants, newParticipant]
      };

      await updateQuiniela(updatedQuiniela);
      return { success: true };
    } catch (error) {
      console.error('Error joining quiniela:', error);
      const errorMsg = 'Error al unirte a la quiniela';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsJoining(false);
    }
  };

  const updatePrediction = (prediction: Prediction) => {
    if (!currentQuiniela || !user) {
      setError('Debes iniciar sesión para actualizar predicciones');
      return;
    }

    try {
      const updatedParticipants = currentQuiniela.participants.map(participant => {
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

        // Return the participant with updated predictions but maintain the same points
        // Don't recalculate points when a user makes predictions
        return {
          ...participant,
          predictions: updatedPredictions
          // Don't update points here, only when calculateResults is called
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

  const leaveQuiniela = () => {
    if (!currentQuiniela || !user) {
      setError('Debes iniciar sesión para abandonar la quiniela');
      return;
    }

    try {
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

  const calculateResults = () => {
    if (!currentQuiniela) return;

    const updatedParticipants = currentQuiniela.participants.map(participant => {
      let totalPoints = 0;

      participant.predictions.forEach(prediction => {
        const match = currentQuiniela.matches.find(m => m.id === prediction.matchId);
        // Only consider matches that have results
        if (!match || match.homeScore === undefined || match.homeScore === null || 
            match.awayScore === undefined || match.awayScore === null) {
          return;
        }

        if (prediction.homeScore === match.homeScore && prediction.awayScore === match.awayScore) {
          totalPoints += 4;
          return;
        }

        const predictionResult = prediction.homeScore > prediction.awayScore ? 'H' :
                               prediction.homeScore < prediction.awayScore ? 'A' : 'D';
        const matchResult = match.homeScore > match.awayScore ? 'H' :
                          match.homeScore < match.awayScore ? 'A' : 'D';

        if (predictionResult === matchResult) {
          if (matchResult === 'D') {
            totalPoints += 2;
          } else if (matchResult === 'H') {
            totalPoints += 1;
          } else if (matchResult === 'A') {
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

  const refreshCurrentQuiniela = async () => {
    if (!currentQuiniela) return;

    try {
      // Check if we're currently viewing a quiniela or the list
      // Don't refresh if currentQuiniela is intentionally null (we're at the list)
      if (currentQuiniela === null) {
        return;
      }

      const storedQuinielas = await getQuinielasFromS3();
      const updatedQuiniela = storedQuinielas.find(q => q.id === currentQuiniela.id);

      if (updatedQuiniela) {
        // This is the key change - we allow manual nulling of currentQuiniela to stick
        // by checking the last state value
        setCurrentQuiniela(prevQuiniela => {
          if (prevQuiniela === null) {
            // If the previous state was null, the user might have just gone back
            // to the list view, so don't override it
            return null;
          }
          return updatedQuiniela;
        });
      }
    } catch (error) {
      console.error('Error refreshing current quiniela:', error);
      setError('Error refreshing current quiniela');
    }
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
    getCurrentUserParticipant,
    refreshCurrentQuiniela,
    loadQuinielas, // Include this in the context value
    isJoining
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
