import React, { useState } from 'react';
import { useQuiniela } from '../context/QuinielaContext';
import { toCST } from '../utils/dateUtils';
import { ChevronDown, ChevronUp } from 'lucide-react';

const MATCH_TYPE_SUGGESTIONS = ['LIGA', 'COPA', 'AMISTOSO', 'MUNDIAL', 'MUNDIAL DE CLUBES', 'CHAMPIONS LEAGUE', 'EUROPA LEAGUE', 'ELIMINATORIA'];

const MatchForm: React.FC = () => {
  const { addMatch } = useQuiniela();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    homeTeam: '',
    awayTeam: '',
    date: '',
    matchType: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMatch({
      ...formData,
      date: toCST(formData.date),
      matchType: formData.matchType.trim().toUpperCase() || undefined,
    });
    setFormData({ homeTeam: '', awayTeam: '', date: '', matchType: '' });
  };

  return (
    <div className="bg-white rounded-lg shadow-md mb-6">
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <h3 className="text-lg font-semibold">Agregar Partido</h3>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {isOpen && (
        <div className="px-6 pb-6">
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
              <label htmlFor="matchType" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Partido <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                id="matchType"
                name="matchType"
                list="matchTypeSuggestions"
                value={formData.matchType}
                onChange={handleChange}
                placeholder="Ej: LIGA, COPA, AMISTOSO..."
                className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <datalist id="matchTypeSuggestions">
                {MATCH_TYPE_SUGGESTIONS.map(type => (
                  <option key={type} value={type} />
                ))}
              </datalist>
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
      )}
    </div>
  );
};

export default MatchForm;
