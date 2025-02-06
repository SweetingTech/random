import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, onClose, duration = 5000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = type === 'success' ? 'bg-green-600' : 'bg-red-600';
  const Icon = type === 'success' ? CheckCircle : AlertTriangle;

  return (
    <div
      className={`
        fixed bottom-4 right-4 flex items-center p-4 rounded-lg shadow-lg
        transform transition-all duration-300
        ${bgColor} text-white
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}
      `}
    >
      <Icon className="w-5 h-5 mr-2" />
      <span className="mr-4">{message}</span>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

interface ToastState {
  id: number;
  message: string;
  type: ToastType;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const addToast = (message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const ToastContainer = () => (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );

  return {
    addToast,
    ToastContainer
  };
}
