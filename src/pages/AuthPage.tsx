import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui';
import { cn } from '@/utils/helpers';

type AuthMode = 'signin' | 'signup' | 'reset';

export function AuthPage() {
  const { signUp, signIn, signInWithGoogle, resetPassword } = useAuth();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>(
    (searchParams.get('mode') as AuthMode) || 'signin'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email address';
    }

    if (mode !== 'reset') {
      if (!password) {
        newErrors.password = 'Password is required';
      } else if (password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }

      if (mode === 'signup') {
        if (!displayName.trim()) {
          newErrors.displayName = 'Display name is required';
        }
        if (password !== confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
        addToast({ type: 'success', title: 'Welcome back!', message: 'Successfully signed in' });
      } else if (mode === 'signup') {
        await signUp(email, password, displayName);
        addToast({ type: 'success', title: 'Account created!', message: 'Welcome to PanoTour' });
      } else if (mode === 'reset') {
        await resetPassword(email);
        addToast({ type: 'success', title: 'Check your email', message: 'Password reset link sent' });
        setMode('signin');
      }
      navigate('/dashboard');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      let friendlyMessage = message;
      
      if (message.includes('auth/invalid-credential') || message.includes('auth/wrong-password')) {
        friendlyMessage = 'Invalid email or password';
        setErrors({ password: friendlyMessage });
      } else if (message.includes('auth/email-already-in-use')) {
        friendlyMessage = 'Email already in use';
        setErrors({ email: friendlyMessage });
      } else if (message.includes('auth/weak-password')) {
        friendlyMessage = 'Password is too weak';
        setErrors({ password: friendlyMessage });
      } else if (message.includes('auth/user-not-found')) {
        friendlyMessage = 'No account found with this email';
        setErrors({ email: friendlyMessage });
      } else {
        addToast({ type: 'error', title: 'Error', message: friendlyMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      addToast({ type: 'success', title: 'Welcome!', message: 'Successfully signed in with Google' });
      navigate('/dashboard');
    } catch (error) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to sign in with Google' });
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrors({});
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
  };

  const isSignIn = mode === 'signin';
  const isSignUp = mode === 'signup';
  const isReset = mode === 'reset';

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-white font-semibold text-2xl">
            <svg className="h-10 w-10 text-primary-500" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" />
              <path d="M16 6v10l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="16" cy="16" r="3" fill="currentColor" />
            </svg>
            <span>PanoTour</span>
          </Link>
        </div>

        {/* Auth Card */}
        <div className="glass-panel p-8 rounded-2xl animate-scale-in">
          {/* Tabs */}
          <div className="flex gap-1 mb-8 bg-dark-800 rounded-xl p-1">
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className={cn(
                'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all',
                isSignIn ? 'bg-dark-700 text-white shadow' : 'text-dark-400 hover:text-white'
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={cn(
                'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all',
                isSignUp ? 'bg-dark-700 text-white shadow' : 'text-dark-400 hover:text-white'
              )}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <Input
                label="Display Name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                error={errors.displayName}
                placeholder="John Doe"
                leftIcon={<User className="h-5 w-5" />}
                autoComplete="name"
                required
              />
            )}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              placeholder="you@example.com"
              leftIcon={<Mail className="h-5 w-5" />}
              autoComplete="email"
              required
            />

            {(isSignIn || isSignUp) && (
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                placeholder="••••••••"
                leftIcon={<Lock className="h-5 w-5" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-dark-500 hover:text-white"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                }
                autoComplete={isSignIn ? 'current-password' : 'new-password'}
                required
              />
            )}

            {isSignUp && (
              <Input
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirmPassword}
                placeholder="••••••••"
                leftIcon={<Lock className="h-5 w-5" />}
                autoComplete="new-password"
                required
              />
            )}

            {errors.general && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{errors.general}</span>
              </div>
            )}

            <Button type="submit" fullWidth loading={loading} className="py-3">
              {isSignIn ? 'Sign In' : isSignUp ? 'Create Account' : 'Send Reset Link'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dark-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-dark-900 text-dark-500">Or continue with</span>
            </div>
          </div>

          {/* Google Sign In */}
          <Button
            variant="secondary"
            fullWidth
            onClick={handleGoogleSignIn}
            disabled={loading}
            leftIcon={
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            }
          >
            Continue with Google
          </Button>

          {/* Forgot password / Switch mode */}
          <div className="mt-6 text-center text-sm">
            {isSignIn && (
              <button
                type="button"
                onClick={() => switchMode('reset')}
                className="text-primary-400 hover:text-primary-300 underline"
              >
                Forgot password?
              </button>
            )}
            {isReset && (
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="text-primary-400 hover:text-primary-300 underline"
              >
                Back to sign in
              </button>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-dark-400">
            {isSignIn ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => switchMode(isSignIn ? 'signup' : 'signin')}
              className="text-primary-400 hover:text-primary-300 font-medium underline"
            >
              {isSignIn ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        {/* Info */}
        <div className="mt-6 text-center text-sm text-dark-500">
          <p>By continuing, you agree to our <Link to="/terms" className="underline hover:text-white">Terms of Service</Link> and <Link to="/privacy" className="underline hover:text-white">Privacy Policy</Link></p>
        </div>
      </div>
    </div>
  );
}