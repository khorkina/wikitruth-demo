import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const messages = [
  {
    title: "Wikipedia still can't be sold.",
    subtitle: "An important update for readers.",
    text: "Today is the day. We're sorry to interrupt, but this message will be up for only a few hours."
  },
  {
    title: "Knowledge belongs to everyone.",
    subtitle: "Help us keep it free.",
    text: "Wiki Truth is a free, privacy-first platform. We don't sell ads or track you. Instead, we rely on supporters like you."
  },
  {
    title: "Support independent research.",
    subtitle: "Your donation makes a difference.",
    text: "Your contribution helps us keep the service running and improve it for everyone."
  }
];

export function DonationBanner() {
  const [location] = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Show banner on main page on every page load/refresh
    if (location === '/' && !isDismissed) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [location, isDismissed]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    // Only persist within session navigation, but not on full page refresh
  };

  const handleAlreadyDonated = () => {
    handleDismiss();
  };

  const nextMessage = () => {
    setCurrentMessage((prev) => (prev + 1) % messages.length);
  };

  const prevMessage = () => {
    setCurrentMessage((prev) => (prev - 1 + messages.length) % messages.length);
  };

  if (!isVisible || isDismissed) {
    return null;
  }

  const message = messages[currentMessage];

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-[#c8ccd1] dark:bg-[#27292d] border-b border-[#a2a9b1] dark:border-[#54595d] shadow-sm">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-4">
            <button
              onClick={prevMessage}
              className="flex-shrink-0 p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors mt-4"
              aria-label="Previous message"
              data-testid="button-banner-prev"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-red-600 dark:text-red-500 text-xl">i</span>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                  {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}, {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase()}: "{message.title}" - {message.subtitle}
                </h3>
              </div>
              
              <p className="text-base md:text-lg text-gray-800 dark:text-gray-200 mb-6 leading-relaxed">
                {message.text}
              </p>

              <div className="flex justify-center gap-2 mb-4">
                {messages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentMessage(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentMessage 
                        ? 'bg-red-500' 
                        : 'bg-gray-400 dark:bg-gray-500 hover:bg-gray-500 dark:hover:bg-gray-400'
                    }`}
                    aria-label={`Go to message ${index + 1}`}
                    data-testid={`button-banner-dot-${index}`}
                  />
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <a
                  href="https://ko-fi.com/wikitruth"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="donation-proceed-button"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 bg-[#36c] hover:bg-[#2a4b8d] text-white font-semibold rounded transition-colors duration-200 text-base"
                  onClick={handleDismiss}
                >
                  Proceed with the donation
                </a>
              </div>

              <div className="flex items-center justify-center gap-6 mt-4 text-sm text-gray-600 dark:text-gray-400">
                <button
                  onClick={handleAlreadyDonated}
                  className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors flex items-center gap-1"
                  data-testid="button-already-donated"
                >
                  <span className="text-green-600 dark:text-green-500">✓</span>
                  I've already donated
                </button>
                <button
                  onClick={handleDismiss}
                  className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                  data-testid="button-maybe-later"
                >
                  Maybe later
                </button>
              </div>
            </div>

            <button
              onClick={nextMessage}
              className="flex-shrink-0 p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors mt-4"
              aria-label="Next message"
              data-testid="button-banner-next"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            <button
              onClick={handleDismiss}
              data-testid="donation-close-button"
              className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              aria-label="Close banner"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
