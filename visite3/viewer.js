
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
