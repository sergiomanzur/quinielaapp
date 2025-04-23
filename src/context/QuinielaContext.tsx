import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Quiniela, Match, Participant, Prediction } from '../types';
import { getQuinielasFromS3, getQuinielaByIdFromS3, saveQuinielasToS3, deleteQuinielaFromS3, createQuinielaInS3 } from '../utils/s3Storage'; 
// Import new API functions
import { savePredictionsToServer, addMatchToServer, joinQuinielaOnServer } from '../utils/api'; 
import { generateId, updateParticipantPoints, isUserParticipant } from '../utils/helpers';
import { useAuth } from './AuthContext';
import { toCST } from '../utils/dateUtils';

interface QuinielaContextType {
  quinielas: Quiniela[];
  currentQuiniela: Quiniela | null;
  setCurrentQuiniela: (quiniela: Quiniela | null) => void;
  createQuiniela: (name: string) => Promise<void>; // Make async
  updateQuiniela: (quiniela: Quiniela) => void;
  removeQuiniela: (id: string) => Promise<void>; // Make async
  addMatch: (match: Omit<Match, 'id'>) => Promise<void>; // Make async
  updateMatch: (match: Match) => void;
  removeMatch: (id: string) => void;
  joinQuiniela: () => Promise<{success: boolean; error?: string}>;
  // Modify signature to accept an array
  updatePrediction: (predictions: Prediction[]) => Promise<boolean>; 
  leaveQuiniela: () => void;
  calculateResults: () => void;
  isLoading: boolean;
  error: string | null;
  canEditQuiniela: (quiniela: Quiniela) => boolean;
  getCurrentUserParticipant: () => Participant | undefined;
  refreshCurrentQuiniela: () => Promise<void>;
  loadQuinielas: () => Promise<void>; // Function to load all quinielas
  isJoining: boolean;
}

const QuinielaContext = createContext<QuinielaContextType | undefined>(undefined);

