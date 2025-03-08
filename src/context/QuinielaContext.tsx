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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
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

  const joinQuiniela = () => {
    if (!currentQuiniela || !user) {
      setError('Debes iniciar sesión para unirte a una quiniela');
      return;
    }
    
    try {
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
        if (!match || match.homeScore === undefined || match.awayScore === undefined) {
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
