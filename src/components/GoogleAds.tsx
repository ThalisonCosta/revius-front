import { useEffect, useRef, useState } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';

interface GoogleAdsProps {
  slot: string;
  format?: string;
  responsive?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: Array<Record<string, unknown>>;
  }
}

const GoogleAds: React.FC<GoogleAdsProps> = ({ 
  slot, 
  format = 'auto', 
  responsive = true, 
  style = { display: 'block' },
  className = ""
}) => {
  const { profile } = useUserProfile();
  const adRef = useRef<HTMLModElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);
  
  // Don't show ads to pro/premium users
  const shouldShowAds = !profile || profile.subscription_tier === 'free';

  useEffect(() => {
    if (!shouldShowAds) return;
    
    // Validate slot format (should be 10 digits)
    if (!/^\d{10}$/.test(slot)) {
      const errorMsg = `Invalid ad slot format: "${slot}". Should be 10 digits.`;
      console.error(errorMsg);
      setAdError(errorMsg);
      return;
    }

    // Check if AdSense script is loaded
    if (!window.adsbygoogle) {
      const errorMsg = 'AdSense script not loaded. Check your internet connection and script tag.';
      console.error(errorMsg);
      setAdError(errorMsg);
      return;
    }

    try {
      // Wait for DOM to be ready
      const initializeAd = () => {
        try {
          console.log('Initializing Google Ad with slot:', slot);
          window.adsbygoogle.push({});
          setAdLoaded(true);
          console.log('Google Ad initialized successfully');
        } catch (e) {
          const errorMsg = `Failed to initialize ad: ${e}`;
          console.error(errorMsg);
          setAdError(errorMsg);
        }
      };

      if (document.readyState === 'complete') {
        initializeAd();
      } else {
        window.addEventListener('load', initializeAd);
        return () => window.removeEventListener('load', initializeAd);
      }
    } catch (error) {
      const errorMsg = `Error setting up Google Ads: ${error}`;
      console.error(errorMsg);
      setAdError(errorMsg);
    }
  }, [shouldShowAds, slot]);

  if (!shouldShowAds) {
    return null;
  }

  // Show error message in development
  if (adError) {
    return (
      <div className={`google-ads-container ${className} border border-red-200 bg-red-50 p-4 rounded`}>
        <p className="text-red-600 text-sm">
          <strong>Ad Error:</strong> {adError}
        </p>
        <p className="text-red-500 text-xs mt-1">
          This error message only shows in development. In production, the ad space will be empty.
        </p>
      </div>
    );
  }

  return (
    <div className={`google-ads-container ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={style}
        data-ad-client="ca-pub-9929888811411344"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive.toString()}
      />
      {!adLoaded && (
        <div className="ad-loading text-center p-4 text-gray-500 text-sm">
          Loading advertisement...
        </div>
      )}
    </div>
  );
};

export default GoogleAds;