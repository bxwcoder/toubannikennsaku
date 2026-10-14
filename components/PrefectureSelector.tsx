import React from 'react';
import { PREFECTURES } from '../constants';
import { Prefecture } from '../types';

interface PrefectureSelectorProps {
  onSelect: (prefecture: Prefecture) => void;
}

const REGIONS = Array.from(new Set(PREFECTURES.map((p) => p.region)));

export const PrefectureSelector: React.FC<PrefectureSelectorProps> = ({ onSelect }) => (
  <div className="p-4">
    <p className="text-gray-600 mb-4">都道府県を選ぶと、本日の当番医を検索します。</p>
    {REGIONS.map((region) => (
      <section key={region} className="mb-5">
        <h2 className="text-sm font-bold text-teal-700 mb-2">{region}</h2>
        <div className="grid grid-cols-3 gap-2">
          {PREFECTURES.filter((p) => p.region === region).map((pref) => (
            <button
              key={pref.id}
              onClick={() => onSelect(pref)}
              className="min-h-[44px] bg-white border border-gray-200 rounded-lg text-gray-800 font-medium shadow-sm hover:border-teal-500 hover:bg-teal-50 active:bg-teal-100 transition-colors"
            >
              {pref.name}
            </button>
          ))}
        </div>
      </section>
    ))}
  </div>
);
