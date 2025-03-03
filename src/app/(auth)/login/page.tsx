'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Database } from '@/lib/types/supabase';
import { Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const supabase = createClientComponentClient<Database>();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) throw signInError;

            router.push('/devices');
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="flex min-h-screen bg-white">
            {/* Kayıt kısmı - sol tarafta 1/3 genişlikte */}
            <div className="hidden md:block w-full md:w-1/3 bg-emerald-500 relative">
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-white">
                    <div className="max-w-md text-center">
                        <h2 className="text-3xl font-bold mb-4">Yeni misiniz?</h2>
                        <p className="text-white/90 mb-8">
                            Hemen kayıt olun ve Tarlam'ın sunduğu tüm fırsatlardan yararlanmaya başlayın!
                        </p>
                        <Link href="/register">
                            <Button className="bg-white text-emerald-600 hover:bg-gray-50 rounded-md px-6 py-3 font-medium">
                                Hemen Kaydol
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
            
            {/* Login form - sağ tarafta 2/3 genişlikte */}
            <div className="w-full md:w-2/3 flex flex-col items-center justify-center p-8">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <div className="flex justify-center mb-10">
                        <Image
                            src="/tarlam_logo.webp"
                            alt="Tarlam Logo"
                            width={128}
                            height={54}
                            priority
                            className="h-auto w-40"
                        />
                    </div>
                    
                    {/* Login Header */}
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Hoş geldiniz!</h1>
                    <p className="text-gray-600 mb-8">Hesabınıza erişmek için giriş yapın</p>
                    
                    {/* Error Alert */}
                    {error && (
                        <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 flex items-center border border-red-100">
                            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                    
                    {/* Login Form */}
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <Label htmlFor="email" className="text-gray-700 mb-2 block font-medium">E-posta</Label>
                            <Input
                                type="email"
                                id="email"
                                placeholder="ornek@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                required
                                disabled={loading}
                            />
                        </div>
                        
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <Label htmlFor="password" className="text-gray-700 font-medium">Şifre</Label>
                                <Link href="/forgot-password" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                                    Şifremi unuttum
                                </Link>
                            </div>
                            <div className="relative">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    required
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    onClick={togglePasswordVisibility}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                        
                        <Button 
                            type="submit" 
                            className="w-full mt-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md transition-colors text-base font-medium" 
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Giriş yapılıyor...
                                </div>
                            ) : (
                                <div className="flex items-center justify-center">
                                    Giriş Yap
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </div>
                            )}
                        </Button>
                    </form>
                    
                    {/* Mobile Sign Up Link */}
                    <div className="mt-8 text-center md:hidden">
                        <p className="text-gray-600 mb-3">Henüz bir hesabınız yok mu?</p>
                        <Link href="/register" className="text-emerald-600 font-medium hover:underline">
                            Hemen Kaydol
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}