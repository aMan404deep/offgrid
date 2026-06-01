import React from "react";

interface AvatarProps {
  name: string;
  avatarUrl: string;
  className?: string;
  onClick?: () => void;
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export const Avatar: React.FC<AvatarProps> = ({ name, avatarUrl, className = "", onClick }) => {
  return (
    <div 
      className={`relative rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-[#eae7e7] text-[#1c1b1b] font-bold ${className} ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="tracking-widest" style={{ fontSize: "inherit", opacity: 0.8 }}>
          {getInitials(name)}
        </span>
      )}
    </div>
  );
};
