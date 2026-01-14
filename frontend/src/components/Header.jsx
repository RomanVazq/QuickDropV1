import React from 'react';

export const Header = ({ data }) => {
  const businessName = data.business?.name || "Negocio";
  const primaryColor = data.business?.primary_color || "#ffffff";
  const secondaryColor = data.business?.secundary_color || "#000000";
  const bannerUrl = data.business?.banner_url || data.business?.logo_url;

  return (
    <div className="relative w-full h-[340px] overflow-hidden rounded-b-[3.5rem] shadow-2xl bg-slate-200">
      <img
        src={bannerUrl}
        alt={businessName}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40" />

      <div className="absolute top-12 left-0 right-0 flex justify-center z-20">
        <div className="relative px-8 py-2.5 overflow-hidden rounded-full border border-white/20 shadow-2xl">
          <div 
            className="absolute inset-0 backdrop-blur-xl opacity-90"
            style={{ backgroundColor: `${primaryColor}80` }} // 80 es aprox 50% de opacidad para mejor contraste
          />
          <h2 
            className="relative z-10 text-[10px] font-black uppercase tracking-[0.4em] whitespace-nowrap italic"
            style={{ color: secondaryColor }}
          >
            {businessName}
          </h2>
        </div>
      </div>
    </div>
  );
};