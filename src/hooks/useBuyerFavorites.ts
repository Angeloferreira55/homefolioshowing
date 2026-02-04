import { useState, useEffect, useCallback } from 'react';

const FAVORITES_KEY_PREFIX = 'homefolio_favorites_';

export const useBuyerFavorites = (shareToken: string | undefined) => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  const storageKey = shareToken ? `${FAVORITES_KEY_PREFIX}${shareToken}` : null;

  // Load favorites from localStorage on mount
  useEffect(() => {
    if (!storageKey) return;
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setFavorites(new Set(parsed));
        }
      }
    } catch {
      // localStorage may be unavailable
    }
  }, [storageKey]);

  // Save favorites to localStorage whenever they change
  const saveFavorites = useCallback((newFavorites: Set<string>) => {
    if (!storageKey) return;
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(newFavorites)));
    } catch {
      // localStorage may be unavailable
    }
  }, [storageKey]);

  const toggleFavorite = useCallback((propertyId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(propertyId)) {
        newFavorites.delete(propertyId);
      } else {
        newFavorites.add(propertyId);
      }
      saveFavorites(newFavorites);
      return newFavorites;
    });
  }, [saveFavorites]);

  const isFavorite = useCallback((propertyId: string) => {
    return favorites.has(propertyId);
  }, [favorites]);

  const getFavoriteCount = useCallback(() => {
    return favorites.size;
  }, [favorites]);

  const clearFavorites = useCallback(() => {
    setFavorites(new Set());
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // localStorage may be unavailable
      }
    }
  }, [storageKey]);

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    getFavoriteCount,
    clearFavorites,
  };
};
