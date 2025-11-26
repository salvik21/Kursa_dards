'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { FirebaseError } from 'firebase/app';
import { sendResetEmail } from '@/lib/firebase/auth-client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Clear previous messages
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Firebase returns success even for non-existing emails (security reasons)
      await sendResetEmail(trimmedEmail);

      setSuccessMessage(
        'If this email is registered, a reset link has been sent.'
      );
    } catch (err) {
      console.error(err);

      if (err instanceof FirebaseError) {
        // Map common Firebase errors to human-readable messages
        switch (err.code) {
          case 'auth/invalid-email':
            setErrorMessage('Invalid email.');
            break;
          case 'auth/missing-email':
            setErrorMessage('Please enter your email.');
            break;
          default:
            setErrorMessage('Failed to send the email. Please try again.');
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
      <h1 className="mb-4 text-2xl font-semibold">Forgot password</h1>
      <p className="mb-6 text-sm text-gray-600">
        Enter your registered email and we&apos;ll send you a password reset link.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        {errorMessage && (
          <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        <button
          type="submit"
          className="flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        <Link href="/auth/sign-in" className="text-blue-600 hover:underline">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
