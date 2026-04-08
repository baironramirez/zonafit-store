"use client";

import Link from "next/link";
import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function FailureLogic() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || searchParams.get("external_reference");

  useEffect(() => {
    if (orderId) {
      fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "rechazado" }),
      }).catch(console.error);
    }
  }, [orderId]);

  return null;
}

export default function FailurePage() {
  return (
    <div className="min-h-screen pt-24 pb-12 flex flex-col items-center justify-center bg-white px-4">
      <Suspense fallback={null}>
        <FailureLogic />
      </Suspense>
      <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 text-center border border-gray-200">
        <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>
        <h1 className="text-3xl font-black text-black mb-4 uppercase tracking-tight">
          Pago Rechazado
        </h1>
        <p className="text-gray-600 mb-8">
          Hubo un problema al procesar tu pago con Mercado Pago. Por favor, intenta nuevamente.
        </p>
        <Link
          href="/carrito"
          className="inline-flex items-center justify-center w-full px-6 py-4 bg-black text-white font-bold uppercase tracking-wide rounded-xl hover:bg-orange-500 transition-colors"
        >
          Volver al carrito
        </Link>
      </div>
    </div>
  );
}
