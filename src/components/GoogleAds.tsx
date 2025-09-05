import { useEffect } from "react";

type AdSenseProps = {
  id: string;
};

const AdSense = ({ id }: AdSenseProps) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-${id}`;
    script.crossOrigin = "anonymous";
    
    // Check if script is already loaded
    const existingScript = document.querySelector(`script[src="${script.src}"]`);
    if (!existingScript) {
      document.head.appendChild(script);
    }

    return () => {
      // Cleanup function to remove script if needed
      const scriptToRemove = document.querySelector(`script[src="${script.src}"]`);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [id]);

  return null;
}

export default AdSense;