import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
  message?: string;
}

export function LoadingSpinner({ size = 24, className = '', message }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center">
      <Loader2 
        className={`animate-spin ${className}`} 
        size={size}
      />
      {message && (
        <p className="mt-2 text-sm text-gray-400">{message}</p>
      )}
    </div>
  );
}

export function LoadingOverlay({ message }: { message?: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
      <LoadingSpinner size={32} message={message} />
    </div>
  );
}
