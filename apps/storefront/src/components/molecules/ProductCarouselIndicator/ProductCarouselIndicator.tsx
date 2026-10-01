'use client';

import { useCallback, useEffect, useState } from 'react';

import { HttpTypes } from '@medusajs/types';
import useEmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';

import { Indicator } from '@/components/atoms';
import { cn } from '@/lib/utils';

type EmblaCarouselType = NonNullable<ReturnType<typeof useEmblaCarousel>[1]>

export const ProductCarouselIndicator = ({
  slides = [],
  embla: parentEmbla,
  alt = 'Product image'
}: {
  slides: Pick<HttpTypes.StoreProductImage, 'id' | 'url'>[];
  alt?: string;
  embla?: EmblaCarouselType;
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    axis: 'y',
    loop: true,
    align: 'start'
  });

  const changeSlideHandler = useCallback(
    (index: number) => {
      if (!parentEmbla) return;
      parentEmbla.scrollTo(index);

      if (!emblaApi) return;
      emblaApi.scrollTo(index);
    },
    [parentEmbla, emblaApi]
  );

  const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!parentEmbla) return;

    onSelect(parentEmbla);
    parentEmbla.on('reInit', onSelect).on('select', onSelect);
  }, [parentEmbla, onSelect]);

  return (
    <div className="embla__dots pointer-events-none absolute bottom-3 start-3 h-[2px] w-[calc(100%-24px)] lg:bottom-auto lg:top-3">
      <div className="pointer-events-auto lg:hidden">
        <Indicator
          step={selectedIndex + 1}
          size="large"
          maxStep={slides?.length || 0}
        />
      </div>

      <div className="embla pointer-events-auto relative hidden lg:block">
        <div
          className="embla__viewport overflow-hidden rounded-xs"
          ref={emblaRef}
        >
          <div className="embla__container flex h-[350px] lg:block lg:h-[680px]">
            {(slides || []).map((slide, index) => (
              <button
                type="button"
                aria-label={`${alt} ${index + 1}`}
                key={slide.id}
                className="mb-3 hidden h-16 w-16 cursor-pointer rounded-sm bg-primary lg:block"
                onClick={() => changeSlideHandler(index)}
              >
                <Image
                  src={decodeURIComponent(slide.url)}
                  alt={alt}
                  width={64}
                  height={64}
                  className={cn(
                    'transition-color hidden h-16 w-16 rounded-sm border-2 object-cover duration-300 lg:block',
                    selectedIndex === index ? 'border-primary' : 'border-tertiary'
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
