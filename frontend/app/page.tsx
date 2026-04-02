'use client';
import dynamic from 'next/dynamic';
import { Suspense, useEffect, useState } from 'react';
import { AuthUser } from '../types/hospital';
import { setAccessToken } from '../lib/api';

const HospitalRadar = dynamic(() => import('../components/HospitalRadar'), { ssr: false });

const LINE_CLIENT_ID   = process.env.NEXT_PUBLIC_LINE_CHANNEL_ID!;
const LINE_REDIRECT    = process.env.NEXT_PUBLIC_LINE_REDIRECT_URI!;
const LINE_AUTH_URL    = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${LINE_CLIENT_ID}&redirect_uri=${encodeURIComponent(LINE_REDIRECT)}&state=hospital_radar&scope=profile`;

export default function HomePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Restore user from sessionStorage on reload
    const stored = sessionStorage.getItem('user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch (_) {}
    }
    setReady(true);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    setAccessToken(null);
    setUser(null);
  };

  if (!ready) return (
    <div className="w-full h-screen bg-[#0d1117] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#00e5ff] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <Suspense fallback={
      <div className="w-full h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#00e5ff] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#00e5ff] font-mono text-sm tracking-widest">INITIALIZING RADAR...</p>
        </div>
      </div>
    }>
      {/* LINE login button (shown when not logged in) */}
      {!user && (
        <div className="absolute bottom-20 right-4 z-[900]">
          <a
            href={LINE_AUTH_URL}
            className="flex items-center gap-2 bg-[#06C755] hover:bg-[#05a847] text-white font-bold text-sm px-4 py-3 rounded-2xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
            </svg>
            เข้าสู่ระบบด้วย LINE
          </a>
        </div>
      )}

      <HospitalRadar user={user} onLogout={handleLogout} />
    </Suspense>
  );
}
