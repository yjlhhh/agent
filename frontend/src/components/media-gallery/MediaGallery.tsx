import type { MediaItem } from '@/lib/stream/types'
import styles from './MediaGallery.module.scss'

type MediaGalleryProps = {
  images: MediaItem[]
}

export default function MediaGallery({ images }: MediaGalleryProps) {
  if (images.length === 0) return null

  return (
    <div className={styles.gallery} data-count={Math.min(images.length, 3)}>
      {images.slice(0, 3).map((image) => (
        <a
          key={image.link}
          className={styles.item}
          href={image.link}
          target="_blank"
          rel="noopener noreferrer"
        >
          <img className={styles.img} src={image.imageUrl} alt={image.title} />
        </a>
      ))}
    </div>
  )
}
