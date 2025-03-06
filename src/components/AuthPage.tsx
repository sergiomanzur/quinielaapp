import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import { Trophy } from 'lucide-react';

const AuthPage: React.FC = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-500 to-green-700 flex flex-col justify-center items-center px-4 py-12">
      <div className="mb-8 flex flex-col items-center">
        <Trophy size={64} className="text-yellow-300 mb-4" />
        <h1 className="text-4xl font-bold text-white text-center">Quiniela de Fútbol</h1>
      </div>
      
      <div className="w-full max-w-md">
        {isLoginMode ? <Login /> : <Register />}
        
        <div className="mt-4 text-center">
          <button 
            onClick={() => setIsLoginMode(!isLoginMode)}
            className="text-white hover:text-green-200 underline"
          >
            {isLoginMode ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
