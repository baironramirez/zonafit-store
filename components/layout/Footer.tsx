"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Facebook, Instagram, Twitter, MessageCircle, Music } from "lucide-react"; // Music as TikTok fallback if TikTok icon doesn't exist

export default function Footer() {
  const [socialLinks, setSocialLinks] = useState({
    whatsapp: "",
    instagram: "",
    tiktok: "",
    facebook: "",
    faqUrl: "",
    enviosUrl: "",
    contactoUrl: ""
  });

  useEffect(() => {
    async function fetchSocial() {
      try {
        const docSnap = await getDoc(doc(db, "settings", "home"));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSocialLinks({
            whatsapp: data.whatsappUrl || "",
            instagram: data.instagramUrl || "",
            tiktok: data.tiktokUrl || "",
            facebook: data.facebookUrl || "",
            faqUrl: data.faqUrl || "",
            enviosUrl: data.enviosUrl || "",
            contactoUrl: data.contactoUrl || ""
          });
        }
      } catch (err) {
        console.error("Error fetching social links:", err);
      }
    }
    fetchSocial();
  }, []);

  return (
    <footer className="bg-black text-white pt-16 pb-12 border-t-4 border-orange-500">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-6 mb-16">
          
          {/* Logo & About */}
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-2xl font-black uppercase tracking-widest mb-6">ZONAFIT</h3>
            <p className="text-sm text-gray-400 font-medium leading-relaxed max-w-xs">
              Equipamiento y suplementación diseñada para aquellos que se niegan a rendirse. Rendimiento Élite en cada detalle.
            </p>
          </div>

          {/* Ayuda */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6 border-b border-white/10 pb-2 inline-block">Ayuda</h4>
            <ul className="space-y-4">
              <li>
                <a href={socialLinks.faqUrl || "/faq"} className="text-sm text-gray-300 hover:text-white font-medium uppercase tracking-wide transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href={socialLinks.enviosUrl || "/envios"} className="text-sm text-gray-300 hover:text-white font-medium uppercase tracking-wide transition-colors">
                  Envíos y Devoluciones
                </a>
              </li>
              <li>
                <a href={socialLinks.contactoUrl || "/contacto"} className="text-sm text-gray-300 hover:text-white font-medium uppercase tracking-wide transition-colors">
                  Contacto
                </a>
              </li>
            </ul>
          </div>

          {/* Descubrir */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6 border-b border-white/10 pb-2 inline-block">Descubrir</h4>
            <ul className="space-y-4">
              <li>
                <Link href="/productos" className="text-sm text-gray-300 hover:text-white font-medium uppercase tracking-wide transition-colors">
                  Catálogo
                </Link>
              </li>
              <li>
                <Link href="/productos?cat=Proteínas" className="text-sm text-gray-300 hover:text-white font-medium uppercase tracking-wide transition-colors">
                  Proteínas
                </Link>
              </li>
              <li>
                <Link href="/productos?cat=Pre-Entrenos" className="text-sm text-gray-300 hover:text-white font-medium uppercase tracking-wide transition-colors">
                  Pre-Entrenos
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6 border-b border-white/10 pb-2 inline-block">Comunidad</h4>
            <div className="flex flex-wrap gap-4">
              {socialLinks.whatsapp && (
                <a href={socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="bg-white/10 p-3 rounded-full hover:bg-orange-500 transition-colors text-white">
                  <MessageCircle className="w-5 h-5" />
                </a>
              )}
              {socialLinks.instagram && (
                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="bg-white/10 p-3 rounded-full hover:bg-orange-500 transition-colors text-white">
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {socialLinks.facebook && (
                <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="bg-white/10 p-3 rounded-full hover:bg-orange-500 transition-colors text-white">
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {socialLinks.tiktok && (
                <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="bg-white/10 p-3 rounded-full hover:bg-orange-500 transition-colors text-white pl-[10px] pr-[10px]">
                  {/* Using custom text or music icon for TikTok since Lucide might not have it in this version */}
                  <span className="font-extrabold text-lg leading-none">tik</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500 font-bold tracking-widest uppercase text-center md:text-left">
            &copy; {new Date().getFullYear()} ZONAFIT COLOMBIA | Todos los derechos reservados.
          </p>
          <div className="flex gap-4">
            <Link href="/terminos" className="text-xs text-gray-500 hover:text-white transition-colors">Términos</Link>
            <Link href="/privacidad" className="text-xs text-gray-500 hover:text-white transition-colors">Privacidad</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
