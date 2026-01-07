import React from 'react';

export const Header = ({ data }) => {
  // Extraemos la config o usamos valores por defecto
  const businessName = data.business?.name || "Negocio";
  const primaryColor = data.business?.primary_color || "#ffffff"; 
  const secondaryColor = data.business?.secundary_color || "#000000";
  const logoUrl = data.business?.logo_url;

  return (
    <div className="flex items-center gap-4 p-6 pt-12 border-b border-slate-50 mb-6" style={{ backgroundColor: primaryColor }}>
      <div 
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black italic shadow-lg overflow-hidden"
        style={{ backgroundColor: primaryColor }} // Estilo dinámico
      >
        {logoUrl ? (
          <img 
            src={logoUrl} 
            alt={businessName} 
            className="w-full h-full object-cover"
          />
        ) : (
          businessName.charAt(0)
        )}
      </div>
      
      <div>
        <h1 className="text-xl font-black  uppercase " style={{ color: secondaryColor }}>
          {businessName}
        </h1>
        <p className="text-slate-400 text-[10px] font-bold uppercase flex items-center gap-1" style={{color: secondaryColor}}>
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" ></span> 
          Tienda verificada
        </p>
      </div>
    </div>
  );
};