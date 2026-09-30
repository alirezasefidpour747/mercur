import { HttpTypes } from '@medusajs/types';

import { GalleryCarousel } from '@/components/organisms';

export const ProductGallery = ({
  images,
  alt
}: {
  alt?: string;
  images: Pick<HttpTypes.StoreProductImage, 'id' | 'url'>[];
}) => {
  if (!images || images.length === 0) return null;

  return (
    <div data-testid="product-gallery">
      <GalleryCarousel
        images={images}
        alt={alt}
      />
    </div>
  );
};
