
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SoundContextType {
  isSoundEnabled: boolean;
  toggleSound: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('mune_sound_enabled');
    if (saved !== null) {
      setIsSoundEnabled(saved === 'true');
    }
  }, []);

  const toggleSound = () => {
    setIsSoundEnabled(prev => {
      const newValue = !prev;
      localStorage.setItem('mune_sound_enabled', String(newValue));
      return newValue;
    });
  };

  return (
    <SoundContext.Provider value={{ isSoundEnabled, toggleSound }}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSoundSettings = () => {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSoundSettings must be used within a SoundProvider');
  }
  return context;
};
