
import React, { useState, useEffect, useCallback } from 'react';
import type { UserProfile, ProcessedPhoto } from './types';
import { initGoogleClient, handleSignIn, handleSignOut } from './services/googleApiService';
import Header from './components/Header';
import Login from './components/Login';
import FileProcessor from './components/FileProcessor';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isGapiLoaded, setIsGapiLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateUser = useCallback((profile: UserProfile | null) => {
    setUser(profile);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        await initGoogleClient(() => {
          setIsGapiLoaded(true);
        });
      } catch (err) {
        setError("Erreur lors de l'initialisation de l'API Google. Veuillez rafraîchir la page.");
        console.error("Initialization error:", err);
      }
    };
    init();
  }, []);

  const onSignIn = useCallback(async () => {
    if (!isGapiLoaded) {
      setError("Les services Google ne sont pas encore prêts. Veuillez patienter.");
      return;
    }
    setError(null);
    try {
      await handleSignIn(updateUser);
    } catch (err) {
      setError("Échec de la connexion. Veuillez réessayer.");
      console.error("Sign in error:", err);
    }
  }, [isGapiLoaded, updateUser]);

  const onSignOut = useCallback(() => {
    handleSignOut(updateUser);
  }, [updateUser]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <Header user={user} onSignOut={onSignOut} />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          {!user ? (
            <Login onSignIn={onSignIn} disabled={!isGapiLoaded} />
          ) : (
            <FileProcessor />
          )}
          {error && <p className="mt-4 text-red-400 bg-red-900/50 p-3 rounded-lg">{error}</p>}
        </div>
      </main>
      <footer className="text-center py-4 text-gray-500 text-sm">
        <p>Créé avec passion pour les explorateurs de données géographiques.</p>
      </footer>
    </div>
  );
};

export default App;
