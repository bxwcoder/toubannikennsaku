import React from 'react';
import { Prefecture } from '../types';
import { PREFECTURES } from '../constants';

interface PrefectureSelectorProps {
  onSelect: (pref: Prefecture) => void;
}

const REGIONS = Array.from(new Set(PREFECTURES.map((p) => p.region)));

export const PrefectureSelector: React.FC<PrefectureSelectorProps> = ({ onSelect }) => {
  return (
    <div className="p-4 space-y-5">
      <p className="text-gray-600 text-sm">都道府県を選ぶと、今日の当番医をAIで探します。</p>
      {REGIONS.map((region) => (
        <section key={region}>
          <h2 className="text-sm font-bold text-teal-700 mb-2">{region}</h2>
          <div className="grid grid-cols-3 gap-2">
            {PREFECTURES.filter((p) => p.region === region).map((pref) => (
              <button
                key={pref.id}
                onClick={() => onSelect(pref)}
                className="bg-white border border-gray-200 rounded-lg py-3 text-gray-800 font-medium shadow-sm hover:bg-teal-50 hover:border-teal-300 transition-colors"
              >
                {pref.name}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
