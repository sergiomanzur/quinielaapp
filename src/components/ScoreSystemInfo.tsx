import React from 'react';

interface ScoreSystemInfoProps {
  className?: string;
}

const ScoreSystemInfo: React.FC<ScoreSystemInfoProps> = ({ className = '' }) => {
  return (
    <div className={`bg-gray-50 p-4 rounded-lg ${className}`}>
      <h4 className="font-semibold mb-2">Sistema de Puntuación:</h4>
      <ul className="list-disc pl-5 text-xs text-gray-600">
        <li>4 puntos por acertar el resultado exacto</li>
        <li>3 puntos por acertar victoria visitante</li>
        <li>2 puntos por acertar empate</li>
        <li>1 punto por acertar victoria local</li>
      </ul>
      <div className="mt-3 p-2 border-l-4 border-blue-300 bg-blue-50">
        <p className="text-xs text-gray-700">
          <strong>Ejemplo:</strong> Para un partido que termina 2-1:
        </p>
        <ul className="text-xs text-gray-600 mt-1 space-y-1">
          <li>• Predicción 2-1: <span className="font-bold">4 puntos</span> (resultado exacto)</li>
          <li>• Predicción 1-0: <span className="font-bold">1 punto</span> (victoria local pero marcador incorrecto)</li>
          <li>• Predicción 2-2: <span className="font-bold">0 puntos</span> (resultado incorrecto)</li>
          <li>• Predicción 0-1: <span className="font-bold">0 puntos</span> (resultado incorrecto)</li>
        </ul>
      </div>
    </div>
  );
};

export default ScoreSystemInfo;
