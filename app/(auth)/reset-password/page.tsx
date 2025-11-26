'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FirebaseError } from 'firebase/app';
import { confirmPasswordResetAction } from '@/lib/firebase/auth-client';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const oobCode = searchParams.get('oobCode');

  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isCodeMissing = !oobCode;

  useEffect(() => {
    // If the code is missing (user opened page manually)
    if (isCodeMissing) {
      setErrorMessage(
        'Invalid or expired password reset link. Please request a new one.'
      );
    }
  }, [isCodeMissing]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (isCodeMissing || !oobCode) {
      setErrorMessage('The password reset code is missing or invalid.');
      return;
    }

    // Clear previous messages
    setErrorMessage(null);
    setSuccessMessage(null);

    // Basic password validation
    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Confirm password reset with Firebase
      await confirmPasswordResetAction(oobCode, newPassword);

      setSuccessMessage('Password updated. Redirecting to sign-in…');

      // Redirect to login page
      router.push('/auth/sign-in');
    } catch (err) {
      console.error(err);

      if (err instanceof FirebaseError) {
        // Map Firebase errors
        switch (err.code) {
          case 'auth/expired-action-code':
          case 'auth/invalid-action-code':
            setErrorMessage(
              'This reset link is invalid or has expired. Request a new link.'
            );
            break;
          case 'auth/weak-password':
            setErrorMessage('Password is too weak. Please choose a stronger one.');
            break;
          default:
            setErrorMessage('Failed to reset password. Please try again.');
        }
      } else {
        setErrorMessage('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="mb-4 text-2xl font-semibold">Reset password</h1>
      <p className="mb-6 text-sm text-gray-600">
        Enter your new password.
      </p>

      {isCodeMissing && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="password">
            New password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isSubmitting || isCodeMissing}
          />
        </div>

        {/* Error message */}
        {errorMessage && !isCodeMissing && (
          <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {/* Success message */}
        {successMessage && (
          <div className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        <button
          type="submit"
          className="flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={isSubmitting || isCodeMissing}
        >
          {isSubmitting ? 'Saving…' : 'Reset password'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        <Link href="/auth/forgot-password" className="text-blue-600 hover:underline">
          Request a new reset link
        </Link>
      </div>
    </div>
  );
}
