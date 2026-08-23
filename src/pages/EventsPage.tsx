import React, { useState } from 'react';
import { Sparkles, MapPin, Calendar, Clock, ExternalLink, Image as ImageIcon, Heart } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatDate } from '../lib/utils';
import { ImageWithFallback, FALLBACK_EVENT_IMAGE } from '../components/common/ImageWithFallback';

export const EventsPage: React.FC = () => {
  const { events, settings } = useStore();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const upcomingEvents = events.filter((e) => e.status === 'upcoming');
  const pastEvents = events.filter((e) => e.status === 'past');

  const currentEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      
      {/* Header Banner */}
      <div className="animate-fade-slide-up text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-pink-100/80 text-pink-700 text-xs font-bold shadow-xs">
          <MapPin className="w-3.5 h-3.5" />
          <span>Offline Experience & Pop-Up Market</span>
        </div>
        <h1 className="font-playfair text-3xl sm:text-4xl font-bold text-[#2E241E]">
          Events & Bazaars ♡
        </h1>
        <p className="text-xs sm:text-sm text-[#66564E]">
          Kunjungi booth Dissof.id secara offline di Dumai! Coba langsung aksesoris, pilih kombinasi beads favoritmu, atau nikmati promo eksklusif event.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center">
        <div className="bg-white p-1.5 rounded-full border border-pink-200 shadow-xs flex items-center gap-2">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'upcoming'
                ? 'bg-pink-500 text-white shadow-md shadow-pink-200'
                : 'text-[#63544C] hover:text-pink-600'
            }`}
          >
            Upcoming Events ({upcomingEvents.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'past'
                ? 'bg-pink-500 text-white shadow-md shadow-pink-200'
                : 'text-[#63544C] hover:text-pink-600'
            }`}
          >
            Past Events ({pastEvents.length})
          </button>
        </div>
      </div>

      {/* Events List */}
      {currentEvents.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-pink-100 space-y-2">
          <p className="text-sm font-semibold text-[#4A3D36]">
            Belum ada jadwal event di kategori ini.
          </p>
          <p className="text-xs text-[#7B6A62]">
            Nantikan informasi pop-up market dan bazaar Dissof berikutnya di Instagram @dissof.id ♡
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {currentEvents.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-3xl border border-pink-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow grid grid-cols-1 lg:grid-cols-12"
            >
              {/* Poster Column */}
              <div className="lg:col-span-5 relative bg-[#FAF6F0] aspect-[4/3] lg:aspect-auto">
                <ImageWithFallback
                  src={event.poster_url}
                  alt={event.title}
                  fallbackSrc={FALLBACK_EVENT_IMAGE}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-pink-600 shadow-xs border border-pink-100">
                  {event.status === 'upcoming' ? '✨ Upcoming' : 'Event Selesai'}
                </div>
              </div>

              {/* Information Column */}
              <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  {event.tagline && (
                    <span className="text-[11px] font-bold text-pink-500 uppercase tracking-wider">
                      {event.tagline}
                    </span>
                  )}
                  <h2 className="font-playfair text-xl sm:text-2xl font-bold text-[#2E241E]">
                    {event.title}
                  </h2>

                  {/* Date, Time, Location pills */}
                  <div className="flex flex-wrap gap-2.5 pt-1">
                    <div className="flex items-center gap-1.5 bg-pink-50 text-pink-800 text-xs font-semibold px-3 py-1.5 rounded-full border border-pink-100">
                      <Calendar className="w-3.5 h-3.5 text-pink-600" />
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-pink-50 text-pink-800 text-xs font-semibold px-3 py-1.5 rounded-full border border-pink-100">
                      <Clock className="w-3.5 h-3.5 text-pink-600" />
                      <span>{event.time}</span>
                    </div>
                    {event.booth_number && (
                      <div className="flex items-center gap-1.5 bg-purple-50 text-purple-800 text-xs font-bold px-3 py-1.5 rounded-full border border-purple-100">
                        <span>🎪 {event.booth_number}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-2 text-xs text-[#5E4E46] pt-1">
                    <MapPin className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                    <span>{event.location}</span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#66564E] leading-relaxed pt-2">
                    {event.description}
                  </p>
                </div>

                {/* Gallery Photos */}
                {event.gallery_images && event.gallery_images.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-pink-100">
                    <span className="text-[11px] font-bold text-[#4A3D36]">Dokumentasi Foto Event:</span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {event.gallery_images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt="Dokumentasi event"
                          className="w-16 h-16 rounded-xl object-cover border border-pink-200 shrink-0 shadow-2xs"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Action button */}
                {event.google_maps_url && (
                  <div className="pt-2">
                    <a
                      href={event.google_maps_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-600 hover:text-pink-700 bg-pink-50 hover:bg-pink-100 px-4 py-2 rounded-full transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka Petunjuk Arah di Google Maps</span>
                    </a>
                  </div>
                )}

              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
