import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { handleApiError } from '@/utils/errorHandling';

/**
 * Email verification page for confirming user signup
 */
export function Verify() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { confirmSignUp } = useAuth();

  // Get email from navigation state or redirect to signup if missing
  const email = location.state?.email;
  
  if (!email) {
    navigate('/signup');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!code.trim()) {
      setError('Doğrulama kodu gerekli');
      return;
    }

    setIsLoading(true);
    try {
      await confirmSignUp(email, code);
      navigate('/login', { 
        state: { 
          message: 'Your account has been successfully verified. You can now sign in.' 
        } 
      });
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Verification failed');
      }
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-neutral-900">
            Hesabınızı Doğrulayın
          </h2>
          <p className="mt-2 text-center text-sm text-neutral-600">
            {email} adresine gönderilen doğrulama kodunu girin
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Doğrulama Kodu"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6 haneli kod"
              maxLength={6}
              error={error}
              disabled={isLoading}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? <LoadingSpinner size="sm" /> : 'Doğrula'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              Sign up with different email
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}