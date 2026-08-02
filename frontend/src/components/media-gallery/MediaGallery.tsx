import type { MediaItem } from '@/lib/stream/types'

type MediaGalleryProps = {
  images: MediaItem[]
}

export default function MediaGallery({ images }: MediaGalleryProps) {
  if (images.length === 0) return null

  return (
    <div data-count={Math.min(images.length, 3)}>
      {images.slice(0, 3).map((image) => (
        <a key={image.link} href={image.link} target="_blank" rel="noopener noreferrer">
          <img src={image.imageUrl} alt={image.title} />
        </a>
      ))}
    </div>
  )
}
