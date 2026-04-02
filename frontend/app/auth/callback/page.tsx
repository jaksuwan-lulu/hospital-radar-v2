'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginWithLine, setAccessToken } from '../../lib/api';

// LINE redirects to /auth/callback?code=xxx&state=xxx
export default function LineCallback() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) { router.replace('/'); return; }

    const redirectUri = `${window.location.origin}/auth/callback`;

    loginWithLine(code, redirectUri)
      .then(user => {
        // Store user in sessionStorage (not localStorage — more secure)
        sessionStorage.setItem('user', JSON.stringify(user));
        router.replace('/');
      })
      .catch(() => router.replace('/'));
  }, []);

  return (
    <div className="w-full h-screen bg-[#0d1117] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#00e5ff] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#00e5ff] font-mono text-sm">กำลังเข้าสู่ระบบ...</p>
      </div>
    </div>
  );
}
