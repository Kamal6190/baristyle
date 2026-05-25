"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface Banner {
  id: string;
  image_url: string;
  title: string;
  subtitle: string;
  accent: string;
  btn1_text?: string;
  btn1_link?: string;
  btn2_text?: string;
  btn2_link?: string;
}

interface HeroCarouselProps {
  initialBanners: Banner[];
}

export default function HeroCarousel({ initialBanners }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const banners = initialBanners && initialBanners.length >= 4 
    ? initialBanners 
    : [
        {
          id: '1',
          image_url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=2000&auto=format&fit=crop',
          title: 'Redefining Luxury Procurement',
          subtitle: 'Access the world\'s most exclusive fragrance houses and premium retail goods. Engineered for high-volume efficiency.',
          accent: 'Global Distributor'
        },
        {
          id: '2',
          image_url: 'https://images.unsplash.com/photo-1615486171447-49fde384501a?q=80&w=2000&auto=format&fit=crop',
          title: 'Summer Nocturne Collection',
          subtitle: 'Hand-picked selections from the world\'s leading perfumeries. Perfect for retail displays.',
          accent: 'Seasonal Curated'
        },
        {
          id: '3',
          image_url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=2000&auto=format&fit=crop',
          title: 'The Artisanal Edit',
          subtitle: 'Discover unique and niche artistic scents designed by masters, available exclusively for wholesale partners.',
          accent: 'Artisanal Niche'
        },
        {
          id: '4',
          image_url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=2000&auto=format&fit=crop',
          title: 'Wholesale Exclusives',
          subtitle: 'Access direct factory pricing and priority bulk allocation. Apply for B2B status today.',
          accent: 'B2B Exclusive'
        }
      ];

  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 5500);
    return () => clearInterval(timer);
  }, [currentSlide, banners.length]);

  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev + 1) % banners.length);
    setTimeout(() => setIsTransitioning(false), 800);
  };

  const handlePrev = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
    setTimeout(() => setIsTransitioning(false), 800);
  };

  const selectSlide = (index: number) => {
    if (isTransitioning || index === currentSlide) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 800);
  };

  return (
    <section className="relative h-[85vh] w-full overflow-hidden bg-stone-950">
      {/* Slides container */}
      <div className="absolute inset-0 w-full h-full">
        {banners.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <div
              key={slide.id || index}
              className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
            >
              {/* Background image with Ken Burns animation */}
              <div 
                className={`absolute inset-0 bg-cover bg-center transition-transform duration-[6000ms] ease-out ${isActive ? 'scale-105' : 'scale-100'}`}
                style={{ backgroundImage: `url('${slide.image_url}')` }}
              ></div>
              {/* Luxury dark gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-stone-950/90 via-stone-900/60 to-transparent"></div>
              
              {/* Content Container */}
              <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
                {/* Accent Tag */}
                <p 
                  className={`text-emerald-500 tracking-[0.2em] text-xs font-bold uppercase mb-4 transition-all duration-700 delay-300 transform ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                >
                  {slide.accent || 'Premium Goods'}
                </p>
                {/* Title Headline */}
                <h1 
                  className={`text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white max-w-3xl leading-[1.1] mb-6 transition-all duration-700 delay-500 transform ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                >
                  {slide.title}
                </h1>
                {/* Subtitle description */}
                <p 
                  className={`text-stone-300 max-w-xl text-base md:text-lg mb-10 leading-relaxed transition-all duration-700 delay-700 transform ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                >
                  {slide.subtitle}
                </p>
                {/* Call-to-actions */}
                <div 
                  className={`flex items-center gap-4 transition-all duration-700 delay-[900ms] transform ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                >
                  <Link href={slide.btn1_link || "/shop"} className="bg-emerald-600 text-white px-8 py-3.5 rounded-sm font-medium hover:bg-emerald-500 transition shadow-md">
                    {slide.btn1_text || "Shop Collections"}
                  </Link>
                  <Link href={slide.btn2_link || "/wholesale"} className="group flex items-center gap-2 text-white border border-white/20 bg-white/5 backdrop-blur-sm px-8 py-3.5 rounded-sm font-medium hover:bg-white hover:text-stone-950 transition">
                    {slide.btn2_text || "Wholesale Portal"}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide Navigation Arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/25 text-white hover:bg-emerald-600 transition border border-white/10 hover:border-emerald-500/20 backdrop-blur-xs focus:outline-none"
        aria-label="Previous Slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/25 text-white hover:bg-emerald-600 transition border border-white/10 hover:border-emerald-500/20 backdrop-blur-xs focus:outline-none"
        aria-label="Next Slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Indicator dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2.5">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => selectSlide(index)}
            className={`h-2 rounded-full transition-all duration-350 focus:outline-none ${currentSlide === index ? 'w-8 bg-emerald-500' : 'w-2 bg-white/40 hover:bg-white/70'}`}
            aria-label={`Go to slide ${index + 1}`}
          ></button>
        ))}
      </div>
    </section>
  );
}
