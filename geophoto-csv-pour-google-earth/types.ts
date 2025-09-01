
export interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

export interface ProcessedPhoto {
  id: string;
  name: string;
  thumbnailLink: string;
  latitude: number;
  longitude: number;
}
