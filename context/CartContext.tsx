"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { CartItem } from "../types/cart";

export interface Discount {
  code: string;
  percentage: number;
}

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, cantidad: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  discount: Discount | null;
  applyDiscount: (code: string) => Promise<{ success: boolean; message: string }>;
  removeDiscount: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [discount, setDiscount] = useState<Discount | null>(null);

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");

    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  function addToCart(item: CartItem) {
    setCart((prev) => {
      const existing = prev.find((p) => p.id === item.id);

      if (existing) {
        return prev.map((p) =>
          p.id === item.id ? { ...p, cantidad: p.cantidad + item.cantidad } : p,
        );
      }

      return [...prev, item];
    });
    openCart(); // Automatically open cart drawer when adding an item
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((p) => p.id !== id));
  }

  function updateQuantity(id: string, cantidad: number) {
    setCart((prev) => prev.map((p) => (p.id === id ? { ...p, cantidad } : p)));
  }

  function clearCart() {
    setCart([]);
  }

  function openCart() {
    setIsCartOpen(true);
  }

  function closeCart() {
    setIsCartOpen(false);
  }

  async function applyDiscount(code: string): Promise<{ success: boolean; message: string }> {
    const upperCode = code.toUpperCase().trim();
    try {
      const q = query(collection(db, "coupons"), where("codigo", "==", upperCode), limit(1));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return { success: false, message: "Código de descuento inválido" };
      }
      
      const couponDoc = querySnapshot.docs[0];
      const couponData = couponDoc.data();
      
      if (!couponData.activo) {
        return { success: false, message: "El cupón se encuentra inactivo" };
      }
      
      setDiscount({ code: upperCode, percentage: couponData.descuento });
      return { success: true, message: `Descuento del ${couponData.descuento}% aplicado` };
    } catch (error) {
      console.error("Error applying discount:", error);
      return { success: false, message: "Error conectando con el servidor" };
    }
  }

  function removeDiscount() {
    setDiscount(null);
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        openCart,
        closeCart,
        discount,
        applyDiscount,
        removeDiscount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart debe usarse dentro de CartProvider");
  }

  return context;
}
