import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://pauhenriques.com'

  const routes = [
    '',
    '/podcast',
    '/tienda',
    '/sobre-mi',
    '/terminos-servicio',
    '/politica-privacidad',
    '/programa-afiliados',
    '/links',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  return routes
}
