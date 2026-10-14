import React from 'react';

interface HeaderProps {
  title: string;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onBack }) => (
  <header className="sticky top-0 z-10 bg-teal-600 text-white shadow pt-safe">
    <div className="max-w-md mx-auto h-14 flex items-center px-2">
      {onBack ? (
        <button
          onClick={onBack}
          aria-label="戻る"
          className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-teal-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      ) : (
        <div className="w-11" />
      )}
      <h1 className="flex-1 text-center text-lg font-bold truncate">{title}</h1>
      <div className="w-11" />
    </div>
  </header>
);
