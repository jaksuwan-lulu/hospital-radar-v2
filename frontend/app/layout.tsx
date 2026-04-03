import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hospital Radar — หาโรงพยาบาลใกล้คุณ',
  description: 'ค้นหาโรงพยาบาลใกล้เคียง ตรวจสอบสถานะการเปิด-ปิดบริการ',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        {/* viewport-fit=cover ให้ใช้ safe-area-inset บนมือถือ */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body className="bg-[#0d1117] text-white font-sarabun overflow-hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {children}
      </body>
    </html>
  );
}
