import { useEffect } from 'react';
import { App } from '@capacitor/app';

// Global stack of handlers
const backButtonHandlers: (() => boolean)[] = [];

// Master listener (registered once)
let isMasterListenerRegistered = false;

const setupMasterListener = () => {
  if (isMasterListenerRegistered) return;
  
  App.addListener('backButton', () => {
    // Execute handlers from last to first (LIFO)
    for (let i = backButtonHandlers.length - 1; i >= 0; i--) {
      const handler = backButtonHandlers[i];
      // If handler returns true, it consumed the event
      if (handler()) {
        return;
      }
    }
    
    // Default: Exit App if nothing handled it (and stack is empty-ish)
    if (backButtonHandlers.length === 0) {
        App.exitApp();
    }
  });
  
  isMasterListenerRegistered = true;
};

/**
 * Registers a hardware back button handler.
 * Handlers are executed in LIFO order (last registered = first executed).
 * The handler should return `true` if it consumed the event (stopping propagation),
 * or `false` to let the next handler (in the stack) try.
 * 
 * @param handler Function that returns true (handled) or false (not handled)
 */
export const useBackButton = (handler: () => boolean) => {
  useEffect(() => {
    setupMasterListener();
    
    // Push handler to stack
    backButtonHandlers.push(handler);
    
    // Remove on unmount
    return () => {
      const index = backButtonHandlers.indexOf(handler);
      if (index > -1) {
        backButtonHandlers.splice(index, 1);
      }
    };
  }, [handler]);
};
