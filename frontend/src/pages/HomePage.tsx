import { Link } from 'react-router-dom';
import { Search, MapPin, Calendar, Star, Shield, Clock, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative">
        <div className="grid lg:grid-cols-2 min-h-[92vh]">
          {/* Left panel (visual) */}
          <div className="relative hidden lg:block bg-earth-100">
            <div className="absolute inset-0 bg-[url('/horseshoe.svg')] bg-repeat opacity-[0.06]" />
            <div className="absolute inset-0 bg-gradient-to-br from-earth-900/15 via-transparent to-forest-900/10" />
          </div>

          {/* Right panel (content) */}
          <div className="relative bg-forest-800 text-white">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.04%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" />
            <div className="relative max-w-2xl px-6 sm:px-10 lg:px-16 py-20 lg:py-24 flex flex-col justify-center min-h-[92vh]">
              <h1 className="text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight mb-6">
                Boka hovslagare
                <span className="block text-forest-200">snabbt och tryggt</span>
              </h1>
              <p className="text-lg md:text-xl text-forest-100/90 mb-10 max-w-xl">
                Sök i ditt område, jämför profiler och boka tider online. Enkelt för hästägare — smidigt för hovslagare.
              </p>

              {/* Search Box */}
              <div className="bg-white text-earth-900 border border-earth-200 shadow-lg p-2">
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-earth-50 border border-earth-200">
                    <MapPin className="w-5 h-5 text-earth-400" />
                    <input
                      type="text"
                      placeholder="Sök på område"
                      className="w-full bg-transparent focus:outline-none text-earth-800 placeholder:text-earth-400"
                    />
                  </div>
                  <Link to="/farriers" className="btn-primary px-8">
                    <Search className="w-5 h-5" />
                    Sök
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-earth-900 mb-4">
              Så fungerar det
            </h2>
            <p className="text-lg text-earth-600 max-w-2xl mx-auto">
              Tre enkla steg för att hitta och boka rätt hovslagare för din häst
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Search,
                title: 'Sök',
                description: 'Sök efter hovslagare i ditt område. Filtrera på tjänster, betyg och tillgänglighet.'
              },
              {
                icon: Calendar,
                title: 'Boka',
                description: 'Välj en tid som passar dig och din häst. Få bekräftelse direkt i appen.'
              },
              {
                icon: Star,
                title: 'Betygsätt',
                description: 'Efter besöket kan du lämna ett omdöme och hjälpa andra hitta rätt hovslagare.'
              }
            ].map((step, index) => (
              <div
                key={index}
                className="relative p-8 border border-earth-200 bg-white group hover:shadow-md transition-all duration-300"
              >
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-forest-700 rounded-none flex items-center justify-center text-white font-bold text-xl shadow-md">
                  {index + 1}
                </div>
                <div className="w-14 h-14 bg-earth-50 border border-earth-200 rounded-none flex items-center justify-center mb-6">
                  <step.icon className="w-7 h-7 text-forest-700" />
                </div>
                <h3 className="font-display text-xl font-semibold text-earth-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-earth-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-earth-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-display text-4xl font-bold text-earth-900 mb-6">
                Varför välja Portalen?
              </h2>
              <p className="text-lg text-earth-600 mb-8">
                Vi har byggt den mest kompletta plattformen för att göra det enkelt att hitta och boka hovslagare.
              </p>
              
              <div className="space-y-6">
                {[
                  {
                    icon: Shield,
                    title: 'Verifierade hovslagare',
                    description: 'Alla hovslagare på plattformen är kontrollerade och certifierade.'
                  },
                  {
                    icon: MapPin,
                    title: 'Hitta lokala alternativ',
                    description: 'Sök på karta och hitta hovslagare som arbetar i ditt område.'
                  },
                  {
                    icon: Clock,
                    title: 'Enkel bokning',
                    description: 'Boka tider direkt online utan att behöva ringa runt.'
                  },
                  {
                    icon: Star,
                    title: 'Äkta omdömen',
                    description: 'Läs recensioner från andra hästägare innan du bokar.'
                  }
                ].map((feature, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-6 h-6 text-brand-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-earth-900 mb-1">{feature.title}</h3>
                      <p className="text-earth-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-brand-700 rounded-3xl transform rotate-3"></div>
              <div className="relative bg-white rounded-3xl p-8 shadow-xl">
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-earth-50 rounded-xl">
                      <div className="w-12 h-12 bg-brand-100 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-earth-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-earth-100 rounded w-1/2"></div>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="w-4 h-4 text-amber-400 fill-current" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-brand-600 to-brand-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-4xl font-bold text-white mb-6">
            Redo att hitta din hovslagare?
          </h2>
          <p className="text-xl text-brand-100 mb-8">
            Registrera dig gratis och börja söka bland hundratals professionella hovslagare.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="btn bg-white text-brand-600 hover:bg-brand-50 shadow-lg"
            >
              Skapa konto
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/farriers"
              className="btn border-2 border-white text-white hover:bg-white/10"
            >
              Bläddra hovslagare
            </Link>
          </div>
        </div>
      </section>

      {/* For Farriers CTA */}
      <section className="py-24 bg-earth-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-2 bg-forest-500/20 text-forest-400 rounded-full text-sm font-medium mb-6">
                För hovslagare
              </span>
              <h2 className="font-display text-4xl font-bold text-white mb-6">
                Expandera din verksamhet med Portalen
              </h2>
              <p className="text-lg text-earth-400 mb-8">
                Nå tusentals hästägare som letar efter professionella hovslagare. 
                Hantera dina bokningar enkelt och bygg ditt rykte med kundrecensioner.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Kostnadsfritt att registrera sig',
                  'Få fler kunder i ditt område',
                  'Enkel boknings- och schemahantering',
                  'Bygg förtroende med verifierad profil'
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-earth-300">
                    <div className="w-5 h-5 bg-forest-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/register?role=farrier"
                className="btn bg-forest-500 text-white hover:bg-forest-600 shadow-lg"
              >
                Registrera dig som hovslagare
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-forest-600/20 to-brand-600/20 rounded-3xl"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

