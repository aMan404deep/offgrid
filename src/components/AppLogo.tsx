import React from "react";

interface AppLogoProps {
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({ size = "md", animated = true }) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-16 h-16"
  };

  const scale = sizeClasses[size];

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center shrink-0 ${
        scale
      } ${animated ? "hover:scale-105 active:scale-95 transition-transform duration-300 ease-out" : ""}`}
    >
      <svg
        className="w-full h-full drop-shadow-sm"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="leafGradient" x1="30" y1="20" x2="70" y2="70" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffbf00" />
            <stop offset="50%" stopColor="#e67e22" />
            <stop offset="100%" stopColor="#944a00" />
          </linearGradient>

          <linearGradient id="tickGradient" x1="30" y1="25" x2="85" y2="75" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ffdcc5" />
          </linearGradient>
          
          <filter id="leafShadow" x="-20%" y="-20%" width="140%" height="140%">
             <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#944a00" floodOpacity="0.25" />
             <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.1" />
          </filter>
        </defs>

        {/* Scaled up transparent web-ready logo mark */}
        <g transform="translate(-16, -16) scale(1.35)">
          {/* Stylized geometric leaf background shape */}
          <path
            d="M30 50 C30 30, 50 20, 70 20 C70 40, 60 60, 40 70 L30 50 Z"
            fill="url(#leafGradient)"
            filter="url(#leafShadow)"
          />

          {/* Direct clean tick mark stroke overlay */}
          <path
            d="M30 50 L50 75 L85 25"
            fill="none"
            stroke="#1c1b1b"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Circular start point representing local office node */}
          <circle
            cx="30"
            cy="50"
            r="4.5"
            fill="#1c1b1b"
          />
        </g>
      </svg>
    </div>
  );
};

