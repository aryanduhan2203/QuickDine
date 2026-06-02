import './globals.css';
import { GoogleAnalytics } from '@next/third-parties/google';

export const metadata = {
  title: 'Nearby Restaurant Finder',
  description: 'Search nearby restaurants by entering a location.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
}
