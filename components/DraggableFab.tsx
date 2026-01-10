import React, { useState, useEffect, useRef } from 'react';
import { PenTool } from 'lucide-react';
import { useGameSound } from '../hooks/useGameSound';

interface DraggableFabProps {
  onClick: () => void;
}

const DraggableFab: React.FC<DraggableFabProps> = ({ onClick }) => {
  // Default position: Bottom Right (approximate safe area)
  const [position, setPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 100 });
  const [isDragging, setIsDragging] = useState(false);
  
  const dragStartPos = useRef({ x: 0, y: 0 });
  const initialBtnPos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  // Load saved position on mount AND Setup Resize Listener (Orientation Change)
  useEffect(() => {
    // 1. Load from Storage
    const saved = localStorage.getItem('mune_fab_pos');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.x === 'number' && typeof parsed.y === 'number') {
           setPosition(parsed);
        }
      } catch (e) {}
    }

    // 2. Ensure it stays on screen (Clamp)
    const clampPosition = () => {
      setPosition(prev => {
        const BUTTON_SIZE = 70; // 56px button + margin
        const maxX = window.innerWidth - BUTTON_SIZE;
        const maxY = window.innerHeight - BUTTON_SIZE;
        
        // If out of bounds, bring it back
        if (prev.x > maxX || prev.y > maxY) {
           return {
             x: Math.min(Math.max(10, prev.x), maxX),
             y: Math.min(Math.max(10, prev.y), maxY)
           };
        }
        return prev;
      });
    };

    // Run check immediately (fixes invalid loaded state) and whenever window resizes
    clampPosition();
    window.addEventListener('resize', clampPosition);
    
    return () => window.removeEventListener('resize', clampPosition);
  }, []);

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    hasMoved.current = false;
    dragStartPos.current = { x: clientX, y: clientY };
    initialBtnPos.current = { ...position };
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;

    const deltaX = clientX - dragStartPos.current.x;
    const deltaY = clientY - dragStartPos.current.y;

    // Threshold check to distinguish click from drag (5px buffer)
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      hasMoved.current = true;
    }

    if (hasMoved.current) {
        let newX = initialBtnPos.current.x + deltaX;
        let newY = initialBtnPos.current.y + deltaY;

        // Boundary constraints (Button size approx 64px)
        const BUTTON_SIZE = 64;
        const SAFE_MARGIN = 10;
        
        newX = Math.max(SAFE_MARGIN, Math.min(window.innerWidth - BUTTON_SIZE - SAFE_MARGIN, newX));
        newY = Math.max(SAFE_MARGIN, Math.min(window.innerHeight - BUTTON_SIZE - SAFE_MARGIN, newY));

        setPosition({ x: newX, y: newY });
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
    if (!hasMoved.current) {
      onClick();
    } else {
      // Save position if moved
      localStorage.setItem('mune_fab_pos', JSON.stringify(position));
    }
  };

  // Touch Events (Mobile)
  const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY);
  
  // Mouse Events (Desktop) - Using Window listeners for smooth dragging outside element
  const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX, e.clientY);

  useEffect(() => {
    if (isDragging) {
      const onWindowMouseMove = (e: MouseEvent) => {
          e.preventDefault(); // Prevent text selection
          handleMove(e.clientX, e.clientY);
      };
      const onWindowMouseUp = () => handleEnd();
      
      window.addEventListener('mousemove', onWindowMouseMove);
      window.addEventListener('mouseup', onWindowMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', onWindowMouseMove);
        window.removeEventListener('mouseup', onWindowMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <button
      style={{ left: position.x, top: position.y }}
      className={`fixed z-50 bg-amber-600 text-white p-4 rounded-full shadow-2xl shadow-black/50 touch-none select-none transition-transform duration-75 no-print ${isDragging ? 'scale-110 cursor-grabbing bg-amber-500' : 'scale-100 cursor-pointer hover:bg-amber-500 active:scale-95'}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={handleEnd}
      onMouseDown={onMouseDown}
      title="Diário (Clique para abrir, Segure para mover)"
    >
      <PenTool size={24} />
    </button>
  );
};

export default DraggableFab;