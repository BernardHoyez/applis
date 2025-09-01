
import React from 'react';
import type { UserProfile } from '../types';

interface HeaderProps {
  user: UserProfile | null;
  onSignOut: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onSignOut }) => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm shadow-lg sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <h1 className="text-xl font-bold text-white tracking-wider">GeoPhoto CSV</h1>
        </div>
        {user && (
          <div className="flex items-center space-x-4">
            <img src={user.picture} alt={user.name} className="h-10 w-10 rounded-full border-2 border-blue-400" />
            <div>
                <p className="font-semibold text-white">{user.name}</p>
                <p className="text-sm text-gray-400">{user.email}</p>
            </div>
            <button
              onClick={onSignOut}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-300"
            >
              Déconnexion
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
