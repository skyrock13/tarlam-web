// src/app/(auth)/forgot-password/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabase } from '@/providers/supabase-provider';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Mail, ArrowLeft, CheckCircle, Loader2, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { supabase } = useSupabase();
  const { toast } = useToast();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Basic validation
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        setError("Please enter a valid email address");
        setLoading(false);
        return;
      }

      // Send password reset email with Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message);
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setStep(2); // Show success message
        toast({
          title: 'Email Sent',
          description: 'Password reset link has been sent to your email address.',
        });
      }
    } catch (error: any) {
      setError(error.message);
      toast({
        title: 'Unexpected Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <Card className="bg-white max-w-md w-full shadow-lg">
        <CardHeader className="space-y-2 pb-2">
          <div className="flex items-center justify-start">
            <Link 
              href="/login" 
              className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Return to Login
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Forgot Password
          </CardTitle>
          <CardDescription className="text-center">
            {step === 1 
              ? 'Enter your email address to receive a password reset link' 
              : 'We have sent a password reset link to your email address'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <>
              {error && (
                <Alert className="mb-4 bg-destructive/15 border-destructive/30">
                  <Info className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-sm text-destructive">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="ahmet.yilmaz@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10 pl-10"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 mt-2" 
                  disabled={loading || !email}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Send Password Reset Link'
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="py-8 text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Email Sent</h3>
                <p className="text-sm text-muted-foreground">
                  We have sent a password reset link to <strong>{email}</strong>.
                  Please check your email and click the link to reset your password.
                </p>
                <Alert className="mt-4 bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-500" />
                  <AlertDescription className="text-sm text-blue-700">
                    If you don't receive the email within 5 minutes, please check your spam folder
                    or try again.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2 pb-6">
          {step === 1 ? (
            <div className="text-sm text-center">
              <Link href="/login" className="text-primary font-medium hover:underline">
                Return to login page
              </Link>
            </div>
          ) : (
            <Button 
              onClick={() => router.push('/login')} 
              className="w-full"
              variant="outline"
            >
              Return to Login
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}