import React from 'react';
import { ExternalLink, Cloud, Newspaper, Info, Sparkles } from 'lucide-react';

const TravelInfoSection: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Travel News and Updates */}
      <a
        href="https://www.aircanada.com/ca/en/aco/home/book/travel-news-and-updates.html#/"
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-white/80 border border-teal-200/50 rounded-lg p-4 hover:shadow-md transition-all group"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-teal-100 rounded-lg group-hover:bg-teal-200 transition-colors">
            <Newspaper className="h-5 w-5 text-teal-700" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold text-teal-800">Travel News and Updates</h3>
              <ExternalLink className="h-4 w-4 text-teal-500 group-hover:text-teal-700 transition-colors" />
            </div>
            <p className="text-sm text-gray-600">Stay informed about the latest travel advisories, flight changes, and important updates for your journey.</p>
          </div>
        </div>
      </a>

      {/* Weather Information */}
      <a
        href="https://weather.gc.ca/canada_e.html"
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-white/80 border border-teal-200/50 rounded-lg p-4 hover:shadow-md transition-all group"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-cyan-100 rounded-lg group-hover:bg-cyan-200 transition-colors">
            <Cloud className="h-5 w-5 text-cyan-700" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold text-teal-800">Canadian Weather</h3>
              <ExternalLink className="h-4 w-4 text-teal-500 group-hover:text-teal-700 transition-colors" />
            </div>
            <p className="text-sm text-gray-600">Check current weather conditions and forecasts for your destination across Canada.</p>
          </div>
        </div>
      </a>

      {/* Travel Tips */}
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200/50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-teal-200 rounded-lg">
            <Info className="h-5 w-5 text-teal-700" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-teal-800 mb-2">Travel Tips</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Arrive at the airport at least 2 hours before domestic flights</li>
              <li>• Check-in online 24 hours before departure</li>
              <li>• Review baggage allowances and restrictions</li>
              <li>• Keep your travel documents easily accessible</li>
            </ul>
          </div>
        </div>
      </div>

      {/* FlyPorter Promotion */}
      <div className="bg-gradient-to-br from-teal-600 to-cyan-600 rounded-lg p-5 text-white shadow-lg">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-2">FlyPorter - Your Trusted Travel Partner</h3>
            <p className="text-sm text-teal-50 mb-3">
              Experience seamless booking, competitive prices, and exceptional service. Join thousands of satisfied travelers who choose FlyPorter for their journey.
            </p>
            <div className="text-xs text-teal-100">
              ✈️ Best Price Guarantee | 🎯 24/7 Customer Support | 🌟 Award-Winning Service
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelInfoSection;

