/**
 * @file index.tsx
 * @description Premium, dependency-free photo slideshow component customized for Tim Sherman Music.
 */

import React, { useContext, useEffect, useState } from 'react';
import { DataContext, Ipic } from 'src/providers/Data.provider';
import Caption from './caption';
import './pic-slider.css';

export interface Isettings {
  autoplay: boolean;
  autoplaySpeed: number;
  infinite: boolean;
  speed: number;
  slidesToShow: number;
  slidesToScroll: number;
  arrows: boolean;
  fade: boolean;
}

export const SliderContent = ({ pics, settings }: { pics: Ipic[] | null; settings: Isettings }): React.JSX.Element | null => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (Array.isArray(pics) && pics.length > 1 && settings.autoplay) {
      interval = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev === pics.length - 1) {
            return settings.infinite ? 0 : prev;
          }
          return prev + 1;
        });
      }, settings.autoplaySpeed);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pics, settings.autoplay, settings.autoplaySpeed, settings.infinite]);

  if (!Array.isArray(pics) || pics.length === 0) return null;

  const handlePrev = () => {
    setCurrentIndex(prev => {
      if (prev === 0) {
        return settings.infinite ? pics.length - 1 : prev;
      }
      return prev - 1;
    });
  };

  const handleNext = () => {
    setCurrentIndex(prev => {
      if (prev === pics.length - 1) {
        return settings.infinite ? 0 : prev;
      }
      return prev + 1;
    });
  };

  return (
    <div className="picSlider" data-testid="pic-slider">
      {/* slick-list class is preserved for unit tests */}
      <div className="slick-list">
        {pics.map((d, index) => (
          <div
            key={d._id || index}
            className={`slide-item ${index === currentIndex ? 'active' : ''}`}
            style={{ display: index === currentIndex ? 'flex' : 'none' }}
          >
            <img className="slide-images" src={d.url} alt={d.title} />
            {index === currentIndex && d.comments === 'showCaption' ? <Caption caption={d.title} /> : null}
          </div>
        ))}
      </div>

      {pics.length > 1 && (
        <>
          <button
            className="slider-nav-btn prev"
            onClick={handlePrev}
            aria-label="Previous Slide"
            type="button"
          >
            &#10094;
          </button>
          <button
            className="slider-nav-btn next"
            onClick={handleNext}
            aria-label="Next Slide"
            type="button"
          >
            &#10095;
          </button>

          <div className="slider-dots">
            {pics.map((_, index) => (
              <button
                key={index}
                className={`slider-dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
                type="button"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export function PicSlider(): React.JSX.Element {
  const { pics } = useContext(DataContext);
  const settings: Isettings = {
    autoplay: true,
    autoplaySpeed: 3000,
    infinite: true,
    speed: 1000,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    fade: true,
  };
  return <SliderContent pics={pics} settings={settings} />;
}
