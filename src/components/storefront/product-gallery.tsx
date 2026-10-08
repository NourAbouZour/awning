"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Desktop: main image with thumbnails, subtle zoom following the cursor.
 * Mobile: swipeable snap carousel with dots.
 */
export function ProductGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [index, setIndex] = React.useState(0);
  const [zoom, setZoom] = React.useState(false);
  const [origin, setOrigin] = React.useState("50% 50%");
  const trackRef = React.useRef<HTMLDivElement>(null);

  function onScroll() {
    const el = trackRef.current;
    if (!el) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  return (
    <div>
      {/* mobile carousel */}
      <div className="md:hidden">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="no-scrollbar -mx-5 flex snap-x snap-mandatory overflow-x-auto"
          aria-label={`${title} images`}
        >
          {images.map((src, i) => (
            <div
              key={src}
              className="relative aspect-[4/5] w-full shrink-0 snap-center"
            >
              <Image
                src={src}
                alt={`${title}, image ${i + 1}`}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <span
                key={i}
                aria-hidden
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-5 bg-sf-ink" : "w-1.5 bg-sf-ink/25"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* desktop gallery */}
      <div className="hidden gap-4 md:flex">
        {images.length > 1 && (
          <div className="flex flex-col gap-3">
            {images.map((src, i) => (
              <button
                key={src}
                onClick={() => setIndex(i)}
                aria-label={`Show image ${i + 1}`}
                aria-pressed={i === index}
                className={cn(
                  "relative size-18 overflow-hidden rounded-lg border-2 transition-all",
                  i === index
                    ? "border-sf-ink"
                    : "border-transparent opacity-70 hover:opacity-100"
                )}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="72px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
        <div
          className="relative aspect-[4/5] flex-1 cursor-zoom-in overflow-hidden rounded-2xl bg-sf-wash"
          onMouseEnter={() => setZoom(true)}
          onMouseLeave={() => setZoom(false)}
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setOrigin(
              `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}% ${((
                (e.clientY - r.top) / r.height
              ) * 100).toFixed(1)}%`
            );
          }}
        >
          {images[index] && (
            <Image
              key={images[index]}
              src={images[index]}
              alt={`${title}, image ${index + 1}`}
              fill
              priority
              sizes="(min-width: 768px) 50vw, 100vw"
              className={cn(
                "object-cover transition-transform duration-200",
                zoom && "scale-150"
              )}
              style={{ transformOrigin: origin }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
