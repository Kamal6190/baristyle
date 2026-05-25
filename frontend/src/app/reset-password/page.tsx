"use client";
import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!token) {
      setError('Invalid reset link. Please request a new one.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/reset-password`, {
        token,
        newPassword,
      });
      setMessage(response.data.message);
      setDone(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-serif font-bold text-stone-900">
              Bari<span className="text-emerald-600">Style</span>
            </h1>
          </Link>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-8 shadow-sm">
          {!done ? (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-serif font-bold text-stone-900 mb-2">Set New Password</h2>
                <p className="text-stone-500 text-sm">Enter your new password below.</p>
              </div>

              {error && (
                <div className="bg-rose-50 text-rose-600 text-sm p-4 rounded-lg mb-6 border border-rose-100">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full border-b border-stone-300 bg-transparent py-2 px-1 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition"
                    placeholder="Minimum 8 characters"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full border-b border-stone-300 bg-transparent py-2 px-1 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition"
                    placeholder="Re-enter password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-stone-900 text-white py-4 rounded-sm font-semibold text-sm hover:bg-stone-800 transition shadow-sm disabled:opacity-70 mt-4"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                ✓
              </div>
              <h2 className="text-xl font-bold text-stone-900 mb-2">Password Updated!</h2>
              <p className="text-stone-500 text-sm mb-1">{message}</p>
              <p className="text-stone-400 text-xs">Redirecting to login...</p>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-stone-500 mt-6">
          <Link href="/login" className="text-stone-900 font-bold hover:underline">← Back to Login</Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-stone-900"></div></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
