import React, { useState, useRef, useEffect } from 'react';

interface FileNameInputProps {
  onSubmit: (name: string) => void;
  onCancel: () => void;
  placeholder?: string;
  initialValue?: string;
  paddingLeft?: number;
}

export function FileNameInput({ 
  onSubmit, 
  onCancel, 
  placeholder = "Enter name", 
  initialValue = "",
  paddingLeft = 0
}: FileNameInputProps) {
  const [name, setName] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Only cancel if clicking outside the form
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      onCancel();
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="flex items-center px-2 py-1.5"
      onBlur={handleBlur}
    >
      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full bg-gray-700 text-white px-2 py-1 rounded"
        style={{ paddingLeft: `${paddingLeft}rem` }}
      />
      <div className="flex items-center space-x-2 ml-2">
        <button
          type="submit"
          className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-2 py-1 text-sm text-gray-400 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
