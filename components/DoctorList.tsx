import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Hospital, GroundingSource } from '../types';

interface DoctorListProps {
  hospitals: Hospital[];
  groundingSources: GroundingSource[];
  summary: string;
  prefectureName: string;
}

const HospitalMap: React.FC<{ hospitals: Hospital[] }> = ({ hospitals }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const points: L.LatLngTuple[] = [];
    hospitals.forEach((h) => {
      if (h.latitude == null || h.longitude == null) return;
      const point: L.LatLngTuple = [h.latitude, h.longitude];
      points.push(point);
      L.circleMarker(point, { radius: 8, color: '#0d9488', fillOpacity: 0.8 })
        .addTo(map)
        .bindPopup(h.name);
    });
    map.fitBounds(L.latLngBounds(points), { padding: [24, 24], maxZoom: 14 });

    return () => {
      map.remove();
    };
  }, [hospitals]);

  return <div ref={containerRef} className="h-56 rounded-lg overflow-hidden shadow" />;
};

export const DoctorList: React.FC<DoctorListProps> = ({ hospitals, groundingSources, summary, prefectureName }) => {
  const mappable = hospitals.filter((h) => h.latitude != null && h.longitude != null);

  return (
    <div className="p-4 space-y-4">
      {summary && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">
          {summary}
        </div>
      )}

      {mappable.length > 0 && <HospitalMap hospitals={mappable} />}

      {hospitals.length === 0 ? (
        <p className="text-center text-gray-600 py-8">
          {prefectureName}の当番医情報が見つかりませんでした。下の情報元や、自治体・医師会のサイトをご確認ください。
        </p>
      ) : (
        <ul className="space-y-3">
          {hospitals.map((h, i) => (
            <li key={`${h.name}-${i}`} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-bold text-gray-900">{h.name}</h3>
              {h.department && <p className="text-sm text-teal-700 mt-1">{h.department}</p>}
              {h.hours && <p className="text-sm text-gray-600 mt-1">受付: {h.hours}</p>}
              {h.address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name + ' ' + h.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-gray-600 mt-1 underline"
                >
                  {h.address}
                </a>
              )}
              {h.phone && (
                <a
                  href={`tel:${h.phone.replace(/[^\d+]/g, '')}`}
                  className="inline-block mt-3 bg-teal-600 text-white text-sm font-semibold px-4 py-2 rounded-lg"
                >
                  📞 {h.phone}
                </a>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-gray-500">
        ※AIが検索した結果のため、誤りがある場合があります。受診前に必ず電話でご確認ください。
      </p>

      {groundingSources.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-gray-700 mb-2">情報元</h2>
          <ul className="space-y-1">
            {groundingSources.map((s) => (
              <li key={s.uri}>
                <a href={s.uri} target="_blank" rel="noopener noreferrer" className="text-sm text-teal-700 underline break-all">
                  {s.title || s.uri}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
