import React, { useEffect, useState } from 'react';

export function QuotaBanner() {
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuotaExceeded = () => {
      setQuotaExceeded(true);
    };

    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  if (!quotaExceeded) return null;

  return (
    <div className="bg-amber-500 text-stone-950 px-4 py-2.5 text-xs md:text-sm font-medium text-center sticky top-0 z-50 shadow-md flex items-center justify-center gap-2">
      <span>
        Google Maps Platform quota reached. If you are the app owner, visit{' '}
        <a
          href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-bold text-stone-950 hover:text-stone-800"
        >
          maps developer site
        </a>{' '}
        for instructions to update your account.
      </span>
      <button
        onClick={() => setQuotaExceeded(false)}
        className="ml-3 px-2 py-0.5 rounded bg-amber-600/30 hover:bg-amber-600/50 text-stone-950 text-xs font-semibold"
      >
        Dismiss
      </button>
    </div>
  );
}
