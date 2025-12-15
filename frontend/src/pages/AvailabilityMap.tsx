import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Icon, DivIcon } from 'leaflet';
import { Calendar, Clock, MapPin, Phone, Star, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { sv } from 'date-fns/locale';
import api from '../services/api';
import 'leaflet/dist/leaflet.css';

interface FarrierLocation {
  farrier_id: number;
  farrier_name: string;
  business_name?: string;
  phone?: string;
  profile_image?: string;
  booked_areas: string[];
  available_areas: string[];
  primary_location?: string;
  primary_coordinates?: { lat: number; lng: number };
  bookings: Array<{
    id: number;
    time: string;
    service: string;
    location: string;
  }>;
}

interface AvailabilityData {
  date: string;
  farriers: FarrierLocation[];
  area_coordinates: Record<string, { lat: number; lng: number }>;
}

// Custom marker icon
const createFarrierIcon = (name: string, color: string) => {
  return new DivIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: ${color};
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        border: 3px solid white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      ">
        ${name.split(' ').map(n => n[0]).join('')}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const COLORS = ['#d4844a', '#567556', '#4a7fd4', '#d44a4a', '#9b4ad4'];

export default function AvailabilityMap() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedArea, setSelectedArea] = useState<string | null>(null);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const { data, isLoading } = useQuery<AvailabilityData>({
    queryKey: ['availability', dateStr],
    queryFn: async () => {
      const response = await api.get(`/availability/farrier-locations?date_str=${dateStr}`);
      return response.data;
    },
  });

  const navigateDay = (direction: number) => {
    setSelectedDate(prev => addDays(prev, direction));
  };

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="bg-white border-b border-earth-100 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-earth-900">
                Hovslagare i området
              </h1>
              <p className="text-earth-600">
                Se var hovslagare befinner sig och är tillgängliga
              </p>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center gap-2 bg-earth-50 rounded-xl p-1">
              <button
                onClick={() => navigateDay(-1)}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="px-4 py-2 min-w-[180px] text-center">
                <p className="font-medium text-earth-900">
                  {isToday ? 'Idag' : format(selectedDate, 'EEEE', { locale: sv })}
                </p>
                <p className="text-sm text-earth-500">
                  {format(selectedDate, 'd MMMM yyyy', { locale: sv })}
                </p>
              </div>
              
              <button
                onClick={() => navigateDay(1)}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Map */}
            <div className="lg:col-span-2">
              <div className="card overflow-hidden h-[500px] lg:h-[600px]">
                <MapContainer
                  center={[59.3293, 18.0686]}
                  zoom={9}
                  className="h-full w-full"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap'
                  />
                  
                  {/* Markers for each farrier */}
                  {data?.farriers.map((farrier, index) => {
                    if (!farrier.primary_coordinates) return null;
                    
                    const color = COLORS[index % COLORS.length];
                    
                    return (
                      <div key={farrier.farrier_id}>
                        {/* Main marker */}
                        <Marker
                          position={[farrier.primary_coordinates.lat, farrier.primary_coordinates.lng]}
                          icon={createFarrierIcon(farrier.farrier_name, color)}
                        >
                          <Popup>
                            <div className="p-2 min-w-[200px]">
                              <h3 className="font-bold text-lg">
                                {farrier.business_name || farrier.farrier_name}
                              </h3>
                              <p className="text-gray-600 text-sm mb-2">{farrier.farrier_name}</p>
                              
                              <div className="border-t pt-2 mt-2">
                                <p className="font-medium text-sm mb-1">Områden idag:</p>
                                <div className="flex flex-wrap gap-1">
                                  {farrier.booked_areas.map(area => (
                                    <span key={area} className="px-2 py-0.5 bg-brand-100 text-brand-700 rounded text-xs">
                                      {area}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="border-t pt-2 mt-2">
                                <p className="font-medium text-sm mb-1">Tillgänglig i:</p>
                                <div className="flex flex-wrap gap-1">
                                  {farrier.available_areas.slice(0, 5).map(area => (
                                    <span key={area} className="px-2 py-0.5 bg-forest-100 text-forest-700 rounded text-xs">
                                      {area}
                                    </span>
                                  ))}
                                  {farrier.available_areas.length > 5 && (
                                    <span className="text-xs text-gray-500">
                                      +{farrier.available_areas.length - 5} till
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="border-t pt-2 mt-2">
                                <p className="font-medium text-sm">{farrier.bookings.length} bokningar</p>
                              </div>
                              
                              {farrier.phone && (
                                <a
                                  href={`tel:${farrier.phone}`}
                                  className="mt-2 block text-center bg-brand-500 text-white py-1 px-3 rounded text-sm hover:bg-brand-600"
                                >
                                  📞 {farrier.phone}
                                </a>
                              )}
                            </div>
                          </Popup>
                        </Marker>
                        
                        {/* Coverage circle */}
                        <Circle
                          center={[farrier.primary_coordinates.lat, farrier.primary_coordinates.lng]}
                          radius={15000}
                          pathOptions={{
                            color: color,
                            fillColor: color,
                            fillOpacity: 0.1,
                            weight: 2,
                            dashArray: '5, 5',
                          }}
                        />
                      </div>
                    );
                  })}
                </MapContainer>
              </div>
              
              {/* Legend */}
              <div className="mt-4 p-4 bg-white rounded-xl border border-earth-100">
                <h3 className="font-medium text-earth-900 mb-3">Förklaring</h3>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-brand-500"></div>
                    <span>Hovslagarens position</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-3 border-2 border-dashed border-brand-500 rounded opacity-50"></div>
                    <span>Tillgängligt område (~15 km)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar - Farrier List */}
            <div className="space-y-4">
              <div className="card p-4">
                <h2 className="font-display text-lg font-semibold text-earth-900 mb-1">
                  Hovslagare {format(selectedDate, 'd/M', { locale: sv })}
                </h2>
                <p className="text-sm text-earth-500 mb-4">
                  {data?.farriers.length || 0} hovslagare har bokningar
                </p>
                
                {data?.farriers.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-earth-300 mx-auto mb-3" />
                    <p className="text-earth-500">Inga bokningar denna dag</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data?.farriers.map((farrier, index) => (
                      <div
                        key={farrier.farrier_id}
                        className="p-4 bg-earth-50 rounded-xl hover:bg-earth-100 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          >
                            {farrier.farrier_name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-earth-900 truncate">
                              {farrier.business_name || farrier.farrier_name}
                            </h3>
                            <p className="text-sm text-earth-500">{farrier.farrier_name}</p>
                            
                            {/* Today's areas */}
                            <div className="mt-2">
                              <p className="text-xs text-earth-400 mb-1">Befinner sig i:</p>
                              <div className="flex flex-wrap gap-1">
                                {farrier.booked_areas.map(area => (
                                  <span
                                    key={area}
                                    className="px-2 py-0.5 bg-white text-earth-700 rounded text-xs border border-earth-200"
                                  >
                                    {area}
                                  </span>
                                ))}
                              </div>
                            </div>
                            
                            {/* Bookings */}
                            <div className="mt-2 text-xs text-earth-500">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {farrier.bookings.length} bokningar: {' '}
                              {farrier.bookings.map(b => b.time).join(', ')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Info Box */}
              <div className="card p-4 bg-gradient-to-br from-brand-50 to-earth-50">
                <h3 className="font-medium text-earth-900 mb-2 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-brand-500" />
                  Hur det fungerar
                </h3>
                <p className="text-sm text-earth-600">
                  När en hovslagare har en bokning i ett område blir de 
                  <strong> tillgängliga för fler bokningar</strong> i närliggande kommuner samma dag. 
                  Detta sparar restid och ger bättre tillgänglighet!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

