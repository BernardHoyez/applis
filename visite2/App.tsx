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
                delete stepToUpdate[field];
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
    const finalSteps = JSON.parse(JSON.stringify(steps)); // Deep copy
    const assetsToCache = new Set<string>();

    // Remplacer les blob URLs par des chemins relatifs et ajouter les fichiers au zip
    finalSteps.forEach((step: Step) => {
        (['image', 'thumbnail', 'video', 'audio'] as const).forEach(key => {
            const url = step[key];
            if (url && fileMap.has(url)) {
                const file = fileMap.get(url)!;
                const newPath = `./assets/${file.name}`;
                step[key] = newPath;
                assetsFolder?.file(file.name, file);
                assetsToCache.add(`/assets/${file.name}`);
            } else if (url && url.startsWith('./assets/')) {
                assetsToCache.add(url.substring(1)); // remove '.'
            }
        });
    });

    // 1. Tour data
    zip.file("tour.json", JSON.stringify({ tour: finalSteps }, null, 2));
    assetsToCache.add('/tour.json');

    // 2. HTML file
    zip.file("index.html", `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visite Virtuelle</title>
    <link rel="stylesheet" href="style.css">
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#111827"/>
</head>
<body>
    <main id="viewer">
        <div class="media-container"></div>
        <div class="info-panel">
            <h1 id="step-title"></h1>
            <p id="step-description"></p>
        </div>
    </main>
    <nav id="navigator">
        <!-- Thumbnails will be injected by JS -->
    </nav>
    <script src="viewer.js"></script>
</body>
</html>`);

    // 3. CSS file
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
.thumbnail.active { border-color: #3b82f6; transform: scale(1.05); }`);

    // 4. JavaScript viewer file
    zip.file("viewer.js", `
let steps = [];
let currentStepIndex = 0;

const mediaContainer = document.querySelector('.media-container');
const stepTitle = document.getElementById('step-title');
const stepDescription = document.getElementById('step-description');
const navigatorContainer = document.getElementById('navigator');

async function loadTour() {
    const response = await fetch('tour.json');
    const data = await response.json();
    steps = data.tour;
    if (steps.length > 0) {
        renderStep(0);
        renderNavigator();
    }
}

function renderStep(index) {
    if (index < 0 || index >= steps.length) return;
    currentStepIndex = index;
    const step = steps[index];
    
    mediaContainer.innerHTML = ''; // Clear previous media

    if (step.video) {
        const video = document.createElement('video');
        video.src = step.video;
        video.poster = step.image || '';
        video.controls = true;
        video.autoplay = true;
        video.muted = true; // Autoplay often requires mute
        video.loop = true;
        mediaContainer.appendChild(video);
    } else if (step.audio) {
        if (step.image) { // Show cover image
            const img = document.createElement('img');
            img.src = step.image;
            img.alt = step.title;
            mediaContainer.appendChild(img);
        }
        const audio = document.createElement('audio');
        audio.src = step.audio;
        audio.controls = true;
        audio.autoplay = false;
        mediaContainer.appendChild(audio);
    } else if (step.image) {
        const img = document.createElement('img');
        img.src = step.image;
        img.alt = step.title;
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
        thumb.alt = step.title;
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

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(reg => console.log('SW registered.', reg)).catch(err => console.log('SW registration failed: ', err));
    });
}

loadTour();
`);

    // 5. Manifest file
    zip.file("manifest.json", JSON.stringify({
        "name": "Visite Virtuelle", "short_name": "Visite", "start_url": ".", "display": "standalone", "background_color": "#111827", "theme_color": "#111827", "description": "Une visite virtuelle créée avec l'éditeur PWA.", "icons": [{"src":"/icons/icon-192.png","type":"image/png","sizes":"192x192"},{"src":"/icons/icon-512.png","type":"image/png","sizes":"512x512"}]
    }, null, 2));
    
    // 6. Service Worker
    const coreCacheUrls = ['/', '/index.html', '/style.css', '/viewer.js', '/manifest.json'];
    const allUrlsToCache = [...coreCacheUrls, ...Array.from(assetsToCache)];

    zip.file("sw.js", `
const CACHE_NAME = 'virtual-tour-cache-v${Date.now()}';
const urlsToCache = ${JSON.stringify(allUrlsToCache, null, 2)};

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Opened cache');
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

    // 7. Assets and icons folder with READMEs
    zip.folder("icons")?.file("README.md", "Placez vos icônes ici, par exemple icon-192.png et icon-512.png.");


    // 8. Generate and download zip
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