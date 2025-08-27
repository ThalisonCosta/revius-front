import { useEffect } from 'react';
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
    adsbygoogle: any[];
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
  
  // Don't show ads to pro/premium users
  const shouldShowAds = !profile || profile.subscription_tier === 'free';

  useEffect(() => {
    if (!shouldShowAds) return;

    try {
      // Initialize adsbygoogle since script is now loaded globally
      setTimeout(() => {
        try {
          if (window.adsbygoogle) {
            window.adsbygoogle.push({});
          }
        } catch (e) {
          console.log('AdSense not ready yet');
        }
      }, 100);
    } catch (error) {
      console.error('Error initializing Google Ads:', error);
    }
  }, [shouldShowAds]);

  if (!shouldShowAds) {
    return null;
  }

  return (
    <div className={`google-ads-container ${className}`}>
      <ins
        className="adsbygoogle"
        style={style}
        data-ad-client="ca-pub-9929888811411344"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive.toString()}
      />
    </div>
  );
};

export default GoogleAds;