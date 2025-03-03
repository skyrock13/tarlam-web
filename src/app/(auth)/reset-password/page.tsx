// src/app/(auth)/reset-password/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Lock, EyeIcon, EyeOffIcon, CheckCircle, Info, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Form, 2: Success
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { supabase } = useSupabase();
  const { toast } = useToast();

  // Check if the URL contains a hash for password recovery
  useEffect(() => {
    const checkRecoveryToken = async () => {
      const hash = window.location.hash;
      if (!hash) {
        // No hash present, might be a direct visit without coming from an email link
        toast({
          title: 'Erişim Hatası',
          description: 'Geçersiz şifre sıfırlama bağlantısı. Lütfen e-postanızdaki bağlantıyı kullanın.',
          variant: 'destructive',
        });
        // Optionally redirect to forgot-password page
        // router.push('/forgot-password');
      }
    };

    checkRecoveryToken();
  }, [router, toast]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Basic validation
      if (!password || password.length < 8) {
        setError("Şifre en az 8 karakter olmalıdır");
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError("Şifreler eşleşmiyor");
        setLoading(false);
        return;
      }

      // Password strength validation
      const hasLowercase = /[a-z]/.test(password);
      const hasUppercase = /[A-Z]/.test(password);
      const hasNumber = /\d/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

      if (!(hasLowercase && (hasUppercase || hasNumber || hasSpecialChar))) {
        setError("Şifre en az bir küçük harf ve bir büyük harf, sayı veya özel karakter içermelidir");
        setLoading(false);
        return;
      }

      // Update user's password via Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        setError(updateError.message);
        toast({
          title: 'Hata',
          description: updateError.message,
          variant: 'destructive',
        });
      } else {
        setStep(2); // Show success message
        toast({
          title: 'Başarılı',
          description: 'Şifreniz başarıyla güncellendi.',
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

  const togglePasswordVisibility = (field: 'password' | 'confirmPassword') => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  // Calculate password strength
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, text: '', color: '' };
    
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);    
    const isLongEnough = password.length >= 8;
    
    const checks = [hasLowercase, hasUppercase, hasNumber, hasSpecialChar, isLongEnough];
    const passedChecks = checks.filter(Boolean).length;
    
    if (passedChecks <= 1) return { strength: 20, text: 'Çok Zayıf', color: 'bg-red-500' };
    if (passedChecks === 2) return { strength: 40, text: 'Zayıf', color: 'bg-orange-500' };
    if (passedChecks === 3) return { strength: 60, text: 'Orta', color: 'bg-yellow-500' };
    if (passedChecks === 4) return { strength: 80, text: 'Güçlü', color: 'bg-green-400' };
    return { strength: 100, text: 'Çok Güçlü', color: 'bg-green-600' };
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <Card className="bg-white max-w-md w-full shadow-lg">
        <CardHeader className="space-y-2 pb-2">
          <CardTitle className="text-2xl font-bold text-center">
            Şifre Sıfırlama
          </CardTitle>
          <CardDescription className="text-center">
            {step === 1 
              ? 'Lütfen yeni şifrenizi belirleyin' 
              : 'Şifreniz başarıyla güncellendi'}
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
                  <label htmlFor="password" className="text-sm font-medium">
                    Yeni Şifre
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-10 pl-10 pr-10"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      onClick={() => togglePasswordVisibility('password')}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOffIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {password && (
                    <div className="space-y-1 mt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span>Şifre gücü:</span>
                        <span className={`font-medium ${passwordStrength.text === 'Çok Zayıf' || passwordStrength.text === 'Zayıf' ? 'text-red-500' : passwordStrength.text === 'Orta' ? 'text-yellow-500' : 'text-green-600'}`}>
                          {passwordStrength.text}
                        </span>
                      </div>
                      <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${passwordStrength.color}`} 
                          style={{ width: `${passwordStrength.strength}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label htmlFor="confirmPassword" className="text-sm font-medium">
                    Şifre Tekrarı
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-10 pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      onClick={() => togglePasswordVisibility('confirmPassword')}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOffIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 mt-2" 
                  disabled={loading || !password || !confirmPassword}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      İşleniyor...
                    </>
                  ) : (
                    'Şifremi Güncelle'
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
                <h3 className="text-lg font-medium">Şifre Güncellendi</h3>
                <p className="text-sm text-muted-foreground">
                  Şifreniz başarıyla güncellenmiştir. Yeni şifrenizle giriş yapabilirsiniz.
                </p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2 pb-6">
          {step === 2 && (
            <Button 
              onClick={() => router.push('/login')} 
              className="w-full"
            >
              Giriş Yap
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}