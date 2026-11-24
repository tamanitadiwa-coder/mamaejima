"use client";
import { useState } from "react";

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [i, setI] = useState(0);
  return (
    <div className="pdp-media">
      <div className="pdp-main">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[i]} alt={alt} fetchPriority="high" />
      </div>
      {images.length > 1 && (
        <div className="thumbs">
          {images.map((src, n) => (
            <button key={src + n} aria-current={n === i} aria-label={`Image ${n + 1}`} onClick={() => setI(n)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
