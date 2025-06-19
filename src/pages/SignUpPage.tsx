import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

export const SignUpPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { signUpWithPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signUpWithPassword(email, password, fullName);
    
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      // Note: User will need to confirm email before they can sign in
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
    
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-base text-text flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="p-6 text-center">
            <div className="w-16 h-16 bg-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Check Your Email</h2>
            <p className="text-subtext1 mb-4">
              We've sent you a confirmation link. Please check your email and click the link to activate your account.
            </p>
            <p className="text-subtext0 text-sm">
              Redirecting to login page...
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base text-text flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-subtext1">Join Split and start managing expenses</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red/10 border border-red/20 text-red px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium mb-2">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-mantle border border-surface0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 bg-mantle border border-surface0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 bg-mantle border border-surface0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
                placeholder="Enter your password (min. 6 characters)"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-subtext1 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-blue hover:text-sapphire transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};