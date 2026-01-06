"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Home } from "lucide-react";

export default function InstitutionHeader({ institution }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Use institution images or fallback to placeholder images
  const images =
    institution.images && institution.images.length > 0
      ? institution.images
      : [
          "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1920&q=80",
          "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1920&q=80",
          "https://images.unsplash.com/photo-1587384474964-3a06ce1ce699?w=1920&q=80",
        ];

  useEffect(() => {
    if (images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [images.length]);

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      {/* Background Carousel with Overlay */}
      <div className="absolute inset-0">
        {images.map((image, index) => (
          <motion.img
            key={image}
            src={image}
            alt={`${institution.name} ${index + 1}`}
            className="absolute w-full h-full object-cover"
            initial={{ x: "100%" }}
            animate={{
              x: index === currentImageIndex ? "0%" : "-100%",
              opacity: index === currentImageIndex ? 1 : 0,
            }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/90 via-neutral-900/80 to-black/80" />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-8"
        >
          {/* Institution Name */}
          <div>
            <motion.h1
              className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              {institution.name}
            </motion.h1>
            <div className="h-1 w-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mx-auto"></div>
          </div>

          {/* Institution Details Grid */}
          <motion.div
            className="flex flex-col md:flex-row md:flex-wrap items-center justify-center gap-x-6 gap-y-3 max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            {/* Phone - Clickable to dial */}
            <a
              href={`tel:${institution.contact_number}`}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity duration-300"
            >
              <Phone
                className="w-4 h-4 text-white flex-shrink-0"
                strokeWidth={2}
              />
              <span className="text-white text-sm font-medium whitespace-nowrap">
                {institution.contact_number}
              </span>
            </a>

            {/* Address */}
            <div className="flex items-center gap-2">
              <Home
                className="w-4 h-4 text-white flex-shrink-0"
                strokeWidth={2}
              />
              <span className="text-white text-sm font-medium whitespace-nowrap">
                {institution.address}
              </span>
            </div>

            {/* Location - Clickable to Google Maps */}
            {institution.google_maps_link ? (
              <a
                href={institution.google_maps_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity duration-300"
              >
                <MapPin
                  className="w-4 h-4 text-white flex-shrink-0"
                  strokeWidth={2}
                />
                <span className="text-white text-sm font-medium whitespace-nowrap">
                  View on Google Maps
                </span>
              </a>
            ) : (
              <div className="flex items-center gap-2">
                <MapPin
                  className="w-4 h-4 text-white flex-shrink-0"
                  strokeWidth={2}
                />
                <span className="text-white text-sm font-medium whitespace-nowrap">
                  Location not available
                </span>
              </div>
            )}

            {/* Email - Clickable to email client */}
            <a
              href={`mailto:${institution.email}`}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity duration-300"
            >
              <Mail
                className="w-4 h-4 text-white flex-shrink-0"
                strokeWidth={2}
              />
              <span className="text-white text-sm font-medium whitespace-nowrap">
                {institution.email}
              </span>
            </a>
          </motion.div>
        </motion.div>
      </div>

      {/* Carousel Indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentImageIndex
                  ? "bg-white w-8"
                  : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
