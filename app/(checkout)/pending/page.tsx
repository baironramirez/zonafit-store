import Link from "next/link";

export default function PendingPage() {
  return (
    <div className="min-h-screen pt-24 pb-12 flex flex-col items-center justify-center bg-white px-4">
      <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 text-center border border-gray-200">
        <div className="w-20 h-20 mx-auto mb-6 bg-yellow-100 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h1 className="text-3xl font-black text-black mb-4 uppercase tracking-tight">
          Pago Pendiente
        </h1>
        <p className="text-gray-600 mb-8">
          Tu pago está en proceso de revisión. Una vez confirmado, comenzaremos a preparar tu pedido.
        </p>
        <Link 
          href="/"
          className="inline-flex items-center justify-center w-full px-6 py-4 bg-orange-500 text-white font-bold uppercase tracking-wide rounded-xl hover:bg-orange-600 transition-colors"
        >
          Volver a la tienda
        </Link>
      </div>
    </div>
  );
}
