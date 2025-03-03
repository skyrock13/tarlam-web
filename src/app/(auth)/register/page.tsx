// src/app/(auth)/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { Mail, Lock, User, Shield, EyeIcon, EyeOffIcon, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!formData.firstName || !formData.lastName) {
      setError("Lütfen adınızı ve soyadınızı girin");
      return;
    }

    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      setError("Lütfen geçerli bir e-posta adresi girin");
      return;
    }

    if (!formData.password || formData.password.length < 8) {
      setError("Şifre en az 8 karakter olmalıdır");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Şifreler eşleşmiyor");
      return;
    }

    setLoading(true);

    try {
      // Store user data in local storage
      localStorage.setItem('registrationData', JSON.stringify({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName
      }));
      
      // Add a small delay to show the loading state
      setTimeout(() => {
        router.push('/register/device'); // Redirect to device registration
      }, 500);
    } catch (error: any) {
      setError(error.message);
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
    
    const hasLowercase = /[a-z]/.test(formData.password);
    const hasUppercase = /[A-Z]/.test(formData.password);
    const hasNumber = /\d/.test(formData.password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);    
    const isLongEnough = password.length >= 8;
    
    const checks = [hasLowercase, hasUppercase, hasNumber, hasSpecialChar, isLongEnough];
    const passedChecks = checks.filter(Boolean).length;
    
    if (passedChecks <= 1) return { strength: 20, text: 'Çok Zayıf', color: 'bg-red-500' };
    if (passedChecks === 2) return { strength: 40, text: 'Zayıf', color: 'bg-orange-500' };
    if (passedChecks === 3) return { strength: 60, text: 'Orta', color: 'bg-yellow-500' };
    if (passedChecks === 4) return { strength: 80, text: 'Güçlü', color: 'bg-green-400' };
    if (!(hasLowercase && (hasUppercase || hasNumber || hasSpecialChar))) {
      setError("Şifre en az bir küçük harf ve bir büyük harf, sayı veya özel karakter içermelidir");
      return;
    }    
    
    return { strength: 100, text: 'Çok Güçlü', color: 'bg-green-600' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <Card className="bg-white max-w-md w-full shadow-lg">
        <CardHeader className="space-y-2 pb-2">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-8 rounded-full bg-primary"></div>
              <div className="h-2 w-2 rounded-full bg-gray-200"></div>
              <div className="h-2 w-2 rounded-full bg-gray-200"></div>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Hesap Oluştur
          </CardTitle>
          <CardDescription className="text-center">
            Başlamak için bilgilerinizi girin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleNext} className="space-y-4">
            {error && (
              <Alert className="bg-destructive/15 border-destructive/30">
                <Info className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-sm text-destructive">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="firstName" className="text-sm font-medium">
                    Ad
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="Ahmet"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="h-10 pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label htmlFor="lastName" className="text-sm font-medium">
                    Soyad
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Yılmaz"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="h-10 pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="email" className="text-sm font-medium">
                  E-posta Adresi
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="ahmet.yilmaz@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="h-10 pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="password" className="text-sm font-medium">
                  Şifre
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
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
                {formData.password && (
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
                  <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
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
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 mt-2" 
              disabled={loading || !formData.email || !formData.password || !formData.confirmPassword || !formData.firstName || !formData.lastName}
            >
              {loading ? 'İşleniyor...' : 'Cihaz Kaydına Devam Et'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 pb-6">
          <p className="text-xs text-center text-muted-foreground px-6">
            Hesap oluşturarak, Kullanım Koşullarını ve Gizlilik Politikasını kabul etmiş olursunuz.
          </p>
          <div className="text-sm text-center">
            Zaten hesabınız var mı?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Giriş Yap
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}