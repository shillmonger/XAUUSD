"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      const email = searchParams.get('email');

      if (!token || !email) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify?token=${token}&email=${encodeURIComponent(email)}`);
        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message);
          toast.success(data.message);
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/auth-page/login');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed');
          toast.error(data.error || 'Verification failed');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred during verification');
        toast.error('An error occurred during verification');
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md bg-background rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-8">
        <div className="flex flex-col items-center text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-16 w-16 text-[#D4AF37] animate-spin mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Verifying Your Email
              </h1>
              <p className="text-muted-foreground">
                Please wait while we verify your email address...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Email Verified Successfully
              </h1>
              <p className="text-muted-foreground mb-4">
                {message}
              </p>
              <p className="text-sm text-muted-foreground">
                Redirecting to login page...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-16 w-16 text-red-500 mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Verification Failed
              </h1>
              <p className="text-muted-foreground mb-6">
                {message}
              </p>
              <button
                onClick={() => router.push('/auth-page/login')}
                className="px-6 py-3 bg-[#D4AF37] hover:bg-[#C9A22E] text-black font-semibold rounded-xl transition-colors"
              >
                Back to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md bg-background rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37] mx-auto" />
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}