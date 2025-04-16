import React, { useState, useEffect } from 'react';
import { useQuiniela } from '../context/QuinielaContext';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import { fetchUsers } from '../utils/api';
import { AlertCircle, Loader } from 'lucide-react';

const ParticipantForm: React.FC = () => {
  const { currentQuiniela, joinQuiniela, canEditQuiniela, isJoining } = useQuiniela();
  const { user } = useAuth();
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isCurrentUserAdded, setIsCurrentUserAdded] = useState<boolean>(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<boolean>(false);

  // Load available users from API
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const users = await fetchUsers();

        // Filter out users who are already participants
        const filteredUsers = users.filter(user => {
          if (!currentQuiniela) return true;
          return !currentQuiniela.participants.some(p => p.userId === user.id);
        });

        setAvailableUsers(filteredUsers);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };

    loadUsers();
  }, [currentQuiniela]);

  // Check if current user is already a participant
  useEffect(() => {
    if (user && currentQuiniela) {
      const isAdded = currentQuiniela.participants.some(p => p.userId === user.id);
      setIsCurrentUserAdded(isAdded);
    }
  }, [user, currentQuiniela]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    setJoinSuccess(false);
    
    try {
      const result = await joinQuiniela();
      if (result.success) {
        setJoinSuccess(true);
        // Only update this state if the join was successful
        setIsCurrentUserAdded(true);
      } else {
        setJoinError(result.error || 'Error al unirte a la quiniela. Intenta de nuevo.');
      }
    } catch (error) {
      setJoinError('Error al unirte a la quiniela. Intenta de nuevo.');
      console.error('Join quiniela error:', error);
    }
  };

  const isQuinielaAdmin = currentQuiniela && canEditQuiniela(currentQuiniela);

  // Don't show the form if user has already joined and is not an admin
  if (isCurrentUserAdded && !isQuinielaAdmin) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Unirse a Quiniela</h3>
      
      {joinError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
          <AlertCircle size={18} className="mr-2" />
          {joinError}
        </div>
      )}
      
      {joinSuccess && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          ¡Te has unido exitosamente a esta quiniela!
        </div>
      )}

      {!isCurrentUserAdded && user && (
        <form onSubmit={handleJoin} className="mb-4">
          <button
            type="submit"
            disabled={isJoining}
            className={`w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex justify-center items-center ${isJoining ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isJoining ? (
              <>
                <Loader size={18} className="animate-spin mr-2" />
                Procesando...
              </>
            ) : (
              'Unirme a esta quiniela'
            )}
          </button>
        </form>
      )}

      {isQuinielaAdmin && (
        <div className="text-sm text-gray-500 italic">
          Los usuarios pueden unirse directamente a esta quiniela.
          Como administrador, puedes ver todos los participantes en la sección de abajo.
        </div>
      )}
    </div>
  );
};

export default ParticipantForm;
