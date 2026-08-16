export const siteUrl = 'https://playencore.app'
export const socialImageUrl = `${siteUrl}/brand/encore-logo-512.png`

export function pageMetadata({
  title,
  description,
  path,
  type = 'website',
}: {
  title: string
  description: string
  path: string
  type?: 'website' | 'profile'
}) {
  const url = new URL(path, siteUrl).toString()

  return [
    { title },
    { name: 'description', content: description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: type },
    { property: 'og:url', content: url },
    { property: 'og:site_name', content: 'Encore' },
    { property: 'og:image', content: socialImageUrl },
    { property: 'og:image:width', content: '512' },
    { property: 'og:image:height', content: '512' },
    { property: 'og:image:alt', content: 'Encore logo' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: socialImageUrl },
    { name: 'twitter:image:alt', content: 'Encore logo' },
  ]
}
