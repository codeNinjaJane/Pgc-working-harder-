import React from 'react';

interface NavbarProps {
  onTitleClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onTitleClick }) => {
  return (
    <header className="border-b border-border bg-surface sticky top-0 z-40">
      <div className="max-w-[640px] mx-auto px-4 h-12 flex items-center justify-between">
        <button
          type="button"
          onClick={onTitleClick}
          className="text-[17px] font-semibold text-text tracking-tight hover:opacity-80 transition-opacity cursor-pointer min-h-[44px] flex items-center"
        >
          Dialtone
        </button>
      </div>
    </header>
  );
};
