
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
            return `${val.toFixed(4)}${dir}`;
        };

        const handleSuccess = (pos) => {
            const { latitude, longitude } = pos.coords;
            gpsDisplay.innerHTML = `Lat ${formatCoordinate(latitude, 'lat')} | Lon ${formatCoordinate(longitude, 'lon')}`;
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
