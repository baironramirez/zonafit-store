"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { trackGoogleAdsPurchase } from "@/lib/analytics";
import { useCart } from "@/context/CartContext";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || searchParams.get("external_reference");
  const { clearCart } = useCart();
  const [tracked, setTracked] = useState(false);

  useEffect(() => {
    // 1. Limpiar el carrito en el estado global tras pago exitoso
    clearCart();

    // 2. Medición de conversión en Google Ads
    if (orderId && !tracked) {
      let orderTotal = 0;
      let customerEmail: string | undefined;
      let customerPhone: string | undefined;

      try {
        const cachedDataStr = sessionStorage.getItem(`order_data_${orderId}`);
        if (cachedDataStr) {
          const cachedData = JSON.parse(cachedDataStr);
          orderTotal = Number(cachedData.total) || 0;
          customerEmail = cachedData.email;
          customerPhone = cachedData.phone;
        }
      } catch (err) {
        console.warn("No se pudo recuperar datos de sessionStorage para analítica", err);
      }

      trackGoogleAdsPurchase({
        orderId,
        value: orderTotal,
        currency: "COP",
        email: customerEmail,
        phone: customerPhone,
      });

      setTracked(true);
    }
  }, [orderId, clearCart, tracked]);

  return (
    <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 text-center border border-gray-200">
      <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
        <svg
          className="w-10 h-10 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <h1 className="text-3xl font-black text-black mb-3 uppercase tracking-tight">
        ¡Pago Exitoso!
      </h1>
      
      <p className="text-gray-600 mb-6 text-sm leading-relaxed">
        Tu pedido ha sido confirmado correctamente. En breve prepararemos tu envío y te notificaremos los detalles.
      </p>

      {orderId && (
        <div className="mb-6 p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-500 font-mono">
          <span>Referencia de pedido: </span>
          <span className="font-bold text-gray-800">{orderId}</span>
        </div>
      )}

      <Link
        href="/"
        className="inline-flex items-center justify-center w-full px-6 py-4 bg-black text-white font-bold uppercase tracking-wide rounded-xl hover:bg-orange-500 transition-colors shadow-md hover:shadow-lg"
      >
        Volver a la tienda
      </Link>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <div className="min-h-screen pt-24 pb-12 flex flex-col items-center justify-center bg-gray-50/50 px-4">
      <Suspense
        fallback={
          <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 text-center border border-gray-200">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Cargando confirmación...</p>
          </div>
        }
      >
        <SuccessContent />
      </Suspense>
    </div>
  );
}
