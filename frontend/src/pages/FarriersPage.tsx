import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Search, MapPin, Star, Filter, List, Map as MapIcon, SlidersHorizontal, X, CheckCircle, Clock } from 'lucide-react';
import { farriersApi, horsesApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import type { FarrierListItem, FarrierSearchFilters, Horse as HorseType } from '../types';
import { format, addDays } from 'date-fns';
import { sv } from 'date-fns/locale';
import 'leaflet/dist/leaflet.css';

// Tillgängliga tider att filtrera på
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', 
  '13:00', '14:00', '15:00', '16:00', '17:00'
];

// Fix for default marker icon
const markerIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

type ExtendedFarrier = FarrierListItem & { available_in_area?: boolean; reason?: string; available_times?: string[] };

// Simple geocoding for common Swedish cities
const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  'stockholm': { lat: 59.3293, lng: 18.0686 },
  'göteborg': { lat: 57.7089, lng: 11.9746 },
  'malmö': { lat: 55.6059, lng: 13.0007 },
  'uppsala': { lat: 59.8586, lng: 17.6389 },
  'västerås': { lat: 59.6099, lng: 16.5448 },
  'örebro': { lat: 59.2741, lng: 15.2066 },
  'linköping': { lat: 58.4108, lng: 15.6214 },
  'helsingborg': { lat: 56.0467, lng: 12.6944 },
  'jönköping': { lat: 57.7815, lng: 14.1562 },
  'norrköping': { lat: 58.5877, lng: 16.1924 },
  'lund': { lat: 55.7047, lng: 13.1910 },
  'umeå': { lat: 63.8258, lng: 20.2630 },
  'gävle': { lat: 60.6749, lng: 17.1413 },
  'borås': { lat: 57.7210, lng: 12.9401 },
  'eskilstuna': { lat: 59.3712, lng: 16.5074 },
  'södertälje': { lat: 59.1955, lng: 17.6252 },
  'karlstad': { lat: 59.3793, lng: 13.5036 },
  'täby': { lat: 59.4439, lng: 18.0687 },
  'växjö': { lat: 56.8777, lng: 14.8091 },
  'halmstad': { lat: 56.6745, lng: 12.8568 },
};

// Default center of Sweden
const DEFAULT_CENTER: [number, number] = [62.0, 15.0];

