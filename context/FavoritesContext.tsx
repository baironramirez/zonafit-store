"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { ProductoData } from "@/components/ProductCard";

interface FavoritesContextType {
  favorites: ProductoData[];
  addToFavorites: (product: ProductoData) => void;
  removeFromFavorites: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<ProductoData[]>([]);

  // Load favorites from local storage on mount
  useEffect(() => {
    const savedFavs = localStorage.getItem("zonafit_favorites");
    if (savedFavs) {
      try {
        setFavorites(JSON.parse(savedFavs));
      } catch (e) {
        console.error("Failed to parse favorites from local storage", e);
      }
    }
  }, []);

  // Save favorites to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem("zonafit_favorites", JSON.stringify(favorites));
  }, [favorites]);

  const addToFavorites = (product: ProductoData) => {
    setFavorites((prev) => {
      // Prevent duplicates
      if (prev.some((p) => p.id === product.id)) return prev;
      return [...prev, product];
    });
  };

  const removeFromFavorites = (productId: string) => {
    setFavorites((prev) => prev.filter((p) => p.id !== productId));
  };

  const isFavorite = (productId: string) => {
    return favorites.some((p) => p.id === productId);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, addToFavorites, removeFromFavorites, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
