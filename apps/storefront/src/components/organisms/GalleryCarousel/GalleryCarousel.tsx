import { HttpTypes } from '@medusajs/types';

import { ProductCarousel } from '@/components/cells';

export const GalleryCarousel = ({
  images,
  alt
}: {
  alt?: string;
  images: Pick<HttpTypes.StoreProductImage, 'id' | 'url'>[];
}) => {
  return (
    <div
      className="w-full rounded-sm border p-1"
      data-testid="gallery-carousel"
    >
      <ProductCarousel
        slides={images}
        alt={alt}
      />
    </div>
  );
};
