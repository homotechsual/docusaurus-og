import React, { useEffect, useState } from 'react'

export default function GeneratedImage({
  alt,
  imageClassName,
}: {
  alt: string
  imageClassName?: string
}): React.JSX.Element {
  const [imagePath, setImagePath] = useState<string>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    const controller = new AbortController()

    async function loadImage() {
      try {
        const response = await fetch(window.location.pathname, { signal: controller.signal })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const html = await response.text()
        const page = new DOMParser().parseFromString(html, 'text/html')
        const meta = page.querySelector<HTMLMetaElement>('meta[property="og:image"]')
        if (!meta?.content) return

        const imageUrl = new URL(meta.content, window.location.href)
        if (imageUrl.pathname.includes('/og-images/')) {
          setImagePath(`${imageUrl.pathname}${imageUrl.search}`)
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : String(cause))
        }
      }
    }

    void loadImage()
    return () => controller.abort()
  }, [])

  return imagePath ? (
    <a href={imagePath}>
      <img
        className={imageClassName}
        src={imagePath}
        alt={alt}
        width={1200}
        height={630}
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </a>
  ) : error ? (
    <p>Could not load the generated image: {error}</p>
  ) : (
    <p>Build and serve the site to see its generated image. Images are generated during the production build.</p>
  )
}
