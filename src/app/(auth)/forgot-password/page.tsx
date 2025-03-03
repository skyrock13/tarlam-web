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
        setError("Lütfen geçerli bir e-posta adresi girin");
        return;
      }

      // Send password reset email with Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message);
        toast({
          title: 'Hata',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setStep(2); // Show success message
        toast({
          title: 'E-posta Gönderildi',
          description: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.',
        });
      }
    } catch (error: any) {
      setError(error.message);
      toast({
        title: 'Beklenmeyen Hata',
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
              Giriş Sayfasına Dön
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Şifremi Unuttum
          </CardTitle>
          <CardDescription className="text-center">
            {step === 1 
              ? 'E-posta adresinizi girin ve şifre sıfırlama bağlantısı alın' 
              : 'E-posta adresinize şifre sıfırlama bağlantısı gönderdik'}
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
                    E-posta Adresi
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
                      İşleniyor...
                    </>
                  ) : (
                    'Şifre Sıfırlama Bağlantısı Gönder'
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
                <h3 className="text-lg font-medium">E-posta Gönderildi</h3>
                <p className="text-sm text-muted-foreground">
                  <strong>{email}</strong> adresine şifre sıfırlama bağlantısı gönderdik. 
                  Lütfen e-postanızı kontrol edin ve bağlantıya tıklayarak şifrenizi sıfırlayın.
                </p>
                <Alert className="mt-4 bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-500" />
                  <AlertDescription className="text-sm text-blue-700">
                    E-posta 5 dakika içinde gelmezse, spam klasörünü kontrol edin 
                    veya tekrar deneyin.
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
                Giriş sayfasına dön
              </Link>
            </div>
          ) : (
            <Button 
              onClick={() => router.push('/login')} 
              className="w-full"
              variant="outline"
            >
              Giriş Sayfasına Dön
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}