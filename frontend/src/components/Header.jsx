import React from 'react';
import { MapPin, Star } from 'lucide-react';

export const Header = ({ data }) => {
  const businessName = data.business?.name || "Negocio";
  const primaryColor = data.business?.primary_color || "#000000";
  const secondaryColor = data.business?.secundary_color || "#ffffff";
  const bannerUrl = data.business?.banner_url || data.business?.logo_url;
  const logoUrl = data.business?.logo_url;

  return (
    <div className="relative w-full bg-white p-4 pt-6">
      {/* Contenedor Principal (Tarjeta Soft) */}
      <div className="relative w-full h-[420px] overflow-hidden rounded-[3.5rem] shadow-sm">

        {/* Imagen de Fondo con Zoom Sutil */}
        <img
          src={bannerUrl}
          alt={businessName}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Capas de Overlay para profundidad */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-white/80" />

      </div>
    </div>
  );
};