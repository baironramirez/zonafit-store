"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { trackGoogleAdsPurchase } from "@/lib/analytics";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { CheckCircle2, ShoppingBag, UserPlus, Package, ArrowRight, Sparkles } from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || searchParams.get("external_reference");
  const { clearCart } = useCart();
  const { currentUser } = useAuth();
  const [tracked, setTracked] = useState(false);
  const [customerEmail, setCustomerEmail] = useState<string>("");

  // 1. Limpiar el carrito en el estado global tras pago exitoso (una sola vez)
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  // 2. Medición de conversión en Google Ads y recuperación del correo del cliente
  useEffect(() => {
    if (!orderId) return;

    let emailFound = "";
    try {
      const cachedDataStr = sessionStorage.getItem(`order_data_${orderId}`);
      if (cachedDataStr) {
        const cachedData = JSON.parse(cachedDataStr);
        if (cachedData.email) {
          emailFound = cachedData.email;
          setCustomerEmail(cachedData.email);
        }
        if (!tracked) {
          trackGoogleAdsPurchase({
            orderId,
            value: Number(cachedData.total) || 0,
            currency: "COP",
            email: cachedData.email,
            phone: cachedData.phone,
          });
          setTracked(true);
        }
      }
    } catch (err) {
      console.warn("No se pudo leer sessionStorage en success", err);
    }

    // Fallback: si no estaba en sessionStorage (ej. cambio de pestaña o móvil), consultar Firestore
    if (!emailFound) {
      import("@/lib/firebase").then(({ db }) => {
        import("firebase/firestore").then(({ doc, getDoc }) => {
          getDoc(doc(db, "orders", orderId)).then((snap) => {
            if (snap.exists()) {
              const data = snap.data();
              const mail = data.cliente?.correo || data.correo || data.email;
              if (mail) {
                setCustomerEmail(mail);
              }
              if (!tracked) {
                trackGoogleAdsPurchase({
                  orderId,
                  value: Number(data.total) || 0,
                  currency: "COP",
                  email: mail,
                  phone: data.cliente?.telefono,
                });
                setTracked(true);
              }
            }
          }).catch(() => {});
        });
      });
    }
  }, [orderId, tracked]);

  // 3. Manejador robusto para volver a la tienda limpiando el estado de checkout
  const handleBackToStore = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = "/";
  };

  return (
    <div className="max-w-md w-full bg-white shadow-2xl rounded-3xl p-8 text-center border border-gray-100 relative overflow-hidden">
      {/* Luz ambiental decorativa */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-green-100/50 rounded-full blur-2xl pointer-events-none" />

      {/* Ícono de confirmación */}
      <div className="w-20 h-20 mx-auto mb-6 bg-green-100/80 rounded-full flex items-center justify-center animate-bounce shadow-inner border border-green-200">
        <CheckCircle2 className="w-10 h-10 text-green-600" />
      </div>

      <h1 className="text-3xl font-black text-black mb-3 uppercase tracking-tight">
        ¡Pago Exitoso!
      </h1>

      <p className="text-gray-600 mb-6 text-sm leading-relaxed">
        Tu pedido ha sido confirmado correctamente. En breve prepararemos tu envío y te notificaremos los detalles.
      </p>

      {/* Referencia de pedido */}
      {orderId && (
        <div className="mb-6 p-3.5 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-500 font-mono flex items-center justify-between">
          <span className="text-gray-400">Referencia de pedido:</span>
          <span className="font-bold text-gray-900 tracking-wider">{orderId}</span>
        </div>
      )}

      {/* ── SECCIÓN DE ESTADO DEL PEDIDO / CREAR CUENTA ── */}
      {currentUser ? (
        // Caso A: Usuario con sesión activa
        <div className="mb-6 p-4 bg-orange-50/70 border border-orange-200/80 rounded-2xl text-left">
          <div className="flex items-center gap-2 mb-1.5 text-orange-950 font-black text-xs uppercase tracking-wider">
            <Package className="w-4 h-4 text-orange-600" />
            <span>Rastrea tu pedido en tiempo real</span>
          </div>
          <p className="text-xs text-gray-600 mb-3.5 leading-relaxed">
            Puedes consultar el estado de preparación, tu guía de despacho y el historial de compras en tu perfil.
          </p>
          <Link
            href="/pedidos"
            className="inline-flex items-center justify-center w-full py-3.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-wider text-xs rounded-xl transition-all shadow-md hover:shadow-orange-500/25 gap-2"
          >
            <Package className="w-4 h-4" /> Ver estado de mi pedido <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        // Caso B: Usuario invitado o sin sesión activa
        <div className="mb-6 p-4 bg-gradient-to-br from-orange-50/90 via-white to-gray-50 border border-orange-200 rounded-2xl text-left shadow-sm">
          <div className="flex items-center gap-2 mb-1.5 text-black font-black text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-orange-500 flex-shrink-0" />
            <span>¿Quieres ver el estado de tu pedido?</span>
          </div>
          <p className="text-xs text-gray-600 mb-3.5 leading-relaxed">
            Crea tu cuenta {customerEmail ? <>con <strong className="text-gray-900">{customerEmail}</strong> </> : "con tu correo "}para rastrear el despacho en tiempo real, ver la guía de envío y tu historial de compras.
          </p>

          <Link
            href={
              customerEmail
                ? `/registro?email=${encodeURIComponent(customerEmail)}&redirect=/pedidos`
                : `/registro?redirect=/pedidos`
            }
            className="inline-flex items-center justify-center w-full py-3.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-wider text-xs rounded-xl transition-all shadow-md hover:shadow-orange-500/25 gap-2"
          >
            <UserPlus className="w-4 h-4" /> Crear cuenta para ver pedido <ArrowRight className="w-4 h-4" />
          </Link>

          <div className="mt-2.5 text-center">
            <span className="text-[11px] text-gray-500">¿Ya tienes cuenta? </span>
            <Link
              href={`/login?redirect=/pedidos${customerEmail ? `&email=${encodeURIComponent(customerEmail)}` : ""}`}
              className="text-[11px] font-bold text-black hover:text-orange-600 underline transition-colors"
            >
              Inicia sesión aquí
            </Link>
          </div>
        </div>
      )}

      {/* ── BOTÓN VOLVER A LA TIENDA (ROBUSTO Y CONFIABLE) ── */}
      <a
        href="/"
        onClick={handleBackToStore}
        className="inline-flex items-center justify-center w-full px-6 py-4 bg-black text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-neutral-800 transition-all shadow-md hover:shadow-lg gap-2 cursor-pointer"
      >
        <ShoppingBag className="w-4 h-4" /> Volver a la tienda
      </a>
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