export default function FarriersPage() {
  const { isAuthenticated } = useAuthStore();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [filters, setFilters] = useState<FarrierSearchFilters>({
    radius_km: 50,
  });
  const [searchCity, setSearchCity] = useState('');
  const [selectedHorse, setSelectedHorse] = useState<HorseType | null>(null);
  const [searchMode, setSearchMode] = useState<'location' | 'horse'>('location');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Get user's horses if logged in
  const { data: horses } = useQuery({
    queryKey: ['horses'],
    queryFn: horsesApi.list,
    enabled: isAuthenticated,
  });

  // Get available farriers in area (using availability API)
  const { data: availableFarriers } = useQuery({
    queryKey: ['available-farriers', selectedHorse?.stable_city],
    queryFn: async () => {
      if (!selectedHorse?.stable_city) return null;
      const response = await api.get(`/availability/available-farriers?area=${selectedHorse.stable_city}`);
      return response.data;
    },
    enabled: searchMode === 'horse' && !!selectedHorse?.stable_city,
  });

  // Get farrier availability for selected date
  const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const { data: availabilityData } = useQuery({
    queryKey: ['farrier-availability', dateStr],
    queryFn: async () => {
      const response = await api.get(`/availability/farrier-locations?date_str=${dateStr}`);
      return response.data;
    },
    enabled: !!selectedDate,
  });

  // Get user's location
  useEffect(() => {
    if (searchMode === 'location' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFilters(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));
        },
        () => {
          // Default to Stockholm if geolocation fails
          setFilters(prev => ({
            ...prev,
            latitude: 59.3293,
            longitude: 18.0686,
          }));
        }
      );
    }
  }, [searchMode]);

  // When horse is selected, update search
  useEffect(() => {
    if (selectedHorse && searchMode === 'horse') {
      if (selectedHorse.stable_latitude && selectedHorse.stable_longitude) {
        setFilters(prev => ({
          ...prev,
          latitude: parseFloat(selectedHorse.stable_latitude!),
          longitude: parseFloat(selectedHorse.stable_longitude!),
          city: selectedHorse.stable_city,
        }));
      } else if (selectedHorse.stable_city) {
        setFilters(prev => ({
          ...prev,
          city: selectedHorse.stable_city,
        }));
      }
    }
  }, [selectedHorse, searchMode]);

  // Auto-collapse the filter panel when the user scrolls down towards the map.
  // Note: scrolling over the Leaflet map often zooms the map instead of scrolling the page,
  // so we also use IntersectionObserver to collapse as soon as the map is in view.
  useEffect(() => {
    if (!showFilters) return;

    // Close immediately if map is already in view.
    const initialTop = mapContainerRef.current?.getBoundingClientRect().top;
    if (typeof initialTop === 'number' && initialTop < window.innerHeight * 0.6) {
      setShowFilters(false);
      return;
    }

    let observer: IntersectionObserver | null = null;
    if (mapContainerRef.current && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry?.isIntersecting) {
            setShowFilters(false);
          }
        },
        {
          root: null,
          threshold: 0.01,
        }
      );
      observer.observe(mapContainerRef.current);
    }

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const mapTop = mapContainerRef.current?.getBoundingClientRect().top;
        // If map is near the viewport, collapse filters to give it more space.
        if (typeof mapTop === 'number' && mapTop < 220) {
          setShowFilters(false);
          return;
        }
        // Fallback: if user scrolls a bit down, also collapse.
        if (window.scrollY > 420) {
          setShowFilters(false);
        }
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, [showFilters]);

  const { data: farriers, isLoading } = useQuery({
    queryKey: ['farriers', filters, searchMode],
    queryFn: () => farriersApi.list(filters),
    enabled: searchMode === 'location' || (searchMode === 'horse' && (!!filters.city || (!!filters.latitude && !!filters.longitude))),
  });

  const handleSearch = () => {
    const city = searchCity.trim().toLowerCase();
    const coords = cityCoordinates[city];
    
    setFilters(prev => ({
      ...prev,
      city: searchCity || undefined,
      // Set coordinates if we have them for the city, otherwise keep existing or use default
      latitude: coords?.lat || prev.latitude || DEFAULT_CENTER[0],
      longitude: coords?.lng || prev.longitude || DEFAULT_CENTER[1],
    }));
  };

  // Create a map of farrier availability from availability data
  const farrierAvailabilityMap = new Map<number, string[]>();
  if (availabilityData?.farriers) {
    for (const f of availabilityData.farriers) {
      farrierAvailabilityMap.set(f.farrier_id, f.available_times || []);
    }
  }

  // Combine regular farriers with available farriers
  const displayFarriers: ExtendedFarrier[] = (() => {
    let result: ExtendedFarrier[] = [];
    
    if (searchMode === 'horse') {
      // Start with all farriers in the area
      const allFarriers = (farriers || []) as ExtendedFarrier[];
      
      // Mark farriers from availableFarriers as available_in_area
      if (availableFarriers?.farriers && availableFarriers.farriers.length > 0) {
        const availableIds = new Set(availableFarriers.farriers.map((af: any) => af.id));
        const reasonMap = new Map<number, string | undefined>(availableFarriers.farriers.map((af: any) => [
          af.id, 
          typeof af.reason === 'string' ? af.reason : undefined
        ]));
        
        result = allFarriers.map(farrier => {
          if (availableIds.has(farrier.id)) {
            const reason = reasonMap.get(farrier.id);
            return { ...farrier, available_in_area: true, reason } as ExtendedFarrier;
          }
          return farrier;
        });
      } else {
        result = allFarriers;
      }
    } else {
      result = (farriers || []) as ExtendedFarrier[];
    }
    
    // Add availability info from availability data
    result = result.map(farrier => ({
      ...farrier,
      available_times: farrierAvailabilityMap.get(farrier.id) || [],
    }));
    
    // Filter by selected time if set
    if (selectedTime && selectedDate) {
      result = result.filter(farrier => 
        (farrier as any).available_times?.includes(selectedTime)
      );
    }
    
    return result;
  })();

  // Get map center - prioritize selected horse, then filters, then first farrier with coords, then default
  const getMapCenter = (): [number, number] => {
    if (selectedHorse?.stable_latitude && selectedHorse?.stable_longitude) {
      return [parseFloat(selectedHorse.stable_latitude), parseFloat(selectedHorse.stable_longitude)];
    }
    if (filters.latitude && filters.longitude) {
      return [filters.latitude, filters.longitude];
    }
    // Use first farrier's coordinates if available
    const firstFarrierWithCoords = displayFarriers?.find(f => f.base_latitude && f.base_longitude);
    if (firstFarrierWithCoords?.base_latitude && firstFarrierWithCoords?.base_longitude) {
      return [firstFarrierWithCoords.base_latitude, firstFarrierWithCoords.base_longitude];
    }
    return DEFAULT_CENTER;
  };

  // Check if we have farriers with coordinates to show on map
  const farriersWithCoords = displayFarriers?.filter(f => f.base_latitude && f.base_longitude) || [];

  const FarrierCard = ({ farrier }: { farrier: ExtendedFarrier }) => (
    <Link
      to={`/farriers/${farrier.id}`}
      className="card-hover p-5 flex gap-4 relative"
    >
      {farrier.available_in_area && (
        <div className="absolute top-4 right-4">
          <span className="badge-success flex items-center gap-1 text-xs">
            <CheckCircle className="w-3 h-3" />
            Tillgänglig i området
          </span>
        </div>
      )}
      {/* Avatar */}
      <div className="w-16 h-16 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
        {farrier.user_profile_image ? (
          <img
            src={farrier.user_profile_image.startsWith('http') ? farrier.user_profile_image : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${farrier.user_profile_image}`}
            alt={`${farrier.user_first_name} ${farrier.user_last_name}`}
            className="w-16 h-16 rounded-xl object-cover"
          />
        ) : (
          <span className="text-2xl font-sans font-bold text-brand-600">
            {farrier.user_first_name?.[0]}{farrier.user_last_name?.[0]}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-earth-900 truncate">
              {farrier.business_name || `${farrier.user_first_name} ${farrier.user_last_name}`}
            </h3>
            <div className="flex items-center gap-2 text-sm text-earth-500">
              <MapPin className="w-4 h-4" />
              <span>{farrier.user_city || 'Plats ej angiven'}</span>
              {farrier.distance_km && (
                <span className="text-brand-600 font-medium">
                  • {farrier.distance_km} km
                </span>
              )}
            </div>
          </div>
          
          {/* Rating */}
          {farrier.total_reviews > 0 && (
            <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
              <Star className="w-4 h-4 text-amber-500 fill-current" />
              <span className="font-medium text-amber-700">{farrier.average_rating.toFixed(1)}</span>
              <span className="text-amber-600 text-sm">({farrier.total_reviews})</span>
            </div>
          )}
        </div>

        {/* Description */}
        {farrier.description && (
          <p className="text-sm text-earth-600 mt-2 line-clamp-2">
            {farrier.description}
          </p>
        )}

        {/* Tags */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {farrier.is_verified && (
            <span className="badge-success text-xs">Verifierad</span>
          )}
          {farrier.available_in_area && (
            <span className="badge-info text-xs">
              {farrier.reason || 'Tillgänglig i ditt område'}
            </span>
          )}
          <span className="text-sm text-earth-500">
            {farrier.experience_years} års erfarenhet
          </span>
          {farrier.min_price && (
            <span className="text-sm text-earth-500">
              • Från {farrier.min_price} kr
            </span>
          )}
        </div>

        {/* Available times when date is selected */}
        {selectedDate && farrier.available_times && farrier.available_times.length > 0 && (
          <div className="mt-3 pt-3 border-t border-earth-100">
            <p className="text-xs text-green-600 font-medium mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Lediga tider {format(selectedDate, 'd/M', { locale: sv })}:
            </p>
            <div className="flex flex-wrap gap-1">
              {farrier.available_times.slice(0, 6).map(time => (
                <span 
                  key={time} 
                  className={`px-2 py-0.5 rounded text-xs ${
                    time === selectedTime 
                      ? 'bg-green-500 text-white font-medium' 
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {time}
                </span>
              ))}
              {farrier.available_times.length > 6 && (
                <span className="text-xs text-earth-500">
                  +{farrier.available_times.length - 6} fler
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Link>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="bg-white border-b border-earth-100 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Search Mode Toggle */}
          {isAuthenticated ? (
            horses && horses.length > 0 ? (
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => {
                    setSearchMode('horse');
                    if (horses.length === 1) setSelectedHorse(horses[0]);
                  }}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    searchMode === 'horse'
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-earth-200 hover:border-earth-300'
                  }`}
                >
                Sök baserat på min plats
                </button>
                <button
                  onClick={() => setSearchMode('location')}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    searchMode === 'location'
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-earth-200 hover:border-earth-300'
                  }`}
                >
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Sök på plats
                </button>
              </div>
            ) : (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-amber-800 text-sm">
                  <strong>Tips:</strong> Registrera en häst för att söka hovslagare baserat på var din häst står!{' '}
                  <Link to="/owner/horses" className="text-brand-600 hover:underline font-medium">
                    Lägg till häst →
                  </Link>
                </p>
              </div>
            )
          ) : null}

          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            {searchMode === 'horse' && isAuthenticated && horses ? (
              <div className="flex-1 flex gap-2">
                <select
                  className="input flex-1"
                  value={selectedHorse?.id || ''}
                  onChange={(e) => {
                    const horse = horses.find(h => h.id === Number(e.target.value));
                    setSelectedHorse(horse || null);
                  }}
                >
                  <option value="">Välj häst...</option>
                  {horses.map(horse => (
                    <option key={horse.id} value={horse.id}>
                      {horse.name} {horse.stable_city && `(${horse.stable_city})`}
                    </option>
                  ))}
                </select>
                {selectedHorse && (
                  <div className="flex items-center gap-2 px-4 bg-brand-50 rounded-xl">
                    <MapPin className="w-5 h-5 text-brand-600" />
                    <span className="text-sm text-brand-700">
                      {selectedHorse.stable_city || 'Plats ej angiven'}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex gap-2">
                <div className="flex-1 relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-400" />
                  <input
                    type="text"
                    placeholder="Sök stad eller kommun..."
                    className="input pl-12"
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <button onClick={handleSearch} className="btn-primary">
                  <Search className="w-5 h-5" />
                  <span className="hidden sm:inline">Sök</span>
                </button>
              </div>
            )}

            {/* View Toggle & Filters */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn-secondary ${showFilters ? 'bg-earth-200' : ''}`}
              >
                <SlidersHorizontal className="w-5 h-5" />
                Filter
              </button>
              
              <div className="flex bg-earth-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' ? 'bg-white shadow-sm' : 'text-earth-500 hover:text-earth-700'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'map' ? 'bg-white shadow-sm' : 'text-earth-500 hover:text-earth-700'
                  }`}
                >
                  <MapIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Date & Time Filter */}
          <div className="mt-4 p-4 bg-earth-50 rounded-xl">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {/* Date Selection */}
              <div className="flex items-center gap-2">
                <div className="flex gap-1 flex-wrap">
                  <button
                    onClick={() => {
                      setSelectedDate(null);
                      setSelectedTime(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      !selectedDate
                        ? 'bg-brand-500 text-white'
                        : 'bg-white border border-earth-200 text-earth-600 hover:bg-earth-100'
                    }`}
                  >
                    Alla dagar
                  </button>
                  {[0, 1, 2, 3, 4, 5, 6].map(dayOffset => {
                    const date = addDays(new Date(), dayOffset);
                    const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
                    return (
                      <button
                        key={dayOffset}
                        onClick={() => setSelectedDate(date)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          isSelected
                            ? 'bg-brand-500 text-white'
                            : 'bg-white border border-earth-200 text-earth-600 hover:bg-earth-100'
                        }`}
                      >
                        {dayOffset === 0 ? 'Idag' : dayOffset === 1 ? 'Imorgon' : format(date, 'EEE d/M', { locale: sv })}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Time Selection - only show when date is selected */}
            {selectedDate && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedTime(null)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    !selectedTime
                      ? 'bg-green-500 text-white'
                      : 'bg-white border border-earth-200 text-earth-600 hover:bg-earth-100'
                  }`}
                >
                  Alla tider
                </button>
                {TIME_SLOTS.map(time => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedTime === time
                        ? 'bg-green-500 text-white'
                        : 'bg-white border border-earth-200 text-earth-600 hover:bg-earth-100'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}

            {/* Filter info */}
            {selectedDate && (
              <p className="mt-3 text-sm text-green-600">
                {selectedTime 
                  ? `Visar hovslagare lediga ${format(selectedDate, 'd MMMM', { locale: sv })} kl ${selectedTime}`
                  : `Visar hovslagare med bokningar ${format(selectedDate, 'd MMMM', { locale: sv })}`
                }
                {displayFarriers.length > 0 && ` (${displayFarriers.length} st)`}
              </p>
            )}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-earth-50 rounded-xl animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-earth-900 flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtrera resultat
                </h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-1 hover:bg-earth-200 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Radie</label>
                  <select
                    className="input"
                    value={filters.radius_km}
                    onChange={(e) => setFilters(prev => ({ ...prev, radius_km: Number(e.target.value) }))}
                  >
                    <option value={10}>10 km</option>
                    <option value={25}>25 km</option>
                    <option value={50}>50 km</option>
                    <option value={100}>100 km</option>
                    <option value={200}>200 km</option>
                  </select>
                </div>
                
                <div>
                  <label className="label">Max pris</label>
                  <select
                    className="input"
                    value={filters.max_price || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, max_price: e.target.value ? Number(e.target.value) : undefined }))}
                  >
                    <option value="">Alla</option>
                    <option value={500}>Max 500 kr</option>
                    <option value={1000}>Max 1000 kr</option>
                    <option value={1500}>Max 1500 kr</option>
                  </select>
                </div>
                
                <div>
                  <label className="label">Tjänst</label>
                  <select
                    className="input"
                    value={filters.service_type || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, service_type: e.target.value || undefined }))}
                  >
                    <option value="">Alla tjänster</option>
                    <option value="verkning">Verkning</option>
                    <option value="skoning">Skoning</option>
                    <option value="akut">Akut hovvård</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : viewMode === 'list' ? (
            <div className="space-y-4">
              {searchMode === 'horse' && selectedHorse ? (
                <div className="p-4 bg-brand-50 rounded-xl border border-brand-200">
                  <p className="font-medium text-brand-900 mb-1">
                    Söker hovslagare för {selectedHorse.name}
                  </p>
                  <p className="text-sm text-brand-700">
                    Hittar hovslagare som är tillgängliga i <strong>{selectedHorse.stable_city}</strong> och närliggande områden
                  </p>
                  {availableFarriers?.nearby_areas && (
                    <p className="text-xs text-brand-600 mt-2">
                      Söker i: {availableFarriers.nearby_areas.join(', ')}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-earth-600">
                  {displayFarriers?.length || 0} hovslagare hittade
                </p>
              )}
            
            <div className="grid gap-4">
              {displayFarriers?.map((farrier) => (
                <FarrierCard key={farrier.id} farrier={farrier} />
              ))}
            </div>
            
            {displayFarriers?.length === 0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-earth-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-earth-400" />
                </div>
                <h3 className="font-semibold text-earth-900 mb-2">Inga hovslagare hittade</h3>
                <p className="text-earth-600">Försök med en annan plats eller bredare filter</p>
              </div>
            )}
          </div>
        ) : (
          <div
            ref={mapContainerRef}
            className="h-[calc(100vh-16rem)] rounded-2xl overflow-hidden shadow-lg"
          >
            {displayFarriers && displayFarriers.length > 0 ? (
              <MapContainer
                center={getMapCenter()}
                zoom={selectedHorse ? 11 : farriersWithCoords.length > 0 ? 10 : 6}
                className="h-full w-full"
                key={selectedHorse?.id || filters.city || 'default'} // Force re-render when horse or city changes
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                
                {/* Markers for farriers with coordinates */}
                {farriersWithCoords.map((farrier: ExtendedFarrier) => (
                  <Marker
                    key={farrier.id}
                    position={[farrier.base_latitude!, farrier.base_longitude!]}
                    icon={markerIcon}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-semibold">
                          {farrier.business_name || `${farrier.user_first_name} ${farrier.user_last_name}`}
                        </h3>
                        {farrier.user_city && (
                          <p className="text-sm text-gray-600">{farrier.user_city}</p>
                        )}
                        {farrier.available_in_area && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-forest-100 text-forest-700 rounded text-xs">
                            Tillgänglig i området
                          </span>
                        )}
                        {farrier.total_reviews > 0 && (
                          <div className="flex items-center gap-1 text-sm mt-1">
                            <Star className="w-4 h-4 text-amber-500 fill-current" />
                            <span>{farrier.average_rating.toFixed(1)}</span>
                            <span className="text-gray-500 text-xs">({farrier.total_reviews})</span>
                          </div>
                        )}
                        {farrier.distance_km && (
                          <p className="text-xs text-gray-500 mt-1">{farrier.distance_km} km bort</p>
                        )}
                        <Link
                          to={`/farriers/${farrier.id}`}
                          className="text-brand-600 text-sm hover:underline mt-2 inline-block"
                        >
                          Visa profil →
                        </Link>
                      </div>
                    </Popup>
                  </Marker>
                ))}
                
                {/* Marker for selected horse location */}
                {selectedHorse?.stable_latitude && selectedHorse?.stable_longitude && (
                  <Marker
                    position={[parseFloat(selectedHorse.stable_latitude), parseFloat(selectedHorse.stable_longitude)]}
                    icon={new Icon({
                      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                      iconSize: [25, 41],
                      iconAnchor: [12, 41],
                    })}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-semibold">{selectedHorse.name}</h3>
                        <p className="text-sm text-gray-600">{selectedHorse.stable_city}</p>
                        <p className="text-xs text-gray-500">Din hästs stallplats</p>
                      </div>
                    </Popup>
                  </Marker>
                )}
              </MapContainer>
            ) : (
              <div className="h-full flex items-center justify-center bg-earth-50">
                <div className="text-center">
                  <p className="text-earth-500 mb-2">Inga hovslagare hittade</p>
                  <p className="text-sm text-earth-400">Försök med en annan sökning</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

