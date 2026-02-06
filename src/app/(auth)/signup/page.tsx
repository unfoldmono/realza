"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signUp } from "@/lib/actions/auth";

function SignupForm() {
  const searchParams = useSearchParams();
  const defaultType = searchParams.get("type") || "seller";
  
  const [userType, setUserType] = useState<"seller" | "agent">(defaultType as "seller" | "agent");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [license, setLicense] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signUp({
      email,
      name,
      userType,
      licenseNumber: userType === "agent" ? license : undefined,
    });
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-[#fffbf7] flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <div className="text-6xl mb-6">📧</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
          <p className="text-gray-600 mb-8">
            We sent a magic link to <strong>{email}</strong>
          </p>
          <p className="text-gray-500 text-sm">
            Click the link to complete your account setup
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffbf7] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="text-2xl font-bold text-[#ff6b4a] block text-center mb-8">
          realza
        </Link>
        
        <div className="card">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Get started</h1>
          <p className="text-gray-600 mb-6">Create your free account</p>

          {/* User Type Toggle */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-8">
            <button
              type="button"
              onClick={() => setUserType("seller")}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                userType === "seller"
                  ? "bg-white text-[#ff6b4a] shadow-sm"
                  : "text-gray-600"
              }`}
            >
              🏠 I'm Selling
            </button>
            <button
              type="button"
              onClick={() => setUserType("agent")}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                userType === "agent"
                  ? "bg-white text-[#ff6b4a] shadow-sm"
                  : "text-gray-600"
              }`}
            >
              👔 I'm an Agent
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error.toLowerCase().includes('rate') 
                ? "Too many signup attempts. Please wait a few minutes before trying again."
                : error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Smith"
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input"
                required
              />
            </div>

            {userType === "agent" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Real Estate License #
                </label>
                <input
                  type="text"
                  value={license}
                  onChange={(e) => setLicense(e.target.value)}
                  placeholder="FL-123456"
                  className="input"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create Account →"}
            </button>
          </form>

          <p className="text-center text-gray-500 text-xs mt-6">
            By signing up, you agree to our Terms and Privacy Policy
          </p>

          <p className="text-center text-gray-600 text-sm mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-[#ff6b4a] font-medium">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Signup() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fffbf7]" />}>
      <SignupForm />
    </Suspense>
  );
}
