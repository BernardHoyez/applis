export interface Step {
  id: string;
  title: string;
  description: string;
  image: string;      // URL de l'image principale, ou poster pour vidéo/audio.
  thumbnail: string;  // URL de la miniature pour la navigation.
  video?: string;     // URL optionnelle pour la vidéo.
  audio?: string;     // URL optionnelle pour l'audio.
}
