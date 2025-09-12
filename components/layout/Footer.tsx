'use client';

import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white py-8 text-center">
      <div className="text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} Tu Teléfono Perfecto. Todos los derechos reservados.
      </div>
    </footer>
  );
};

export default Footer; 