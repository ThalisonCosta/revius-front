import Script from "next/script";

type AdSenseProps = {
  id: string;
};

const AdSense = ({ id }: AdSenseProps) => {
  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-${id}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  )
}

export default AdSense;