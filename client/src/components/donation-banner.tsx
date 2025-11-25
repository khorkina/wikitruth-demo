import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { X, Heart } from 'lucide-react';

export function DonationBanner() {
  const [location] = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (location === '/') {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [location]);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-amber-50 to-yellow-50 border-b-2 border-amber-200 shadow-md animate-in slide-in-from-top duration-500">
      <div className="container mx-auto px-4 py-4 md:py-5">
        <div className="flex items-start gap-3 md:gap-4">
          <div className="flex-shrink-0 mt-1">
            <Heart className="w-6 h-6 md:w-8 md:h-8 text-red-500 fill-red-500" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2">
              Support Wiki Truth - Keep Knowledge Free
            </h3>
            <p className="text-sm md:text-base text-gray-800 mb-3 leading-relaxed">
              Wiki Truth is a free, privacy-first platform that helps you discover how topics are presented across cultures. 
              We don't sell ads or track you. Instead, we rely on supporters like you.
              <span className="hidden md:inline"> Your donation helps us keep the service running and improve it for everyone.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <a
                href="https://ko-fi.com/wikitruth"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="donation-kofi-link"
                className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors duration-200 shadow-sm hover:shadow-md text-sm md:text-base"
                onClick={handleDismiss}
              >
                <Heart className="w-4 h-4 mr-2 fill-white" />
                Support on Ko-fi
              </a>
              
              <button
                onClick={handleDismiss}
                data-testid="donation-dismiss-button"
                className="inline-flex items-center justify-center px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200 transition-colors duration-200 text-sm md:text-base"
              >
                Maybe Later
              </button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            data-testid="donation-close-button"
            className="flex-shrink-0 p-1 rounded-full hover:bg-gray-200 transition-colors duration-200"
            aria-label="Close banner"
          >
            <X className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
