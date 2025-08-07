import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="relative">
        {/* Outer ring */}
        <div className="w-12 h-12 border-4 border-green-200 rounded-full animate-spin">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-green-600 rounded-full animate-spin"></div>
        </div>
        
        {/* Inner dot */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-green-600 rounded-full animate-pulse"></div>
        
        {/* Glow effect */}
        <div className="absolute inset-0 w-12 h-12 bg-green-500/20 rounded-full blur-lg animate-pulse"></div>
      </div>
    </div>
  );
};

export default LoadingSpinner; 