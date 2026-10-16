import React from 'react';

export const Loading: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="h-12 w-12 rounded-full border-4 border-teal-200 border-t-teal-600 animate-spin mb-4" />
      <p className="text-gray-700 font-semibold">当番医を探しています…</p>
      <p className="text-gray-500 text-sm mt-1">20〜30秒ほどかかることがあります</p>
    </div>
  );
};
