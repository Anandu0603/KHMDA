import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <svg width="120" height="120" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className={`mx-auto ${className}`}>
      <circle cx="100" cy="100" r="90" fill="white" stroke="#004d99" strokeWidth="4"/>
      <g>
        {/* Pill hexagon - top */}
        <polygon points="80,55 120,55 120,85 100,75 80,85" fill="#0066cc"/>
        <rect x="82" y="62" width="36" height="16" rx="8" fill="white"/>
        <rect x="88" y="68" width="24" height="4" fill="#0066cc"/>
        
        {/* Syringe hexagon - middle left */}
        <polygon points="80,95 110,95 110,125 95,115 80,125" fill="#0066cc"/>
        <rect x="85" y="102" width="20" height="6" fill="#0066cc"/>
        <line x1="98" y1="105" x2="98" y2="112" stroke="#0066cc" strokeWidth="2"/>
        <polygon points="98,112 102,112 100,116" fill="#0066cc"/>
        
        {/* Microscope hexagon - middle right */}
        <polygon points="90,95 120,95 120,125 105,115 90,125" fill="#0066cc"/>
        <ellipse cx="105" cy="105" rx="6" ry="3" fill="black"/>
        <line x1="102" y1="108" x2="99" y2="111" stroke="black" strokeWidth="1.5"/>
        <line x1="108" y1="108" x2="111" y2="111" stroke="black" strokeWidth="1.5"/>
        <circle cx="105" cy="115" r="2" fill="black"/>
        
        {/* KMDA text */}
        <text x="100" y="155" textAnchor="middle" fill="#0066cc" fontFamily="'Arial Black', Arial, sans-serif" fontSize="20" fontWeight="bold">KMDA</text>
        
        {/* Subtitle text - adjusted positioning */}
        <text x="100" y="172" textAnchor="middle" fill="#0066cc" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="500">Kerala Medical</text>
        <text x="100" y="183" textAnchor="middle" fill="#0066cc" fontFamily="Arial, sans-serif" fontSize="7.5" fontWeight="500">Distributors Association</text>
      </g>
    </svg>
  );
};

export default Logo;
