import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import { Icon } from 'leaflet';
import {
  Star, MapPin, Phone, Mail, Clock, Award, Calendar,
  CheckCircle, MessageSquare, ArrowRight
} from 'lucide-react';
import BackButton from '../components/BackButton';
import { farriersApi, reviewsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import 'leaflet/dist/leaflet.css';

const markerIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const DAYS = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'];

export default function FarrierProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuthStore();

  const { data: farrier, isLoading } = useQuery({
    queryKey: ['farrier', id],
    queryFn: () => farriersApi.get(Number(id)),
    enabled: !!id,
  });

  const { data: reviews } = useQuery({
    queryKey: ['farrier-reviews', id],
    queryFn: () => reviewsApi.listForFarrier(Number(id)),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!farrier) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-display font-bold text-earth-900 mb-2">
            Hovslagare hittades inte
          </h2>
          <Link to="/farriers" className="text-brand-600 hover:underline">
            Tillbaka till sökning
          </Link>
        </div>
      </div>
    );
  }

  const fullName = `${farrier.user_first_name} ${farrier.user_last_name}`;

  return (
    <div className="min-h-screen bg-earth-50">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-6">
        <BackButton to="/farriers" />
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-earth-900 to-brand-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar */}
            <div className="w-32 h-32 bg-brand-100 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl">
              {farrier.user_profile_image ? (
                <img
                  src={farrier.user_profile_image.startsWith('http') ? farrier.user_profile_image : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${farrier.user_profile_image}`}
                  alt={fullName}
                  className="w-32 h-32 rounded-2xl object-cover"
                />
              ) : (
                <span className="text-5xl font-sans font-bold text-brand-600">
                  {farrier.user_first_name?.[0]}{farrier.user_last_name?.[0]}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-display text-3xl md:text-4xl font-bold">
                  {farrier.business_name || fullName}
                </h1>
                {farrier.is_verified && (
                  <span className="badge-success">
                    <CheckCircle className="w-4 h-4" />
                    Verifierad
                  </span>
                )}
              </div>

              {farrier.business_name && (
                <p className="text-earth-300 text-lg mb-2">{fullName}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-earth-300 mb-4">
                {farrier.user_city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {farrier.user_city}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  {farrier.experience_years} års erfarenhet
                </span>
              </div>

              {/* Rating */}
              {farrier.total_reviews > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-6 h-6 ${
                          star <= farrier.average_rating
                            ? 'text-amber-400 fill-current'
                            : 'text-earth-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-2xl font-bold">{farrier.average_rating.toFixed(1)}</span>
                  <span className="text-earth-300">({farrier.total_reviews} omdömen)</span>
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="w-full md:w-auto">
              {isAuthenticated && user?.role === 'horse_owner' ? (
                <Link
                  to={`/owner/bookings/new/${farrier.id}`}
                  className="btn bg-brand-500 text-white hover:bg-brand-600 w-full md:w-auto shadow-lg"
                >
                  <Calendar className="w-5 h-5" />
                  Boka tid
                </Link>
              ) : !isAuthenticated ? (
                <Link
                  to="/login"
                  className="btn bg-brand-500 text-white hover:bg-brand-600 w-full md:w-auto shadow-lg"
                >
                  Logga in för att boka
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            {farrier.description && (
              <div className="card p-6">
                <h2 className="font-display text-xl font-semibold text-earth-900 mb-4">
                  Om {farrier.business_name || fullName}
                </h2>
                <p className="text-earth-600 whitespace-pre-line">{farrier.description}</p>
              </div>
            )}

            {/* Services */}
            {farrier.services?.length > 0 && (
              <div className="card p-6">
                <h2 className="font-display text-xl font-semibold text-earth-900 mb-4">
                  Tjänster & Priser
                </h2>
                <div className="space-y-3">
                  {farrier.services.filter(s => s.is_active).map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between p-4 bg-earth-50 rounded-xl"
                    >
                      <div>
                        <h3 className="font-medium text-earth-900">{service.name}</h3>
                        {service.description && (
                          <p className="text-sm text-earth-500">{service.description}</p>
                        )}
                        <span className="text-sm text-earth-500">
                          <Clock className="w-3 h-3 inline mr-1" />
                          Ca {service.duration_minutes} min
                        </span>
                      </div>
                      <span className="text-xl font-bold text-brand-600">
                        {service.price} kr
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="card p-6">
              <h2 className="font-display text-xl font-semibold text-earth-900 mb-4">
                Omdömen ({reviews?.length || 0})
              </h2>
              
              {reviews?.length ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-earth-100 pb-4 last:border-0">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                          {review.author_image ? (
                            <img src={review.author_image} alt="" className="w-10 h-10 rounded-full" />
                          ) : (
                            <span className="font-medium text-brand-600">
                              {review.author_name?.[0]}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-earth-900">{review.author_name}</span>
                            <span className="text-sm text-earth-500">
                              {format(new Date(review.created_at), 'd MMM yyyy', { locale: sv })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 my-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= review.rating
                                    ? 'text-amber-400 fill-current'
                                    : 'text-earth-300'
                                }`}
                              />
                            ))}
                          </div>
                          {review.title && (
                            <h4 className="font-medium text-earth-900">{review.title}</h4>
                          )}
                          {review.comment && (
                            <p className="text-earth-600 mt-1">{review.comment}</p>
                          )}
                          
                          {/* Farrier response */}
                          {review.farrier_response && (
                            <div className="mt-3 ml-4 pl-4 border-l-2 border-brand-200 bg-brand-50 p-3 rounded-r-lg">
                              <p className="text-sm font-medium text-brand-700 mb-1">
                                <MessageSquare className="w-4 h-4 inline mr-1" />
                                Svar från hovslagaren
                              </p>
                              <p className="text-sm text-earth-600">{review.farrier_response}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-earth-500 text-center py-8">
                  Inga omdömen ännu
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="card p-6">
              <h3 className="font-display text-lg font-semibold text-earth-900 mb-4">
                Kontaktuppgifter
              </h3>
              <div className="space-y-3">
                {farrier.user_phone && (
                  <a
                    href={`tel:${farrier.user_phone}`}
                    className="flex items-center gap-3 text-earth-600 hover:text-brand-600"
                  >
                    <div className="w-10 h-10 bg-earth-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5" />
                    </div>
                    {farrier.user_phone}
                  </a>
                )}
                {farrier.user_email && (
                  <a
                    href={`mailto:${farrier.user_email}`}
                    className="flex items-center gap-3 text-earth-600 hover:text-brand-600"
                  >
                    <div className="w-10 h-10 bg-earth-100 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5" />
                    </div>
                    {farrier.user_email}
                  </a>
                )}
              </div>
            </div>

            {/* Schedule */}
            {farrier.schedules?.length > 0 && (
              <div className="card p-6">
                <h3 className="font-display text-lg font-semibold text-earth-900 mb-4">
                  Tillgänglighet
                </h3>
                <div className="space-y-2">
                  {farrier.schedules
                    .filter(s => s.is_available)
                    .sort((a, b) => a.day_of_week - b.day_of_week)
                    .map((schedule) => (
                      <div key={schedule.id} className="flex justify-between text-sm">
                        <span className="text-earth-600">{DAYS[schedule.day_of_week]}</span>
                        <span className="text-earth-900 font-medium">
                          {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Work Areas */}
            {farrier.areas?.length > 0 && (
              <div className="card p-6">
                <h3 className="font-display text-lg font-semibold text-earth-900 mb-4">
                  Arbetsområden
                </h3>
                <div className="flex flex-wrap gap-2">
                  {farrier.areas.map((area) => (
                    <span
                      key={area.id}
                      className="px-3 py-1 bg-earth-100 text-earth-700 rounded-full text-sm"
                    >
                      {area.city}
                      {area.travel_fee > 0 && (
                        <span className="text-earth-500"> (+{area.travel_fee} kr)</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Map */}
            {farrier.base_latitude && farrier.base_longitude && (
              <div className="card overflow-hidden">
                <div className="h-64">
                  <MapContainer
                    center={[farrier.base_latitude, farrier.base_longitude]}
                    zoom={10}
                    className="h-full w-full"
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; OpenStreetMap'
                    />
                    <Marker
                      position={[farrier.base_latitude, farrier.base_longitude]}
                      icon={markerIcon}
                    />
                    <Circle
                      center={[farrier.base_latitude, farrier.base_longitude]}
                      radius={farrier.travel_radius_km * 1000}
                      pathOptions={{
                        color: '#d4844a',
                        fillColor: '#d4844a',
                        fillOpacity: 0.1,
                      }}
                    />
                  </MapContainer>
                </div>
                <div className="p-4 bg-earth-50">
                  <p className="text-sm text-earth-600">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Arbetar inom {farrier.travel_radius_km} km radie
                  </p>
                </div>
              </div>
            )}

            {/* Book CTA */}
            {isAuthenticated && user?.role === 'horse_owner' && (
              <Link
                to={`/owner/bookings/new/${farrier.id}`}
                className="btn-primary w-full justify-center"
              >
                Boka tid hos {farrier.user_first_name}
                <ArrowRight className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

