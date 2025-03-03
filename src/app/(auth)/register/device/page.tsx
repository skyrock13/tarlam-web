// src/app/(auth)/register/device/page.tsx
'use client';

import { useState } from 'react';
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
import { ComputerIcon, InfoIcon, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function DeviceRegistrationPage() {
  const [serialNumber, setSerialNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Enter serial, 2: Verification, 3: Success, 4: Error
  const [statusMessage, setStatusMessage] = useState({ title: '', message: '', type: '' });
  const router = useRouter();
  const { supabase } = useSupabase();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStep(2); // Move to verification step
    setStatusMessage({ title: '', message: '', type: '' });

    try {
      // 1. Check device status first
      const { data: deviceStatus, error: deviceStatusError } =
        await supabase.rpc('check_device_status', {
          p_serial: serialNumber,
        });

      if (deviceStatusError) {
        setStatusMessage({
          title: 'Sistem Hatası',
          message: 'Cihaz durumu kontrol edilirken bir hata oluştu: ' + deviceStatusError.message,
          type: 'error'
        });
        toast({
          title: 'Hata',
          description: deviceStatusError.message,
          variant: 'destructive',
        });
        setStep(4); // Error state
        return;
      }

      // Display different messages based on device status
      if (deviceStatus === 0) {
        setStatusMessage({
          title: 'Cihaz Bulunamadı',
          message: 'Girdiğiniz seri numarasına sahip bir cihaz bulunamadı. Lütfen seri numarasını kontrol edip tekrar deneyin.',
          type: 'error'
        });
        toast({
          title: 'Cihaz Bulunamadı',
          description: 'Girdiğiniz seri numarası sistemde kayıtlı değil.',
          variant: 'destructive',
        });
        setStep(4); // Error state
        return;
      } else if (deviceStatus === 1) {
        setStatusMessage({
          title: 'Cihaz Zaten Kayıtlı',
          message: 'Bu cihaz zaten başka bir kullanıcıya atanmış. Eğer bu sizin cihazınızsa, lütfen destek ekibiyle iletişime geçin.',
          type: 'error'
        });
        toast({
          title: 'Cihaz Zaten Kayıtlı',
          description: 'Bu cihaz zaten başka bir kullanıcıya atanmış.',
          variant: 'destructive',
        });
        setStep(4); // Error state
        return;
      } 
      
      // Device is available (status = 2)
      setStatusMessage({
        title: 'Cihaz Doğrulandı',
        message: 'Cihazınız doğrulandı. Hesabınız oluşturuluyor...',
        type: 'success'
      });
      
      // 2. Get user data from localStorage
      const registrationData = JSON.parse(
        localStorage.getItem('registrationData') || '{}'
      );

      // 3. Create temp record in Supabase auth WITHOUT email verification
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: registrationData.email,
        password: registrationData.password,
        options: {
          data: {
            registration_pending: true,
            device_serial: serialNumber,
            first_name: registrationData.firstName,
            last_name: registrationData.lastName
          },
          // Skip email verification for now
          emailRedirectTo: null 
        }
      });

      if (signUpError) {
        setStatusMessage({
          title: 'Kayıt Hatası',
          message: 'Hesabınız oluşturulurken bir hata oluştu: ' + signUpError.message,
          type: 'error'
        });
        toast({
          title: 'Kayıt Hatası',
          description: signUpError.message,
          variant: 'destructive',
        });
        setStep(4); // Error state
        return;
      }
      
      // Update status
      setStatusMessage({
        title: 'Hesap Oluşturuldu',
        message: 'Hesabınız oluşturuldu. Cihazınız kaydediliyor...',
        type: 'success'
      });
      
      // 4. Now complete the registration via RPC - log the result for debugging
      const completeResult = await supabase.rpc('complete_user_registration', {
        p_user_id: authData.user.id,
        device_serial: serialNumber,
        first_name: registrationData.firstName,
        last_name: registrationData.lastName
      });
      
      console.log("Complete registration response:", completeResult);
      
      if (completeResult.error) {
        setStatusMessage({
          title: 'Cihaz Kayıt Hatası',
          message: 'Cihazınız hesabınıza kaydedilirken bir hata oluştu: ' + completeResult.error.message,
          type: 'error'
        });
        toast({
          title: 'Cihaz Kayıt Hatası',
          description: completeResult.error.message,
          variant: 'destructive',
        });
        setStep(4); // Error state
        return;
      }
      
      // E-posta doğrulama adımı geçici olarak bypass edildi
      // NOT: SMTP ayarları tamamlandığında bu kısmı tekrar aktifleştirin
      
      /* Aşağıdaki kod şu anda devre dışı bırakıldı
      // 5. Now trigger email verification
      const { error: verifyError } = await supabase.auth.resendEmailConfirmation({
        email: registrationData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/callback`
        }
      });
      
      if (verifyError) {
        // Not critical, just show a warning toast
        toast({
          title: 'E-posta Doğrulama Uyarısı',
          description: 'E-posta doğrulama bağlantısı gönderilirken bir sorun oluştu. Giriş yaptıktan sonra tekrar deneyebilirsiniz.',
          variant: 'warning',
        });
      }
      */
      
      // E-posta doğrulama geçici olarak bypass edildiğine dair bilgi
      toast({
        title: 'Bilgi',
        description: 'E-posta doğrulama sistemi şu anda bakımda. Doğrudan giriş yapabilirsiniz.',
      });
      
      // Final success
      setStatusMessage({
        title: 'Kayıt Tamamlandı',
        message: 'Hesabınız ve cihazınız başarıyla kaydedildi! Şimdi giriş sayfasından hesabınıza giriş yapabilirsiniz.',
        type: 'success'
      });
      setStep(3); // Success state
      
      toast({
        title: 'Başarılı',
        description: 'Kayıt işlemi tamamlandı!',
      });
      
      // Redirect after a short delay for better UX
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: any) {
      setStatusMessage({
        title: 'Beklenmeyen Hata',
        message: 'İşlem sırasında beklenmeyen bir hata oluştu: ' + error.message,
        type: 'error'
      });
      toast({
        title: 'Hata',
        description: error.message,
        variant: 'destructive',
      });
      setStep(4); // Error state
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSerialNumber('');
    setStep(1);
    setStatusMessage({ title: '', message: '', type: '' });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <Card className="bg-white max-w-md w-full shadow-lg">
        <CardHeader className="space-y-2 pb-2">
          <div className="flex items-center justify-between">
            <Link 
              href="/register" 
              className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Geri
            </Link>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-gray-200"></div>
              <div className="h-2 w-8 rounded-full bg-primary"></div>
              <div className="h-2 w-2 rounded-full bg-gray-200"></div>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Cihaz Kaydı
          </CardTitle>
          <CardDescription className="text-center">
            Hesabınızı cihazınıza bağlayın
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <>
              <div className="flex justify-center mb-6">
                <div className="bg-primary/10 p-4 rounded-full">
                  <ComputerIcon className="h-8 w-8 text-primary" />
                </div>
              </div>
              <Alert className="mb-6 bg-blue-50 border-blue-200">
                <InfoIcon className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-sm text-blue-700">
                  Seri numarası cihazınızın arkasında veya ürün kutusunda bulunabilir.
                </AlertDescription>
              </Alert>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="serialNumber" className="text-sm font-medium">
                    Cihaz Seri Numarası
                  </label>
                  <Input
                    id="serialNumber"
                    placeholder="Seri numarasını girin (örn. DE-2025-123456)"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className="h-11"
                    required
                    pattern="[A-Za-z0-9-]+"
                    maxLength={20}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-11 mt-2" 
                  disabled={loading || !serialNumber}
                >
                  Cihazı Doğrula
                </Button>
              </form>
            </>
          ) : step === 2 ? (
            <div className="py-8 text-center space-y-4">
              <div className="flex justify-center">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              </div>
              <h3 className="text-lg font-medium">İşleminiz Gerçekleştiriliyor</h3>
              <p className="text-sm text-muted-foreground">
                {statusMessage.message || "Lütfen hesabınızı cihazınıza bağlarken bekleyin..."}
              </p>
            </div>
          ) : step === 3 ? (
            <div className="py-8 text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <h3 className="text-lg font-medium">{statusMessage.title}</h3>
              <p className="text-sm text-muted-foreground">
                {statusMessage.message}
              </p>
            </div>
          ) : (
            <div className="py-6 text-center space-y-4">
              <div className="flex justify-center">
                <AlertCircle className="h-16 w-16 text-red-500" />
              </div>
              <Alert variant="destructive">
                <AlertTitle>{statusMessage.title}</AlertTitle>
                <AlertDescription>
                  {statusMessage.message}
                </AlertDescription>
              </Alert>
              <Button 
                onClick={resetForm}
                className="mt-4"
                variant="outline"
              >
                Tekrar Dene
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pt-2 pb-6">
          {step === 1 && (
            <p className="text-xs text-center text-muted-foreground px-6">
              Cihazınızı kaydederek, Kullanım Koşullarını ve Gizlilik Politikasını kabul etmiş olursunuz.
            </p>
          )}
          {step === 3 && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/login')}
            >
              Giriş Sayfasına Git
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}