"use client";

import { useCart } from "@/context/CartContext";
import { X, Trash2, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function CartDrawer() {
  const { cart, isCartOpen, closeCart, updateQuantity, removeFromCart } = useCart();

  const totalAmount = cart.reduce(
    (acc, item) => acc + item.precio * item.cantidad,
    0
  );

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white z-[100] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" /> TU BOLSA
              </h2>
              <button
                onClick={closeCart}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Cerrar carrito"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Free Shipping Notice */}
            <div className="bg-emerald-50 p-4 border-b border-emerald-100 shrink-0">
              <p className="text-sm font-bold text-emerald-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Tienes envío estándar gratuito activado.
              </p>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium mb-6">Tu bolsa está vacía.</p>
                  <button
                    onClick={closeCart}
                    className="text-black font-bold uppercase tracking-widest text-sm underline hover:text-orange-500 transition-colors"
                  >
                    Seguir comprando
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    {/* Image */}
                    <div className="w-20 h-24 bg-gray-100 flex-shrink-0 rounded-md overflow-hidden relative">
                      {item.imagen ? (
                        <img
                          src={item.imagen}
                          alt={item.nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ShoppingBag className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h3 className="font-bold text-sm leading-tight line-clamp-2">
                            {item.nombre.split(" - ")[0]}
                          </h3>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {item.nombre.includes(" - ") && (
                          <p className="text-xs text-gray-500 mb-2">
                            {item.nombre.split(" - ")[1]}
                          </p>
                        )}
                        <p className="font-black text-sm">
                          ${item.precio.toLocaleString("es-AR")}
                        </p>
                      </div>

                      {/* Quantity Control */}
                      <div className="flex items-center border border-gray-200 rounded w-24 overflow-hidden mt-2">
                        <button
                          onClick={() => updateQuantity(item.id, Math.max(1, item.cantidad - 1))}
                          className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors"
                        >
                          -
                        </button>
                        <span className="w-8 h-8 flex items-center justify-center text-sm font-bold border-x border-gray-200">
                          {item.cantidad}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer / Checkout */}
            {cart.length > 0 && (
              <div className="border-t border-gray-100 p-6 bg-gray-50 shrink-0">
                <div className="flex justify-between items-center mb-6">
                  <span className="font-bold uppercase tracking-widest text-sm text-gray-600">Subtotal</span>
                  <span className="text-xl font-black">${totalAmount.toLocaleString("es-AR")}</span>
                </div>
                <Link
                  href="/carrito"
                  onClick={closeCart}
                  className="w-full flex justify-center items-center py-4 bg-black text-white font-black uppercase tracking-widest text-sm hover:bg-gray-900 transition-all hover:scale-[1.02] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)]"
                >
                  <ShoppingBag className="w-4 h-4 mr-2" /> Pagar de forma segura
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
