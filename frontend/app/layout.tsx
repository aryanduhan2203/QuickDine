import './globals.css';

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
      <body>{children}</body>
    </html>
  );
}
