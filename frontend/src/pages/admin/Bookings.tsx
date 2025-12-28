import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from 'lucide-react';
import BackButton from '../../components/BackButton';
import { adminApi } from '../../services/api';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  pending: { label: 'Väntar', class: 'badge-warning' },
  confirmed: { label: 'Bekräftad', class: 'badge-success' },
  in_progress: { label: 'Pågående', class: 'badge-info' },
  completed: { label: 'Slutförd', class: 'badge-success' },
  cancelled: { label: 'Avbokad', class: 'badge-error' },
};

export default function AdminBookings() {
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['admin-bookings', statusFilter],
    queryFn: () => adminApi.listAllBookings(statusFilter || undefined),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <div className="mb-4">
        <BackButton to="/admin" label="Tillbaka till dashboard" />
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-earth-900">Alla bokningar</h1>
          <p className="text-earth-600 mt-1">Övervaka och hantera bokningar på plattformen</p>
        </div>
        
        <select
          className="input w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Alla status</option>
          <option value="pending">Väntar</option>
          <option value="confirmed">Bekräftade</option>
          <option value="in_progress">Pågående</option>
          <option value="completed">Slutförda</option>
          <option value="cancelled">Avbokade</option>
        </select>
      </div>

      {/* Bookings Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-earth-50 border-b border-earth-100">
                <tr>
                  <th className="text-left p-4 font-medium text-earth-600">ID</th>
                  <th className="text-left p-4 font-medium text-earth-600">Datum/Tid</th>
                  <th className="text-left p-4 font-medium text-earth-600">Tjänst</th>
                  <th className="text-left p-4 font-medium text-earth-600">Hästägare</th>
                  <th className="text-left p-4 font-medium text-earth-600">Hovslagare</th>
                  <th className="text-left p-4 font-medium text-earth-600">Häst</th>
                  <th className="text-left p-4 font-medium text-earth-600">Status</th>
                  <th className="text-right p-4 font-medium text-earth-600">Pris</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-earth-100">
                {bookings?.map((booking) => (
                  <tr key={booking.id} className="hover:bg-earth-50">
                    <td className="p-4 text-earth-500 text-sm">#{booking.id}</td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-earth-900">
                          {format(new Date(booking.scheduled_date), 'd MMM yyyy', { locale: sv })}
                        </p>
                        <p className="text-sm text-earth-500">
                          {format(new Date(booking.scheduled_date), 'HH:mm')}
                        </p>
                      </div>
                    </td>
                    <td className="p-4 text-earth-900">{booking.service_type}</td>
                    <td className="p-4 text-earth-700">{booking.owner_name}</td>
                    <td className="p-4 text-earth-700">{booking.farrier_name}</td>
                    <td className="p-4 text-earth-700">{booking.horse_name}</td>
                    <td className="p-4">
                      <span className={STATUS_MAP[booking.status]?.class}>
                        {STATUS_MAP[booking.status]?.label}
                      </span>
                    </td>
                    <td className="p-4 text-right font-medium text-earth-900">
                      {booking.total_price} kr
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {bookings?.length === 0 && (
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 text-earth-300 mx-auto mb-4" />
            <p className="text-earth-500">Inga bokningar hittades</p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {bookings && bookings.length > 0 && (
        <div className="mt-6 p-4 bg-earth-50 rounded-xl">
          <p className="text-earth-600">
            Visar <strong>{bookings.length}</strong> bokningar
            {statusFilter && ` med status "${STATUS_MAP[statusFilter]?.label}"`}
          </p>
        </div>
      )}
    </div>
  );
}

