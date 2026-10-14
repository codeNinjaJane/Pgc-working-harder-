import React, { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';

interface SignInPageProps {
  onSuccessRedirect?: () => void;
}

export const SignInPage: React.FC<SignInPageProps> = () => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleGoogleSignIn = (mock = false) => {
    setLoading(mock ? 'mock' : 'real');
    const url = mock ? '/api/auth/google?mock=true' : '/api/auth/google';
    window.location.href = url;
  };

  return (
    <div className="w-full max-w-[640px] mx-auto py-8 px-4">
      <div className="bg-surface border border-border rounded-card p-4 shadow-card space-y-4">
        {/* Header */}
        <div className="text-center py-2 space-y-1.5">
          <div className="w-10 h-10 rounded-sm bg-primary-tint text-primary flex items-center justify-center mx-auto mb-2">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="text-[24px] font-semibold text-text tracking-tight">Sign In</h1>
          <p className="text-[14px] text-text-muted">
            Welcome to Dialtone. Sign in with your student account to continue.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          {/* Primary Action Button */}
          <button
            type="button"
            onClick={() => handleGoogleSignIn(false)}
            disabled={loading !== null}
            className="w-full min-h-[44px] px-4 rounded-sm bg-primary hover:bg-primary-hover text-on-primary font-semibold text-[14px] flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <span>{loading === 'real' ? 'Redirecting to Google...' : 'Continue with Google'}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          {/* DEV-ONLY: remove before launch */}
          {import.meta.env.DEV && (
            <>
              {/* Secondary Action: Outlined Button */}
              <button
                type="button"
                onClick={() => handleGoogleSignIn(true)}
                disabled={loading !== null}
                className="w-full min-h-[44px] px-4 rounded-sm bg-surface hover:bg-primary-tint border border-border text-text font-semibold text-[14px] flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <span>
                  {loading === 'mock' ? 'Signing in...' : 'Development Sign-In (Simulation)'}
                </span>
              </button>
              <p className="text-[12px] text-text-muted text-center">
                Development mode simulation allows testing without live Google credentials.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
