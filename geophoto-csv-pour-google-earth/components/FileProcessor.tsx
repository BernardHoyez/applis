
import React, { useState, useCallback } from 'react';
import { showPicker, getFilesMetadata } from '../services/googleApiService';
import type { ProcessedPhoto } from '../types';
import Spinner from './Spinner';
import PhotoCard from './PhotoCard';

const FileProcessor: React.FC = () => {
  const [photos, setPhotos] = useState<ProcessedPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processed, setProcessed] = useState(false);

  const handleFileSelection = useCallback(async (docs: any[]) => {
    if (docs.length === 0) return;
    setIsLoading(true);
    setError(null);
    setPhotos([]);
    setProcessed(false);
    
    try {
      const fileIds = docs.map(doc => doc.id);
      const processedPhotos = await getFilesMetadata(fileIds);
      setPhotos(processedPhotos);
    } catch (err) {
      console.error("Error processing files:", err);
      setError("Une erreur est survenue lors de la récupération des métadonnées des photos.");
    } finally {
      setIsLoading(false);
      setProcessed(true);
    }
  }, []);

  const openPicker = useCallback(() => {
    showPicker(handleFileSelection);
  }, [handleFileSelection]);
  
  const downloadCsv = () => {
    if (photos.length === 0) return;
    
    const header = ['Name', 'Description', 'Latitude', 'Longitude', 'Icon'];
    const starIconUrl = 'http://maps.google.com/mapfiles/kml/paddle/ylw-stars.png';
    
    const rows = photos.map(photo => [
      `"${photo.name.replace(/"/g, '""')}"`,
      `"<img src='${photo.thumbnailLink}' alt='${photo.name.replace(/'/g, "''")}' width='400'> "`,
      photo.latitude,
      photo.longitude,
      starIconUrl
    ]);
    
    const csvContent = [header.join(','), ...rows.map(row => row.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'google_earth_photos.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="w-full bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
        <div className="text-left">
          <h2 className="text-2xl font-bold text-blue-300">Étape 1: Sélectionnez vos photos</h2>
          <p className="text-gray-400">Cliquez sur le bouton pour choisir des photos depuis votre Google Drive.</p>
        </div>
        <button
            onClick={openPicker}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg transition-transform transform hover:scale-105 duration-300 flex items-center space-x-2"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
            <span>Ouvrir Google Drive</span>
        </button>
      </div>

      {isLoading && <Spinner />}

      {!isLoading && processed && (
        <div className="mt-8 text-left">
           <h2 className="text-2xl font-bold text-blue-300 mb-4">Étape 2: Résultat</h2>
           {photos.length > 0 ? (
             <>
                <p className="text-green-400 bg-green-900/50 p-3 rounded-lg mb-4">
                    {photos.length} photo(s) avec des données de géolocalisation trouvée(s).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                    {photos.map(photo => <PhotoCard key={photo.id} photo={photo} />)}
                </div>
                <button
                    onClick={downloadCsv}
                    className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg transition-transform transform hover:scale-105 duration-300 flex items-center justify-center space-x-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Télécharger le fichier CSV</span>
                </button>
             </>
           ) : (
            <p className="text-yellow-400 bg-yellow-900/50 p-3 rounded-lg">
                Aucune photo avec des données de géolocalisation n'a été trouvée parmi les fichiers sélectionnés.
            </p>
           )}
        </div>
      )}
      
      {error && <p className="mt-4 text-red-400 bg-red-900/50 p-3 rounded-lg">{error}</p>}
    </div>
  );
};

export default FileProcessor;
