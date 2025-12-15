import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-earth-900 text-earth-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8 2 5 6 5 12c0 4 2 7 2 7l2-1s-2-3-2-6c0-5 3-8 5-8s5 3 5 8c0 3-2 6-2 6l2 1s2-3 2-7c0-6-3-10-7-10z"/>
                </svg>
              </div>
              <span className="font-display text-xl font-semibold text-white">Portalen</span>
            </div>
            <p className="text-earth-400 max-w-md">
              Sveriges ledande plattform för att boka professionella hovslagare. 
              Vi kopplar samman hästägare med kvalificerade hovslagare i hela landet.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-semibold text-white mb-4">Snabblänkar</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/farriers" className="hover:text-brand-400 transition-colors">
                  Hitta hovslagare
                </Link>
              </li>
              <li>
                <Link to="/register?role=farrier" className="hover:text-brand-400 transition-colors">
                  Bli hovslagare
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-brand-400 transition-colors">
                  Om oss
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-brand-400 transition-colors">
                  Kontakt
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-white mb-4">Kontakt</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-400" />
                <a href="mailto:info@portalen.se" className="hover:text-brand-400 transition-colors">
                  info@portalen.se
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-400" />
                <a href="tel:+46701234567" className="hover:text-brand-400 transition-colors">
                  070-123 45 67
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-400 mt-0.5" />
                <span>Stockholm, Sverige</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-earth-800 mt-10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-earth-500 text-sm">
            © {new Date().getFullYear()} Portalen. Alla rättigheter förbehållna.
          </p>
          <div className="flex gap-6 text-sm">
            <Link to="/privacy" className="hover:text-brand-400 transition-colors">
              Integritetspolicy
            </Link>
            <Link to="/terms" className="hover:text-brand-400 transition-colors">
              Användarvillkor
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

