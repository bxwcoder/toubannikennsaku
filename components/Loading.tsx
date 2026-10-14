import React from 'react';

export const Loading: React.FC = () => (
  <div className="flex flex-col items-center justify-center p-12 text-center" role="status" aria-live="polite">
    <div className="h-12 w-12 rounded-full border-4 border-teal-200 border-t-teal-600 animate-spin mb-4" />
    <p className="text-gray-700 font-semibold">当番医を検索しています…</p>
    <p className="text-sm text-gray-500 mt-1">数十秒かかることがあります</p>
  </div>
);
