import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { GroundingSource, Hospital } from '../types';

interface DoctorListProps {
  hospitals: Hospital[];
  groundingSources: GroundingSource[];
  summary: string;
  prefectureName: string;
}

const hasLocation = (h: Hospital): h is Hospital & { latitude: number; longitude: number } =>
  typeof h.latitude === 'number' && typeof h.longitude === 'number';

const HospitalMap: React.FC<{ hospitals: Hospital[] }> = ({ hospitals }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const located = hospitals.filter(hasLocation);
    if (!containerRef.current || located.length === 0) return;

    const map = L.map(containerRef.current);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const points = located.map((h) => {
      L.circleMarker([h.latitude, h.longitude], { radius: 8, color: '#0d9488', fillOpacity: 0.8 })
        .bindPopup(h.name)
        .addTo(map);
      return L.latLng(h.latitude, h.longitude);
    });
    map.fitBounds(L.latLngBounds(points), { padding: [24, 24], maxZoom: 14 });

    return () => {
      map.remove();
    };
  }, [hospitals]);

  if (!hospitals.some(hasLocation)) return null;
  return <div ref={containerRef} className="h-56 rounded-lg overflow-hidden shadow mb-4" />;
};

export const DoctorList: React.FC<DoctorListProps> = ({ hospitals, groundingSources, summary, prefectureName }) => (
  <div className="p-4">
    {summary && (
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-4 text-sm text-gray-700 whitespace-pre-wrap">
        {summary}
      </div>
    )}

    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-xs text-amber-800">
      AIによる検索結果です。受診前に必ず医療機関や自治体の公式情報で確認してください。緊急時は119番へ。
    </div>

    <HospitalMap hospitals={hospitals} />

    {hospitals.length === 0 ? (
      <p className="text-center text-gray-600 py-8">{prefectureName}の当番医が見つかりませんでした。</p>
    ) : (
      <ul className="space-y-3">
        {hospitals.map((h, i) => (
          <li key={`${h.name}-${i}`} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="font-bold text-gray-900">{h.name}</h3>
            {h.department && <p className="text-sm text-teal-700 mt-1">{h.department}</p>}
            {h.hours && <p className="text-sm text-gray-600 mt-1">診療時間：{h.hours}</p>}
            {h.address && <p className="text-sm text-gray-600 mt-1">{h.address}</p>}
            <div className="flex gap-2 mt-3">
              {h.phone && (
                <a
                  href={`tel:${h.phone.replace(/[^\d+]/g, '')}`}
                  className="flex-1 min-h-[44px] flex items-center justify-center bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors"
                >
                  電話する
                </a>
              )}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${h.name} ${h.address ?? prefectureName}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-h-[44px] flex items-center justify-center border border-teal-600 text-teal-700 rounded-lg font-semibold hover:bg-teal-50 transition-colors"
              >
                地図で見る
              </a>
            </div>
          </li>
        ))}
      </ul>
    )}

    {groundingSources.length > 0 && (
      <section className="mt-6">
        <h2 className="text-sm font-bold text-gray-700 mb-2">情報源</h2>
        <ul className="space-y-1">
          {groundingSources.map((s) => (
            <li key={s.uri}>
              <a href={s.uri} target="_blank" rel="noopener noreferrer" className="text-sm text-teal-700 underline break-all">
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </section>
    )}
  </div>
);
