import React, { useState, useCallback, useEffect } from 'react';
import { Step } from './types';
import Header from './components/Header';
import StepViewer from './components/StepViewer';
import StepNavigator from './components/StepNavigator';

// Déclare JSZip pour TypeScript car il est chargé via CDN
declare const JSZip: any;

interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
  };
}

const initialSteps: Step[] = [
  {
    id: 'step-1',
    title: 'Étape 1: Le Hall d\'Entrée',
    description: 'Bienvenue dans le hall principal. Admirez l\'architecture et la hauteur sous plafond. Dans le mode éditeur, vous pouvez modifier ce texte et choisir vos propres médias.',
    image: './assets/hall.jpg',
    thumbnail: './assets/hall_thumb.jpg',
  },
  {
    id: 'step-2',
    title: 'Étape 2: La Salle d\'Exposition',
    description: 'Cette salle présente des œuvres d\'art uniques. Chaque pièce raconte une histoire. Utilisez le bandeau en bas pour naviguer ou modifier la visite.',
    image: './assets/expo.jpg',
    thumbnail: './assets/expo_thumb.jpg',
    video: '',
    audio: ''
  },
];

const App: React.FC = () => {
  const [isEditorMode, setIsEditorMode] = useState<boolean>(true);
  const [steps, setSteps] = useState<Step[]>(initialSteps);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [fileMap, setFileMap] = useState<Map<string, File>>(new Map());
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    // Nettoyage des Blob URLs pour éviter les fuites de mémoire quand le composant est démonté
    return () => {
      fileMap.forEach((_, url) => URL.revokeObjectURL(url));
    };
  }, [fileMap]);

  useEffect(() => {
    // Gestion de la géolocalisation
    if (!navigator.geolocation) {
      setLocationError("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    const handleSuccess = (pos: GeolocationPosition) => {
      setPosition(pos);
      setLocationError(null);
    };

    const handleError = (error: GeolocationPositionError) => {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          setLocationError("Permission de localisation refusée.");
          break;
        case error.POSITION_UNAVAILABLE:
          setLocationError("Position non disponible.");
          break;
        case error.TIMEOUT:
          setLocationError("La demande de position a expiré.");
          break;
        default:
          setLocationError("Une erreur inconnue est survenue.");
          break;
      }
    };

    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

    // Nettoyage de l'abonnement
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const handleToggleMode = useCallback(() => {
    setIsEditorMode(prev => !prev);
  }, []);

  const handleSelectStep = useCallback((index: number) => {
    setCurrentStepIndex(index);
  }, []);
  
  const handleUpdateStep = useCallback((updatedStep: Step) => {
    setSteps(prevSteps => 
      prevSteps.map(step => step.id === updatedStep.id ? updatedStep : step)
    );
  }, []);

  const handleFileChange = useCallback((stepId: string, field: 'image' | 'video' | 'audio' | 'thumbnail', file: File | null) => {
      setSteps(prevSteps => {
          const newSteps = [...prevSteps];
          const stepIndex = newSteps.findIndex(s => s.id === stepId);
          if (stepIndex === -1) return prevSteps;

          const stepToUpdate = { ...newSteps[stepIndex] };
          const oldUrl = stepToUpdate[field];

          // Révoquer l'ancienne URL si c'était une Blob URL
          if (oldUrl && oldUrl.startsWith('blob:')) {
              URL.revokeObjectURL(oldUrl);
              setFileMap(prevMap => {
                  const newMap = new Map(prevMap);
                  newMap.delete(oldUrl);
                  return newMap;
              });
          }

          if (file) {
              const newUrl = URL.createObjectURL(file);
              stepToUpdate[field] = newUrl;
              setFileMap(prevMap => new Map(prevMap).set(newUrl, file));
          } else {
              // Si le fichier est null (retiré), on vide le champ
              if (field === 'video' || field === 'audio') {
                stepToUpdate[field] = '';
              } else {
                stepToUpdate[field] = '';
              }
          }

          newSteps[stepIndex] = stepToUpdate;
          return newSteps;
      });
  }, []);


  const handleAddStep = useCallback(() => {
    const newStepId = `step-${Date.now()}`;
    const newStep: Step = {
      id: newStepId,
      title: 'Nouvelle Étape',
      description: 'Ajoutez une description ici.',
      image: '',
      thumbnail: '',
    };
    setSteps(prevSteps => [...prevSteps, newStep]);
    setCurrentStepIndex(steps.length);
  }, [steps.length]);

  const handleDeleteStep = useCallback((idToDelete: string) => {
    const stepToDelete = steps.find(step => step.id === idToDelete);
    if (stepToDelete) {
        // Nettoyer les Blob URLs associées
        const urlsToRevoke = [stepToDelete.image, stepToDelete.thumbnail, stepToDelete.video, stepToDelete.audio].filter(url => url && url.startsWith('blob:')) as string[];
        if (urlsToRevoke.length > 0) {
            urlsToRevoke.forEach(url => URL.revokeObjectURL(url));
            setFileMap(prevMap => {
                const newMap = new Map(prevMap);
                urlsToRevoke.forEach(url => newMap.delete(url));
                return newMap;
            });
        }
    }

    setSteps(prevSteps => {
      const stepIndexToDelete = prevSteps.findIndex(step => step.id === idToDelete);
      if (stepIndexToDelete === -1) return prevSteps;

      const newSteps = prevSteps.filter(step => step.id !== idToDelete);
      
      if(newSteps.length === 0) {
          setCurrentStepIndex(0);
          return [];
      }

      if (currentStepIndex >= stepIndexToDelete) {
        setCurrentStepIndex(Math.max(0, currentStepIndex - 1));
      }

      return newSteps;
    });
  }, [currentStepIndex, steps]);

  const handleMoveStep = useCallback((fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= steps.length) return;

    setSteps(prevSteps => {
      const newSteps = [...prevSteps];
      const [movedItem] = newSteps.splice(fromIndex, 1);
      newSteps.splice(toIndex, 0, movedItem);

      if (currentStepIndex === fromIndex) {
        setCurrentStepIndex(toIndex);
      } else if (currentStepIndex > fromIndex && currentStepIndex <= toIndex) {
        setCurrentStepIndex(currentStepIndex - 1);
      } else if (currentStepIndex < fromIndex && currentStepIndex >= toIndex) {
        setCurrentStepIndex(currentStepIndex + 1);
      }

      return newSteps;
    });
  }, [steps.length, currentStepIndex]);
  
  const handleExportJson = useCallback(() => {
      // Pour l'export JSON, nous ne voulons pas des blob URLs. On les remplace par les noms de fichiers.
      const sanitizedSteps = steps.map(step => {
        const newStep = {...step};
        (['image', 'thumbnail', 'video', 'audio'] as const).forEach(key => {
            const url = newStep[key];
            if (url && fileMap.has(url)) {
                newStep[key] = `./assets/${fileMap.get(url)!.name}`;
            }
        });
        return newStep;
      });

      const dataStr = JSON.stringify({ tour: sanitizedSteps }, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = 'virtual-tour.json';
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
  }, [steps, fileMap]);

  const handleExportPwa = useCallback(async () => {
    const zip = new JSZip();
    const assetsFolder = zip.folder("assets");
    const iconsFolder = zip.folder("icons");

    const finalSteps = JSON.parse(JSON.stringify(steps)); // Deep copy
    const assetsToCache = new Set<string>();

    finalSteps.forEach((step: Step) => {
        (['image', 'thumbnail', 'video', 'audio'] as const).forEach(key => {
            const url = step[key];
            if (url && fileMap.has(url)) {
                const file = fileMap.get(url)!;
                const newPath = `./assets/${file.name}`;
                step[key] = newPath;
                assetsFolder?.file(file.name, file);
                assetsToCache.add(newPath);
            } else if (url && (url.startsWith('./assets/') || url.startsWith('assets/'))) {
                 const cleanPath = url.startsWith('.') ? url : `./${url}`;
                 assetsToCache.add(cleanPath);
            }
        });
    });

    assetsToCache.add('./tour.json');
    zip.file("tour.json", JSON.stringify({ tour: finalSteps }, null, 2));

    zip.file("index.html", `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visite Virtuelle</title>
    <link rel="stylesheet" href="./style.css">
    <link rel="manifest" href="./manifest.json">
    <meta name="theme-color" content="#111827"/>
</head>
<body>
    <div id="gps-display"></div>
    <main id="viewer">
        <div class="media-container"></div>
        <div class="info-panel">
            <h1 id="step-title"></h1>
            <p id="step-description"></p>
        </div>
    </main>
    <nav id="navigator">
        <!-- Thumbnails injected by JS -->
    </nav>
    <script src="./viewer.js"></script>
</body>
</html>`);

    zip.file("style.css", `body { margin: 0; font-family: sans-serif; background-color: #111827; color: #f3f4f6; display: flex; flex-direction: column; height: 100vh; }
main#viewer { flex-grow: 1; position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: flex-end; }
.media-container { position: absolute; inset: 0; }
.media-container img, .media-container video { width: 100%; height: 100%; object-fit: cover; }
.media-container audio { position: absolute; bottom: 20px; left: 20px; right: 20px; width: calc(100% - 40px); z-index: 20; }
.info-panel { position: relative; z-index: 10; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); padding: 5rem 2rem 2rem; }
#step-title { font-size: 2.5rem; margin: 0 0 1rem; text-shadow: 2px 2px 4px #000; }
#step-description { font-size: 1.2rem; line-height: 1.6; max-w: 800px; text-shadow: 1px 1px 2px #000; }
nav#navigator { flex-shrink: 0; background-color: rgba(17, 24, 39, 0.8); backdrop-filter: blur(10px); padding: 1rem; overflow-x: auto; white-space: nowrap; }
.thumbnail { width: 150px; height: 90px; object-fit: cover; border-radius: 8px; margin-right: 1rem; cursor: pointer; border: 3px solid transparent; transition: all 0.3s ease; }
.thumbnail.active { border-color: #3b82f6; transform: scale(1.05); }
#gps-display { position: absolute; top: 1rem; left: 1rem; background-color: rgba(0,0,0,0.6); backdrop-filter: blur(5px); color: white; font-family: monospace; font-size: 0.875rem; padding: 0.5rem; border-radius: 0.5rem; box-shadow: 0 2px 10px rgba(0,0,0,0.3); z-index: 30; max-width: calc(100% - 2rem);}`);

    zip.file("viewer.js", `
document.addEventListener('DOMContentLoaded', () => {
    let steps = [];
    let currentStepIndex = 0;

    const mediaContainer = document.querySelector('.media-container');
    const stepTitle = document.getElementById('step-title');
    const stepDescription = document.getElementById('step-description');
    const navigatorContainer = document.getElementById('navigator');

    function renderStep(index) {
        if (index < 0 || index >= steps.length) return;
        currentStepIndex = index;
        const step = steps[index];
        
        mediaContainer.innerHTML = '';

        if (step.video) {
            const video = document.createElement('video');
            video.src = step.video;
            video.poster = step.image || '';
            video.controls = true; video.autoplay = true; video.muted = true; video.loop = true;
            mediaContainer.appendChild(video);
        } else if (step.audio) {
            if (step.image) {
                const img = document.createElement('img');
                img.src = step.image;
                mediaContainer.appendChild(img);
            }
            const audio = document.createElement('audio');
            audio.src = step.audio;
            audio.controls = true; audio.autoplay = false;
            mediaContainer.appendChild(audio);
        } else if (step.image) {
            const img = document.createElement('img');
            img.src = step.image;
            mediaContainer.appendChild(img);
        }

        stepTitle.textContent = step.title;
        stepDescription.textContent = step.description;
        updateActiveThumbnail();
    }

    function renderNavigator() {
        navigatorContainer.innerHTML = '';
        steps.forEach((step, index) => {
            const thumb = document.createElement('img');
            thumb.src = step.thumbnail;
            thumb.className = 'thumbnail';
            thumb.onclick = () => renderStep(index);
            navigatorContainer.appendChild(thumb);
        });
        updateActiveThumbnail();
    }

    function updateActiveThumbnail() {
        const thumbnails = navigatorContainer.querySelectorAll('.thumbnail');
        thumbnails.forEach((thumb, index) => {
            thumb.classList.toggle('active', index === currentStepIndex);
        });
    }

    async function loadTour() {
        try {
            const response = await fetch('./tour.json');
            if (!response.ok) throw new Error('Failed to load tour data');
            const data = await response.json();
            steps = data.tour;
            if (steps.length > 0) {
                renderStep(0);
                renderNavigator();
            }
        } catch (error) {
            console.error(error);
            stepTitle.textContent = "Erreur de chargement";
            stepDescription.textContent = "Impossible de charger les données de la visite. Vérifiez que le fichier tour.json est présent.";
        }
    }
    
    function initGeolocation() {
        const gpsDisplay = document.getElementById('gps-display');
        if (!gpsDisplay) return;

        if (window.location.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
            gpsDisplay.textContent = "Erreur: La géolocalisation nécessite HTTPS.";
            return;
        }

        if (!navigator.geolocation) {
            gpsDisplay.textContent = "Géolocalisation non supportée.";
            return;
        }

        const formatCoordinate = (coordinate, type) => {
            const val = Math.abs(coordinate);
            const dir = type === 'lat' ? (coordinate >= 0 ? 'N' : 'S') : (coordinate >= 0 ? 'E' : 'W');
            return \`\${val.toFixed(4)}\${dir}\`;
        };

        const handleSuccess = (pos) => {
            const { latitude, longitude } = pos.coords;
            gpsDisplay.innerHTML = \`Lat \${formatCoordinate(latitude, 'lat')} | Lon \${formatCoordinate(longitude, 'lon')}\`;
        };

        const handleError = (error) => {
            let message = "Erreur de localisation.";
            if (error.code === 1) message = "Permission de localisation refusée.";
            if (error.code === 2) message = "Position non disponible.";
            if (error.code === 3) message = "Timeout.";
            gpsDisplay.textContent = message;
        };
        
        gpsDisplay.textContent = "Recherche de la position...";
        navigator.geolocation.watchPosition(handleSuccess, handleError, {
            enableHighAccuracy: true, timeout: 10000, maximumAge: 0,
        });
    }

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').then(reg => console.log('SW registered.', reg)).catch(err => console.log('SW registration failed: ', err));
        });
    }

    loadTour();
    initGeolocation();
});
`);

    const icon192 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width="192" height="192"><rect width="192" height="192" rx="32" fill="#3b82f6"/><path d="M56 144l32-48 24 24 40-40" stroke="white" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><circle cx="128" cy="64" r="12" fill="white"/></svg>`;
    const icon512 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><rect width="512" height="512" rx="85" fill="#3b82f6"/><path d="M150 400l85-128 64 64 106-106" stroke="white" stroke-width="32" stroke-linecap="round" stroke-linejoin="round"/><circle cx="341" cy="171" r="32" fill="white"/></svg>`;
    iconsFolder?.file("icon-192.svg", icon192);
    iconsFolder?.file("icon-512.svg", icon512);
    assetsToCache.add('./icons/icon-192.svg');
    assetsToCache.add('./icons/icon-512.svg');
    
    zip.file("manifest.json", JSON.stringify({
        "name": "Visite Virtuelle", "short_name": "Visite", "start_url": ".", "display": "standalone", "background_color": "#111827", "theme_color": "#111827", "description": "Une visite virtuelle créée avec l'éditeur PWA.", "icons": [{"src":"./icons/icon-192.svg","type":"image/svg+xml","sizes":"192x192"},{"src":"./icons/icon-512.svg","type":"image/svg+xml","sizes":"512x512"}]
    }, null, 2));
    assetsToCache.add('./manifest.json');

    const coreCacheUrls = ['./', './index.html', './style.css', './viewer.js'];
    const allUrlsToCache = [...new Set([...coreCacheUrls, ...Array.from(assetsToCache)])];

    zip.file("sw.js", `
const CACHE_NAME = 'virtual-tour-cache-v${Date.now()}';
const urlsToCache = ${JSON.stringify(allUrlsToCache, null, 2)};

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Opened cache and caching files:', urlsToCache);
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
`);

    zip.generateAsync({type:"blob"}).then(function(content: any) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = "virtual-tour-pwa.zip";
        link.click();
        URL.revokeObjectURL(link.href);
    });

  }, [steps, fileMap]);


  const currentStep = steps[currentStepIndex];

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans">
      <Header 
        isEditorMode={isEditorMode} 
        onToggleMode={handleToggleMode}
        onExportJson={handleExportJson}
        onExportPwa={handleExportPwa}
      />
      <main className="flex-grow flex flex-col overflow-hidden relative">
        {currentStep ? (
          <StepViewer 
            key={currentStep.id}
            step={currentStep} 
            isEditorMode={isEditorMode} 
            onUpdateStep={handleUpdateStep}
            onFileChange={handleFileChange}
            position={position}
            locationError={locationError}
          />
        ) : (
           <div className="flex-grow flex items-center justify-center bg-gray-800">
             <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-400">Aucune étape disponible.</h2>
                <p className="text-gray-500 mt-2">Passez en mode éditeur pour ajouter votre première étape.</p>
             </div>
           </div>
        )}
      </main>
      <StepNavigator
        steps={steps}
        currentStepIndex={currentStepIndex}
        isEditorMode={isEditorMode}
        onSelectStep={handleSelectStep}
        onAddStep={handleAddStep}
        onDeleteStep={handleDeleteStep}
        onMoveStep={handleMoveStep}
      />
    </div>
  );
};

export default App;
