import React from "react";

interface MascotProps {
  type: "suitcase" | "plane" | "calendar" | "wellness";
  className?: string;
  size?: number;
}

export const MascotDoodle: React.FC<MascotProps> = ({ type, className = "", size = 64 }) => {
  // 2D line-art doodles using a single-color stroke as specified
  const strokeColor = "#897365"; // Lumina Outline tone to coordinate beautifully
  
  switch (type) {
    case "suitcase":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${className} opacity-65`}
        >
          {/* Suitcase Body */}
          <rect x="25" y="35" width="50" height="40" rx="6" />
          {/* Handle */}
          <path d="M40 35V25C40 22.8 41.8 21 44 21H56C58.2 21 60 22.8 60 25V35" />
          {/* Straps / Details */}
          <line x1="38" y1="35" x2="38" y2="75" />
          <line x1="62" y1="35" x2="62" y2="75" />
          {/* Wheels */}
          <circle cx="34" cy="78" r="3" />
          <circle cx="66" cy="78" r="3" />
          {/* Sticker */}
          <path d="M47 50 L53 56 M53 50 L47 56" />
          <rect x="44" y="47" width="12" height="12" rx="2" strokeDasharray="3 2" />
        </svg>
      );
    case "plane":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${className} opacity-70`}
        >
          {/* Soaring plane */}
          <path d="M20 50 L45 48 L65 25 L73 28 L58 47 L82 45 L88 38 L92 41 L88 50 L92 59 L88 62 L82 55 L58 53 L73 72 L65 75 L45 52 Z" />
          {/* Abstract background flight trails */}
          <path d="M12 42 C 16 45, 18 38, 22 41" strokeDasharray="3 3" />
          <path d="M8 52 C 13 54, 15 50, 20 53" strokeDasharray="3 3" />
          <path d="M10 62 C 14 60, 16 66, 21 63" strokeDasharray="3 3" />
        </svg>
      );
    case "calendar":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${className} opacity-70`}
        >
          {/* Custom drawing calendar block */}
          <rect x="25" y="25" width="50" height="50" rx="8" />
          <path d="M35 20V28" />
          <path d="M50 20V28" />
          <path d="M65 20V28" />
          <line x1="25" y1="38" x2="75" y2="38" />
          <path d="M42 56 L47 61 L58 50" strokeWidth="2" />
          <line x1="32" y1="46" x2="40" y2="46" strokeDasharray="2 1" />
          <line x1="32" y1="64" x2="44" y2="64" strokeDasharray="2 1" />
          <line x1="56" y1="64" x2="68" y2="64" strokeDasharray="2 1" />
        </svg>
      );
    case "wellness":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${className} opacity-65`}
        >
          {/* Mountain & ocean peace doodle sketch */}
          <path d="M20 70 L40 38 L55 58" />
          <path d="M45 70 L65 44 L80 70" />
          <circle cx="58" cy="32" r="8" />
          <line x1="58" y1="18" x2="58" y2="21" />
          <line x1="72" y1="32" x2="69" y2="32" />
          <line x1="68" y1="22" x2="66" y2="24" />
          <path d="M22 78 C 30 75, 35 81, 45 78 C 55 75, 60 81, 70 78 C 80 75, 85 79, 90 77" />
        </svg>
      );
    default:
      return null;
  }
};
