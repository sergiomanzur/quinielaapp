import React, { useState, useEffect } from 'react';
import { useQuiniela } from '../context/QuinielaContext';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import { fetchUsers } from '../utils/api';

const ParticipantForm: React.FC = () => {
  const { currentQuiniela, joinQuiniela, canEditQuiniela } = useQuiniela();
  const { user } = useAuth();
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isCurrentUserAdded, setIsCurrentUserAdded] = useState<boolean>(false);

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

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    joinQuiniela();
  };

  const isQuinielaAdmin = currentQuiniela && canEditQuiniela(currentQuiniela);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Participantes</h3>
      
      {!isCurrentUserAdded && user && (
        <form onSubmit={handleJoin} className="mb-4">
          <button
            type="submit"
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Unirme a esta quiniela
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
