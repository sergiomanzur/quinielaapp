import React, { useState, useEffect } from 'react';
import { useQuiniela } from '../context/QuinielaContext';
import { useAuth } from '../context/AuthContext';
import { Trash2, Eye, Plus } from 'lucide-react';

const QuinielaList: React.FC = () => {
  const { quinielas, setCurrentQuiniela, createQuiniela, removeQuiniela, isLoading, error, loadQuinielas } = useQuiniela();
  const { user, isAdmin } = useAuth();
  const [newQuinielaName, setNewQuinielaName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Refresh data when component mounts
  useEffect(() => {
    // Load fresh data when the list is displayed
    loadQuinielas();
  }, []);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newQuinielaName.trim()) {
      createQuiniela(newQuinielaName.trim());
      setNewQuinielaName('');
      setShowCreateForm(false);
    }
  };

  // Add a confirmation prompt before deleting a quiniela
  const handleDeleteQuiniela = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent clicking through to view the quiniela
    if (window.confirm(`¿Estás seguro de eliminar la quiniela "${name}"? Esta acción eliminará todos los partidos y predicciones asociados y no se puede deshacer.`)) {
      removeQuiniela(id);
    }
  };

  if (isLoading) {
    return <div className="text-center py-10">Cargando quinielas...</div>;
  }

  return (
    <div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Mis Quinielas</h2>
        {isAdmin() && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            <Plus size={18} className="mr-2" />
            Crear Quiniela
          </button>
        )}
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateSubmit} className="mb-6 bg-white p-4 rounded-md shadow">
          <div className="flex gap-3">
            <input
              type="text"
              value={newQuinielaName}
              onChange={(e) => setNewQuinielaName(e.target.value)}
              placeholder="Nombre de la quiniela"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Crear
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {quinielas.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No hay quinielas disponibles.</p>
          {isAdmin() && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Crear tu primera quiniela
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quinielas.map(quiniela => (
            <div key={quiniela.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{quiniela.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentQuiniela(quiniela)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Eye size={20} />
                  </button>
                  {(isAdmin() || quiniela.createdBy === user?.id) && (
                    <button
                      onClick={(e) => handleDeleteQuiniela(quiniela.id, quiniela.name, e)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-500">
                {quiniela.matches.length} partidos
              </p>
              <p className="text-sm text-gray-500">
                {quiniela.participants.length} participantes
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuinielaList;
