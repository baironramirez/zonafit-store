import type { MetadataRoute } from "next";

/**
 * sitemap.ts — Mapa de sitio XML dinámico para Google y otros motores de búsqueda
 *
 * ¿Por qué este archivo?
 * 1. Proporciona a Googlebot la lista canónica y oficial de URLs para indexación.
 * 2. Posiciona con máxima prioridad (1.0 y 0.9) la tienda y el catálogo de suplementos.
 * 3. Incluye las rutas directas de categorías más buscadas en Facatativá (Proteínas, Creatina, Pre-Entrenos).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.zonafitgym.com";
  const lastModified = new Date();

  return [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/productos`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/productos?cat=Prote%C3%ADnas`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/productos?cat=Creatina`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/productos?cat=Pre-Entrenos`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/productos?cat=Vitaminas`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/favoritos`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];
}
