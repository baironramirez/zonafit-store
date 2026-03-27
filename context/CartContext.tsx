"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { CartItem } from "../types/cart";

export interface Discount {
  code: string;
  value: number;
  type: "porcentaje" | "fijo";
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
    let limitReached = false;

    setCart((prev) => {
      const existing = prev.find((p) => p.id === item.id);

      if (existing) {
        if (existing.cantidad + item.cantidad > item.maxStock) {
          limitReached = true;
          return prev; // No changes if limit reached
        }
        return prev.map((p) =>
          p.id === item.id ? { ...p, cantidad: p.cantidad + item.cantidad } : p,
        );
      }

      if (item.cantidad > item.maxStock) {
        limitReached = true;
        return prev;
      }
      return [...prev, item];
    });

    if (limitReached) {
      alert(`No puedes agregar más unidades. El stock máximo disponible es ${item.maxStock}.`);
    } else {
      openCart(); // Automatically open cart drawer when adding an item successfully
    }
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((p) => p.id !== id));
  }

  function updateQuantity(id: string, cantidad: number) {
    if (cantidad < 1) return;

    setCart((prev) => {
      const existingItem = prev.find((p) => p.id === id);
      if (existingItem && cantidad > existingItem.maxStock) {
        alert(`No puedes agregar más unidades. El stock máximo disponible es ${existingItem.maxStock}.`);
        return prev; // Do not update
      }
      return prev.map((p) => (p.id === id ? { ...p, cantidad } : p));
    });
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

      // Validate expiration
      if (couponData.fechaExpiracion) {
        const expirationDate = new Date(couponData.fechaExpiracion);
        expirationDate.setHours(23, 59, 59, 999); // End of day
        if (expirationDate < new Date()) {
          return { success: false, message: "Este cupón ha expirado" };
        }
      }

      // Validate global usage limit
      if (couponData.limiteUsos && couponData.limiteUsos > 0 && couponData.usos >= couponData.limiteUsos) {
        return { success: false, message: "Este cupón ha alcanzado su límite de usos" };
      }

      // Validate single-use per user
      if (couponData.usoUnicoPorUsuario) {
        const userEmail = auth.currentUser?.email;
        if (userEmail) {
          const ordersQuery = query(
            collection(db, "orders"),
            where("cuponUsado", "==", upperCode)
          );
          const ordersSnap = await getDocs(ordersQuery);
          // Filtrar en cliente por email del usuario actual
          const usedByUser = ordersSnap.docs.some((doc) => {
            const data = doc.data();
            return data.cliente?.correo === userEmail;
          });
          if (usedByUser) {
            return { success: false, message: "Ya has utilizado este cupón anteriormente" };
          }
        }
      }
      
      const tipo = couponData.tipoDescuento || "porcentaje";
      setDiscount({ code: upperCode, value: couponData.descuento, type: tipo });
      
      const msg = tipo === "porcentaje" 
        ? `Descuento del ${couponData.descuento}% aplicado` 
        : `Descuento de $${couponData.descuento.toLocaleString("es-AR")} aplicado`;
      
      return { success: true, message: msg };
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
