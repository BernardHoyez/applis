
import React from 'react';

const Spinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center my-8">
      <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-lg text-gray-300">Traitement des photos...</p>
    </div>
  );
};

export default Spinner;
