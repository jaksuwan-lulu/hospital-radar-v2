'use client';
import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginWithLine } from '../../../lib/api';

function CallbackInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) { router.replace('/'); return; }
    const redirectUri = `${window.location.origin}/auth/callback`;
    loginWithLine(code, redirectUri)
      .then(user => {
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

export default function LineCallback() {
  return (
    <Suspense fallback={
      <div className="w-full h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#00e5ff] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CallbackInner />
    </Suspense>
  );
}
