
import React from 'react';
import type { ProcessedPhoto } from '../types';

interface PhotoCardProps {
  photo: ProcessedPhoto;
}

const PhotoCard: React.FC<PhotoCardProps> = ({ photo }) => {
  return (
    <div className="bg-gray-700 rounded-lg overflow-hidden shadow-lg transform transition-all hover:scale-105 hover:shadow-blue-500/30">
      <img src={photo.thumbnailLink} alt={photo.name} className="w-full h-32 object-cover" />
      <div className="p-3">
        <p className="text-sm font-semibold text-white truncate" title={photo.name}>{photo.name}</p>
        <p className="text-xs text-gray-400">
          Lat: {photo.latitude.toFixed(4)}, Lon: {photo.longitude.toFixed(4)}
        </p>
      </div>
    </div>
  );
};

export default PhotoCard;
