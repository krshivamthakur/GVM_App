'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { loginUser } from '@/actions/auth-actions'
import { 
  GraduationCap, 
  ArrowRight, 
  Lock, 
  Mail, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ShieldCheck,
  Info
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [showHint, setShowHint] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    try {
      const res = await loginUser(email, password)
      if (!res.success || !res.user) {
        setErrorMsg(res.error || 'Authentication failed. Please check your credentials.')
        return
      }

      // Automatic redirection based on authentic database role
      const userRole = res.user.role
      if (userRole === 'admin') {
        window.location.href = '/admin'
      } else if (userRole === 'teacher') {
        window.location.href = '/teacher'
      } else {
        window.location.href = '/student'
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred during login.')
    } finally {
      setLoading(false)
    }
  }

  const fillQuickCredential = (roleEmail: string) => {
    setEmail(roleEmail)
    setPassword('password123')
    setErrorMsg('')
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
      {/* Top corner theme toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Brand & Heading */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white shadow-lg shadow-indigo-500/20">
            <Image src="/gvm.png" alt="GVM Logo" width={80} height={80} className="h-full w-full object-contain" />
          </div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            GVM
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Enter your account ID / Email and password to access your role portal.
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-sm space-y-5">
          {/* Error Alert */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="leading-snug">{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* User ID / Email */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                User ID / Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{loading ? 'Verifying Credentials...' : 'Sign In with Password'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Credential Helper Accordion */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setShowHint(!showHint)}
              className="w-full flex items-center justify-between text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 font-medium py-1 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-500" />
                <span>View Registered Demo Accounts</span>
              </span>
              <span>{showHint ? '▲ Hide' : '▼ View'}</span>
            </button>

            {showHint && (
              <div className="mt-2.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2 text-[11px] animate-in fade-in">
                <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">
                  Click to auto-fill ID & Password:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => fillQuickCredential('admin@example.com')}
                    className="p-1.5 text-left rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-rose-300 hover:bg-rose-50/40 dark:hover:bg-rose-950/30 transition-all"
                  >
                    <div className="font-bold text-rose-600 dark:text-rose-400">Admin</div>
                    <div className="text-[10px] text-zinc-500 truncate">admin@example.com</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillQuickCredential('teacher@example.com')}
                    className="p-1.5 text-left rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-purple-300 hover:bg-purple-50/40 dark:hover:bg-purple-950/30 transition-all"
                  >
                    <div className="font-bold text-purple-600 dark:text-purple-400">Teacher</div>
                    <div className="text-[10px] text-zinc-500 truncate">teacher@example.com</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillQuickCredential('student@example.com')}
                    className="p-1.5 text-left rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-300 hover:bg-blue-50/40 dark:hover:bg-blue-950/30 transition-all"
                  >
                    <div className="font-bold text-blue-600 dark:text-blue-400">Student</div>
                    <div className="text-[10px] text-zinc-500 truncate">student@example.com</div>
                  </button>
                </div>
                <p className="text-[10px] text-zinc-400 italic">
                  Password: minimum 4 characters (e.g. <code>password123</code>).
                </p>
              </div>
            )}
          </div>

          {/* Register Link */}
          <div className="text-center text-xs text-zinc-500 pt-1">
            Don&apos;t have an account yet?{' '}
            <Link href="/register" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
