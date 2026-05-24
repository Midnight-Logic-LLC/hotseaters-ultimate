/**
 * TrialMap — read-only Leaflet map for the trial's city/state.
 *
 * v0.1 geocoding is naïve: we render a placeholder card if no lat/long are
 * available (the V2 schema doesn't store them yet). The component shape is in
 * place so a future change can swap in real coordinates without UI churn.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface TrialMapProps {
  city?: string | null | undefined;
  state?: string | null | undefined;
  courthouse?: string | null | undefined;
  lat?: number | null | undefined;
  lng?: number | null | undefined;
}

export function TrialMap({
  city,
  state,
  courthouse,
  lat,
  lng,
}: TrialMapProps) {
  if (lat == null || lng == null) {
    return (
      <div className="rounded border border-stone-200 p-6 text-sm text-stone-500">
        <p className="font-medium">Map preview</p>
        <p>
          {courthouse ?? '—'} · {[city, state].filter(Boolean).join(', ') || '—'}
        </p>
        <p className="mt-2 text-xs">
          Geocoded coordinates land with the locations feature.
        </p>
      </div>
    );
  }

  const center: LatLngExpression = [lat, lng];
  return (
    <div style={{ height: '320px' }}>
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={center}>
          <Popup>
            {courthouse ?? 'Trial location'}
            <br />
            {[city, state].filter(Boolean).join(', ')}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