export const QuinielaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [quinielas, setQuinielas] = useState<Quiniela[]>([]);
  const [currentQuiniela, setCurrentQuiniela] = useState<Quiniela | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false); // Set initial loading to false
  const [error, setError] = useState<string | null>(null);
  const { user, isAdmin } = useAuth();
  const [isJoining, setIsJoining] = useState<boolean>(false);
  // No longer need hasLoadedRef as initial load is removed

  // Load all quinielas - Now called explicitly by components like QuinielaList
  const loadQuinielas = async () => {
    setIsLoading(true);
    setError(null);
    console.log("Attempting to load quinielas...");

    try {
      const storedQuinielas = await getQuinielasFromS3();
      setQuinielas(storedQuinielas);
      console.log(`Loaded ${storedQuinielas.length} quinielas.`);
    } catch (error) {
      console.error('Error loading quinielas:', error);
      setError('Error loading quinielas from server');
      // Optionally clear existing quinielas on error
      // setQuinielas([]); 
    } finally {
      setIsLoading(false);
    }
  };

  const canEditQuiniela = (quiniela: Quiniela): boolean => {
    if (!user) return false;
    return isAdmin() || quiniela.createdBy === user.id;
  };

  const getCurrentUserParticipant = (): Participant | undefined => {
    if (!currentQuiniela || !user) return undefined;
    return currentQuiniela.participants.find(p => p.userId === user.id);
  };

  // Modify createQuiniela to use the new dedicated API endpoint
  const createQuiniela = async (name: string) => {
    if (!user) {
      setError("Debes iniciar sesión para crear una quiniela.");
      return;
    }
    setIsLoading(true); // Indicate loading state
    setError(null);

    try {
      // Call the new function to create the quiniela on the server
      const newQuiniela = await createQuinielaInS3(name, user.id);

      if (newQuiniela) {
        // If successful, update local state with the returned object
        setQuinielas(prev => [...prev, newQuiniela]);
        // Optionally set the new quiniela as the current one
        setCurrentQuiniela(newQuiniela); 
        console.log(`Quiniela "${newQuiniela.name}" created successfully.`);
      } else {
        // Handle case where API call fails but doesn't throw an error
        throw new Error("Failed to create quiniela on server.");
      }
    } catch (error) {
      console.error('Error creating quiniela:', error);
      setError(`Error al crear la quiniela: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false); // Clear loading state
    }
  };

  const updateQuiniela = (quiniela: Quiniela) => {
    try {
      const updatedQuinielas = quinielas.map(q => q.id === quiniela.id ? quiniela : q);
      setQuinielas(updatedQuinielas);
      saveQuinielasToS3(updatedQuinelas);
      if (currentQuiniela?.id === quiniela.id) {
        setCurrentQuiniela(quiniela);
      }
    } catch (error) {
      console.error('Error updating quiniela:', error);
      setError('Failed to update quiniela');
    }
  };

  // Modify removeQuiniela to be async and handle API result
  const removeQuiniela = async (id: string) => {
    // Store the quiniela being removed in case we need to revert
    const quinielaToRemove = quinielas.find(q => q.id === id);
    if (!quinielaToRemove) return; // Should not happen if called from UI

    // Optimistic UI update
    const originalQuinielas = [...quinielas];
    setQuinielas(prev => prev.filter(q => q.id !== id));
    if (currentQuiniela?.id === id) {
      setCurrentQuiniela(null);
    }
    setError(null); // Clear previous errors

    try {
      // Call the delete function which now uses the DELETE API endpoint
      const success = await deleteQuinielaFromS3(id);

      if (!success) {
        // If API call fails, revert the optimistic update
        throw new Error("Failed to delete quiniela on server.");
      }
      console.log(`Quiniela ${id} deleted successfully.`);

    } catch (error) {
      console.error('Error removing quiniela:', error);
      setError(`Error al eliminar la quiniela: ${error instanceof Error ? error.message : 'Unknown error'}. Reverting changes.`);
      // Revert UI changes
      setQuinielas(originalQuinielas);
      // If the deleted one was the current one, set it back
      if (currentQuiniela?.id === id) {
         setCurrentQuiniela(quinielaToRemove);
      }
    }
  };

  // Modify addMatch to use API
  const addMatch = async (matchData: Omit<Match, 'id'>) => {
    if (!currentQuiniela || !canEditQuiniela(currentQuiniela)) {
      setError('No tienes permiso para agregar partidos');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      // Call API to add the match
      const newMatch = await addMatchToServer(currentQuiniela.id, matchData);

      if (newMatch) {
        // Update local state on success
        const updatedQuiniela = {
          ...currentQuiniela,
          matches: [...currentQuiniela.matches, newMatch]
        };
        // No need to call updateQuiniela which saves everything, just update local state
        setCurrentQuiniela(updatedQuiniela); 
        // Also update the main list
        setQuinielas(prev => prev.map(q => q.id === updatedQuiniela.id ? updatedQuiniela : q));
        console.log("Match added successfully and local state updated.");
      } else {
        throw new Error("Failed to add match on server.");
      }
    } catch (error) {
      console.error('Error adding match:', error);
      setError(`Error al agregar partido: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Modify updateMatch - TODO: Should ideally use a dedicated PUT /api/matches/:id endpoint
  const updateMatch = (match: Match) => {
    // ... (keep existing logic for now, but be aware it saves *all* quinielas via updateQuiniela) ...
    // ... This function is primarily called after updating results/date via specific endpoints ...
    // ... so the main save might not be strictly necessary if those endpoints handle state updates ...
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
        const updatedParticipants = updateParticipantPoints(
          updatedQuiniela.participants,
          updatedQuiniela.matches
        );
        updatedQuiniela.participants = updatedParticipants;
      }

      // This saves ALL quinielas - consider changing if performance becomes an issue
      updateQuiniela(updatedQuiniela); 
    } catch (error) {
      console.error('Error updating match:', error);
      setError('Failed to update match');
    }
  };

  // Modify removeMatch - TODO: Should use DELETE /api/matches/:id endpoint
  const removeMatch = (id: string) => {
    // ... (keep existing logic for now, but be aware it saves *all* quinielas via updateQuiniela) ...
    if (!currentQuiniela || !canEditQuiniela(currentQuiniela)) {
      setError('No tienes permiso para eliminar partidos');
      return;
    }

    try {
      const updatedMatches = currentQuiniela.matches.filter(m => m.id !== id);
      const updatedParticipants = currentQuiniela.participants.map(participant => ({
        ...participant,
        predictions: participant.predictions.filter(p => p.matchId !== id)
      }));

      const updatedQuiniela = {
        ...currentQuiniela,
        matches: updatedMatches,
        participants: updatedParticipants
      };

      const participantsWithUpdatedPoints = updateParticipantPoints(
        updatedQuiniela.participants,
        updatedQuiniela.matches
      );
      
      const finalUpdatedQuiniela = {
        ...updatedQuiniela,
        participants: participantsWithUpdatedPoints
      };

      // This saves ALL quinielas - consider changing
      updateQuiniela(finalUpdatedQuiniela); 
    } catch (error) {
      console.error('Error removing match:', error);
      setError('Failed to remove match');
    }
  };

  // Modify joinQuiniela to use API
  const joinQuiniela = async (): Promise<{success: boolean; error?: string}> => {
    if (!currentQuiniela || !user) {
      const errorMsg = 'Debes iniciar sesión para unirte a una quiniela';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    // Basic check to prevent unnecessary API calls
    if (isUserParticipant(currentQuiniela.participants, user.id)) {
        const errorMsg = 'Ya eres participante de esta quiniela';
        // setError(errorMsg); // Maybe don't set global error for this
        return { success: false, error: errorMsg };
    }

    setIsJoining(true);
    setError(null);
    
    try {
      // Call API to add participant
      const result = await joinQuinielaOnServer(currentQuiniela.id, user.id);

      if (result && !(result as any).error) {
          const newParticipant = result as Participant;
          // Update local state on success
          const updatedQuiniela = {
              ...currentQuiniela,
              participants: [...currentQuiniela.participants, newParticipant]
          };
          setCurrentQuiniela(updatedQuiniela);
          // Also update the main list
          setQuinielas(prev => prev.map(q => q.id === updatedQuiniela.id ? updatedQuiniela : q));
          console.log("User joined successfully and local state updated.");
          return { success: true };
      } else {
          // Handle API error (e.g., already joined, user/quiniela not found)
          const errorMsg = (result as any)?.error || 'Error al unirte a la quiniela.';
          setError(errorMsg);
          return { success: false, error: errorMsg };
      }
    } catch (error) {
      // Catch unexpected errors during the process
      console.error('Error joining quiniela:', error);
      const errorMsg = 'Error inesperado al unirte a la quiniela.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsJoining(false);
    }
  };

  // Modify updatePrediction to handle an array of predictions
  const updatePrediction = async (predictionsToSave: Prediction[]): Promise<boolean> => {
    if (!currentQuiniela || !user) {
      setError('Debes iniciar sesión para actualizar predicciones');
      return false;
    }
    if (!predictionsToSave || predictionsToSave.length === 0) {
      console.log("updatePrediction called with no predictions.");
      return true; // Nothing to do
    }

    const participant = currentQuiniela.participants.find(p => p.userId === user.id);
    if (!participant || !participant.id) {
        setError('Participante no encontrado o ID de participante inválido.');
        console.error("Error: Participant not found or participant ID is missing.", participant);
        return false;
    }
    const participantId = participant.id;

    try {
      // Step 1: Call the API to save the batch of predictions
      // Pass the array directly
      const success = await savePredictionsToServer(participantId, predictionsToSave); 

      // Step 2: If API call was successful, update the local state
      // Create a map of the predictions being saved for quick lookup
      const predictionsMap = new Map(predictionsToSave.map(p => [p.matchId, p]));

      const updatedParticipants = currentQuiniela.participants.map(p => {
        if (p.userId !== user.id) return p;

        // Create a new predictions array for the current participant
        const existingPredictionsMap = new Map(p.predictions.map(ep => [ep.matchId, ep]));
        
        // Merge saved predictions into the existing ones
        predictionsMap.forEach((newPrediction, matchId) => {
            existingPredictionsMap.set(matchId, newPrediction);
        });

        return {
          ...p,
          // Convert map back to array
          predictions: Array.from(existingPredictionsMap.values()) 
        };
      });

      const updatedQuiniela = {
        ...currentQuiniela,
        participants: updatedParticipants
      };

      // Update the main quinielas array
      const updatedQuinielas = quinielas.map(q => 
        q.id === updatedQuiniela.id ? updatedQuiniela : q
      );
      setQuinielas(updatedQuinielas);

      // Update the current quiniela state
      setCurrentQuiniela(updatedQuiniela);

      console.log("Local state updated after successful prediction save.");
      return true; // Indicate success

    } catch (error) {
      // Catch the error thrown by savePredictionsToServer
      console.error('Error updating prediction(s):', error);
      // Use the error message from the API call if available
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar la(s) predicción(es)';
      setError(errorMessage); 
      return false; // Indicate failure
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
    // Get the ID from the state *before* the async operation
    const currentId = currentQuiniela?.id; 
    if (!currentId) {
      console.log("refreshCurrentQuiniela called but no currentQuiniela ID exists.");
      return;
    }

    console.log(`Refreshing data for quiniela ID: ${currentId}`);
    // No need to set loading here unless desired for detail view refresh
    // setIsLoading(true); 
    try {
      // Fetch only the specific quiniela using the new function
      const updatedQuiniela = await getQuinielaByIdFromS3(currentId);

      if (updatedQuiniela) {
        console.log(`Successfully refreshed quiniela: ${updatedQuiniela.name}`);
        // Update the state only if the ID still matches the one we intended to refresh
        // This prevents race conditions if the user navigates away quickly
        setCurrentQuiniela(prevQuiniela => {
          if (prevQuiniela?.id === currentId) {
            return updatedQuiniela;
          }
          // If the ID changed while fetching, discard the fetched data
          console.log("Quiniela ID changed during refresh, discarding fetched data.");
          return prevQuiniela; 
        });
      } else {
        // Quiniela might have been deleted or an error occurred
        console.warn(`Quiniela with ID ${currentId} not found during refresh. Clearing currentQuiniela.`);
        // If the quiniela is not found (e.g., deleted), clear it from the view
        setCurrentQuiniela(prevQuiniela => (prevQuiniela?.id === currentId ? null : prevQuiniela));
        // Optionally, reload the main list if needed
        // loadQuinielas(); 
      }
    } catch (error) {
      console.error(`Error refreshing current quiniela ${currentId}:`, error);
      setError(`Error refreshing quiniela ${currentId}`);
    } finally {
      // setIsLoading(false);
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
    loadQuinielas, // Keep function available
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
