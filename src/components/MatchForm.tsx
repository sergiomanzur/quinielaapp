import React, { useState } from 'react';
import { useQuiniela } from '../context/QuinielaContext';

const MatchForm: React.FC = () => {
  const { addMatch } = useQuiniela();
  const [formData, setFormData] = useState({
    homeTeam: '',
    awayTeam: '',
    date: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMatch(formData);
    setFormData({ homeTeam: '', awayTeam: '', date: '' });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Agregar Partido</h3>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="homeTeam" className="block text-sm font-medium text-gray-700 mb-1">
              Equipo Local
            </label>
            <input
              type="text"
              id="homeTeam"
              name="homeTeam"
              value={formData.homeTeam}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div>
            <label htmlFor="awayTeam" className="block text-sm font-medium text-gray-700 mb-1">
              Equipo Visitante
            </label>
            <input
              type="text"
              id="awayTeam"
              name="awayTeam"
              value={formData.awayTeam}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha del Partido
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Agregar Partido
          </button>
        </div>
      </form>
    </div>
  );
};

export default MatchForm;
