import Link from "next/link";

export default function FailurePage() {
  return (
    <div className="min-h-screen pt-24 pb-12 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 shadow-xl rounded-2xl p-8 text-center border border-zinc-200 dark:border-zinc-800">
        <div className="w-20 h-20 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-red-600 dark:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>
        <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 mb-4 uppercase tracking-tight">
          Pago Rechazado
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Hubo un problema al procesar tu pago con Mercado Pago. Por favor, intenta nuevamente.
        </p>
        <Link 
          href="/cart"
          className="inline-flex items-center justify-center w-full px-6 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold uppercase tracking-wide hover:bg-black dark:hover:bg-zinc-200 transition-colors"
        >
          Volver al carrito
        </Link>
      </div>
    </div>
  );
}
