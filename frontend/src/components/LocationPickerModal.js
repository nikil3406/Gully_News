import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/**
 * LocationPickerModal
 *
 * Props:
 *  - isOpen        {boolean}   Whether the modal is visible
 *  - onClose       {function}  Called when user cancels
 *  - onConfirm     {function}  Called with { latitude, longitude, areaName } when user confirms
 *  - initialCoords {object}    { latitude, longitude } to seed the map (optional)
 */
export default function LocationPickerModal({ isOpen, onClose, onConfirm, initialCoords }) {
  const mapRef          = useRef(null);
  const mapInstanceRef  = useRef(null);
  const markerRef       = useRef(null);

  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError,   setSearchError]   = useState('');
  const [pickedArea,    setPickedArea]    = useState('');
  const [pickedCoords,  setPickedCoords]  = useState(null);

  // --- Helpers ---------------------------------------------------------------

  const reverseGeocode = async (lat, lng) => {
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      const addr = data.address || {};
      const name =
        addr.suburb         ||
        addr.neighbourhood  ||
        addr.village        ||
        addr.town           ||
        addr.city_district  ||
        addr.city           ||
        addr.county         ||
        addr.state_district ||
        addr.state          ||
        '';
      setPickedArea(name);
      setPickedCoords({ latitude: lat, longitude: lng });
    } catch {
      setPickedCoords({ latitude: lat, longitude: lng });
    }
  };

  const moveMarker = (lat, lng) => {
    if (!mapInstanceRef.current || !markerRef.current) return;
    markerRef.current.setLatLng([lat, lng]);
    mapInstanceRef.current.setView([lat, lng], 13);
    reverseGeocode(lat, lng);
  };

  // --- Initialise / destroy map when modal opens/closes --------------------

  useEffect(() => {
    if (!isOpen) return;

    // Small delay so the modal is rendered before Leaflet measures the div
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) return; // already initialised

      const defaultLat = initialCoords?.latitude  ?? 12.9716;
      const defaultLng = initialCoords?.longitude ?? 77.5946;

      const map = L.map(mapRef.current).setView([defaultLat, defaultLng], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      const marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);

      marker.on('dragend', () => {
        const { lat, lng } = marker.getLatLng();
        reverseGeocode(lat, lng);
        setPickedCoords({ latitude: lat, longitude: lng });
      });

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        reverseGeocode(lat, lng);
      });

      mapInstanceRef.current = map;
      markerRef.current      = marker;

      // Seed area name from initial coords
      reverseGeocode(defaultLat, defaultLng);
    }, 120);

    return () => clearTimeout(timer);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Destroy map when modal closes
  useEffect(() => {
    if (!isOpen && mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markerRef.current      = null;
      setSearchQuery('');
      setSearchError('');
      setPickedArea('');
      setPickedCoords(null);
    }
  }, [isOpen]);

  // --- Search ---------------------------------------------------------------

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchError('');
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`,
        { headers: { 'User-Agent': 'GullyNewsApp/1.0' } }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        moveMarker(lat, lng);
      } else {
        setSearchError('Location not found. Try a city or neighbourhood name.');
      }
    } catch {
      setSearchError('Search failed. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  // --- Confirm --------------------------------------------------------------

  const handleConfirm = () => {
    if (!pickedCoords) return;
    onConfirm({ ...pickedCoords, areaName: pickedArea });
  };

  // --- Render ---------------------------------------------------------------

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15,23,42,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 20,
          boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
          width: '100%',
          maxWidth: 560,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 20px 14px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>📍 Change Browse Location</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
              Search a place, or click / drag the map pin to pick any location
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9', border: 'none', borderRadius: '50%',
              width: 32, height: 32, cursor: 'pointer',
              fontSize: 16, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >✕</button>
        </div>

        {/* Search bar */}
        <div style={{ padding: '14px 20px 10px' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search a city, neighbourhood, area…"
              style={{
                flex: 1, padding: '9px 14px', borderRadius: 12,
                border: '1.5px solid #e2e8f0', outline: 'none',
                fontSize: 13, color: '#0f172a', background: '#f8fafc',
              }}
            />
            <button
              type="submit"
              disabled={searchLoading}
              style={{
                padding: '9px 18px', borderRadius: 12,
                background: '#1e293b', color: '#fff',
                fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {searchLoading ? '…' : 'Search'}
            </button>
          </form>
          {searchError && (
            <p style={{ margin: '6px 0 0', fontSize: 11, color: '#ef4444' }}>{searchError}</p>
          )}
        </div>

        {/* Map */}
        <div
          ref={mapRef}
          style={{ flex: 1, minHeight: 280, margin: '0 20px', borderRadius: 14, overflow: 'hidden', border: '1.5px solid #e2e8f0' }}
        />

        {/* Picked location chip */}
        <div style={{ padding: '10px 20px 0', minHeight: 36 }}>
          {pickedArea && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#eff6ff', border: '1px solid #bfdbfe',
              borderRadius: 30, padding: '5px 12px',
              fontSize: 12, fontWeight: 700, color: '#1d4ed8',
            }}>
              <span>📍</span> {pickedArea}
            </div>
          )}
          {pickedCoords && !pickedArea && (
            <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
              {pickedCoords.latitude.toFixed(5)}, {pickedCoords.longitude.toFixed(5)}
            </span>
          )}
        </div>

        {/* Actions */}
        <div style={{
          padding: '14px 20px 18px',
          display: 'flex', gap: 10, justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 22px', borderRadius: 30,
              background: '#f1f5f9', border: 'none',
              fontSize: 13, fontWeight: 700, color: '#475569', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!pickedCoords}
            style={{
              padding: '10px 28px', borderRadius: 30,
              background: pickedCoords ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : '#cbd5e1',
              border: 'none', color: '#fff',
              fontSize: 13, fontWeight: 800, cursor: pickedCoords ? 'pointer' : 'not-allowed',
              boxShadow: pickedCoords ? '0 4px 14px rgba(37,99,235,0.3)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            Use This Location
          </button>
        </div>
      </div>
    </div>
  );
}
