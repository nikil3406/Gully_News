import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import L from 'leaflet';
import { getPostPayload } from '../utils/postLocation';
import { fetchCategories, createPost } from '../services/postService';

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function CreatePost() {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category_id: '',
    location_id: '',
    image_url: '',
    video_url: '',
    latitude: '',
    longitude: '',
    city: '',
    state: '',
    country: ''
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const navigate = useNavigate();

  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);

  useEffect(() => {
    // Check if logged in
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch categories
    const loadCategories = async () => {
      try {
        const data = await fetchCategories();
        setCategories(data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    loadCategories();
  }, [navigate]);

  useEffect(() => {
    if (!mapInstanceRef.current && document.getElementById('map')) {
      const initialLat = 12.9716; // Bangalore default
      const initialLng = 77.5946;
      
      const map = L.map('map').setView([initialLat, initialLng], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      
      mapInstanceRef.current = map;
      
      const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);
      markerInstanceRef.current = marker;

      const updateLocationState = (lat, lng, city = '', state = '', country = '') => {
        if (mapInstanceRef.current === map) {
          setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            city,
            state,
            country
          }));
        }
      };

      const reverseGeocode = async (lat, lng) => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
            {
              headers: {
                'User-Agent': 'GullyNewsApp/1.0'
              }
            }
          );
          if (response.ok) {
            const data = await response.json();
            const address = data.address || {};
            
            const city = address.city || address.town || address.village || address.suburb || address.county || '';
            const state = address.state || '';
            const country = address.country || '';
            
            updateLocationState(lat, lng, city, state, country);
          } else {
            updateLocationState(lat, lng);
          }
        } catch (err) {
          console.error('Error reverse geocoding:', err);
          updateLocationState(lat, lng);
        }
      };

      // Try to get user's current location initially
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          if (mapInstanceRef.current === map) {
            const uLat = position.coords.latitude;
            const uLng = position.coords.longitude;
            map.setView([uLat, uLng], 13);
            marker.setLatLng([uLat, uLng]);
            reverseGeocode(uLat, uLng);
          }
        }, (err) => {
          console.warn("Geolocation error, using default center", err);
          if (mapInstanceRef.current === map) {
            reverseGeocode(initialLat, initialLng);
          }
        });
      } else {
        if (mapInstanceRef.current === map) {
          reverseGeocode(initialLat, initialLng);
        }
      }
      
      // Handle map clicks
      map.on('click', (e) => {
        if (mapInstanceRef.current === map) {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          updateLocationState(lat, lng);
          reverseGeocode(lat, lng);
        }
      });
      
      // Handle marker dragend
      marker.on('dragend', () => {
        if (mapInstanceRef.current === map) {
          const { lat, lng } = marker.getLatLng();
          updateLocationState(lat, lng);
          reverseGeocode(lat, lng);
        }
      });
    }
    
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      }
    };
  }, []);

  const updateLocationState = (lat, lng, city = '', state = '', country = '') => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      city,
      state,
      country
    }));
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        {
          headers: {
            'User-Agent': 'GullyNewsApp/1.0'
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        const address = data.address || {};
        
        const city = address.city || address.town || address.village || address.suburb || address.county || '';
        const state = address.state || '';
        const country = address.country || '';
        
        updateLocationState(lat, lng, city, state, country);
      } else {
        updateLocationState(lat, lng);
      }
    } catch (err) {
      console.error('Error reverse geocoding:', err);
      updateLocationState(lat, lng);
    }
  };

  const handleSearchLocation = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setError('');
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            'User-Agent': 'GullyNewsApp/1.0'
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const firstResult = data[0];
          const lat = parseFloat(firstResult.lat);
          const lng = parseFloat(firstResult.lon);
          
          if (mapInstanceRef.current && markerInstanceRef.current) {
            mapInstanceRef.current.setView([lat, lng], 13);
            markerInstanceRef.current.setLatLng([lat, lng]);
            reverseGeocode(lat, lng);
          }
        } else {
          setError('Location not found. Try search with city name.');
        }
      }
    } catch (err) {
      console.error('Error searching location:', err);
      setError('Failed to search location.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to create a post.');
      setLoading(false);
      return;
    }

    try {
      const fallbackLocation = {
        latitude: formData.latitude || 12.9716,
        longitude: formData.longitude || 77.5946,
      };
      const markerLocation = mapInstanceRef.current && markerInstanceRef.current
        ? {
            latitude: markerInstanceRef.current.getLatLng().lat,
            longitude: markerInstanceRef.current.getLatLng().lng,
          }
        : null;
      const payload = getPostPayload(formData, fallbackLocation, markerLocation);

      await createPost(payload);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-grow">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-xs">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 text-center mb-1 select-none">Create News Post</h1>
          <p className="text-xs sm:text-sm text-slate-500 text-center mb-6 select-none">Share what's happening in your gully</p>
          
          {error && <div className="bg-red-50 text-red-700 border-l-4 border-red-500 p-3.5 rounded-r-xl text-xs md:text-sm mb-4">⚠️ {error}</div>}
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider text-left">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="What's the news?"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-sm bg-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider text-left">Category</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-sm bg-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider text-left">Image URL (Optional)</label>
                <input
                  type="text"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-sm bg-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Location Picker Section */}
            <div className="flex flex-col gap-3 p-4 bg-slate-50 border border-slate-200/60 rounded-2xl">
              <h3 className="text-sm font-bold text-slate-700 text-left select-none flex items-center gap-1">
                <span>📍</span> Location Details
              </h3>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search for a location (e.g. Indiranagar, Bangalore)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-grow px-3.5 py-2 rounded-xl border border-slate-200 outline-none text-sm bg-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={handleSearchLocation}
                  disabled={searchLoading}
                  className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-700 active:bg-slate-900 transition-all cursor-pointer border-none"
                >
                  {searchLoading ? 'Searching...' : 'Search'}
                </button>
              </div>

              <div id="map" className="h-[250px] w-full rounded-xl border border-slate-200 bg-slate-100 relative z-0"></div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mt-1">
                <div className="flex flex-col gap-1 bg-white p-2.5 rounded-lg border border-slate-200/50">
                  <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">City</span>
                  <span className="text-slate-700 truncate">{formData.city || 'Not selected'}</span>
                </div>
                <div className="flex flex-col gap-1 bg-white p-2.5 rounded-lg border border-slate-200/50">
                  <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">State</span>
                  <span className="text-slate-700 truncate">{formData.state || 'Not selected'}</span>
                </div>
                <div className="flex flex-col gap-1 bg-white p-2.5 rounded-lg border border-slate-200/50">
                  <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Country</span>
                  <span className="text-slate-700 truncate">{formData.country || 'Not selected'}</span>
                </div>
                <div className="flex flex-col gap-1 bg-white p-2.5 rounded-lg border border-slate-200/50 col-span-2 sm:col-span-3">
                  <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Coordinates (Lat, Lng)</span>
                  <span className="text-slate-600 font-mono">
                    {formData.latitude && formData.longitude 
                      ? `${Number(formData.latitude).toFixed(6)}, ${Number(formData.longitude).toFixed(6)}` 
                      : 'Drag marker or click map to set location'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider text-left">Content</label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Write the full story here..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-sm bg-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[160px] resize-y"
                required
              />
            </div>

            <button 
              type="submit" 
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-full shadow-md shadow-blue-100 hover:shadow-lg transition-all duration-200 cursor-pointer select-none border-none mt-2"
              disabled={loading}
            >
              {loading ? 'Publishing...' : 'Publish Post 🚀'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreatePost;
