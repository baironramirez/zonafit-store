/**
 * LocalBusinessJsonLd.tsx
 *
 * ¿Por qué este componente?
 * Siguiendo principios de Clean Architecture y mejores prácticas de SEO Local:
 * 1. Los motores de búsqueda (Google, Bing) utilizan datos estructurados en formato Schema.org
 *    para clasificar negocios locales, ubicaciones geográficas y tiendas físicas/online.
 * 2. Al especificar explícitamente Facatativá, Cundinamarca, las coordenadas y el área de servicio
 *    (Facatativá, Madrid, Mosquera, Funza, Sabana Occidente), Google asocia inmediatamente
 *    el dominio www.zonafitgym.com con las búsquedas geolocalizadas:
 *    - "suplementos facatativa"
 *    - "suplementación deportiva facatativa"
 *    - "proteina facatativa"
 *    - "creatina facatativa"
 *    - "tienda fitness cerca de mi"
 * 3. Se inyecta de forma segura mediante script application/ld+json directamente en el SSR.
 */

export default function LocalBusinessJsonLd() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": ["Store", "SportsActivityLocation"],
    "@id": "https://www.zonafitgym.com/#store",
    "name": "ZonaFit Store - Suplementación Deportiva en Facatativá",
    "alternateName": "ZonaFit Gym & Store Facatativá",
    "url": "https://www.zonafitgym.com",
    "logo": "https://www.zonafitgym.com/icon.png",
    "image": "https://www.zonafitgym.com/icon.png",
    "description": "Tienda líder de suplementación deportiva y accesorios fitness en Facatativá y Sabana de Occidente. Venta de proteínas, creatinas, pre-entrenos, aminoácidos y vitaminas con entrega rápida local y envíos a todo Colombia.",
    "priceRange": "$$",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Facatativá",
      "addressRegion": "Cundinamarca",
      "addressCountry": "CO"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 4.8136,
      "longitude": -74.3547
    },
    "areaServed": [
      {
        "@type": "City",
        "name": "Facatativá"
      },
      {
        "@type": "City",
        "name": "Madrid"
      },
      {
        "@type": "City",
        "name": "Mosquera"
      },
      {
        "@type": "City",
        "name": "Funza"
      },
      {
        "@type": "AdministrativeArea",
        "name": "Sabana de Occidente"
      },
      {
        "@type": "Country",
        "name": "Colombia"
      }
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Catálogo de Suplementos Deportivos",
      "itemListElement": [
        {
          "@type": "OfferCatalog",
          "name": "Proteínas y Ganadores de Masa"
        },
        {
          "@type": "OfferCatalog",
          "name": "Creatinas Monohidrato y Creapure"
        },
        {
          "@type": "OfferCatalog",
          "name": "Pre-Entrenos y Energizantes"
        },
        {
          "@type": "OfferCatalog",
          "name": "Aminoácidos, BCAA y Recuperadores"
        },
        {
          "@type": "OfferCatalog",
          "name": "Accesorios y Ropa Deportiva"
        }
      ]
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
