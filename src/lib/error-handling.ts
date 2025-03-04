// src/lib/error-handling.ts
import { toast } from "@/components/ui/use-toast"

/**
 * Uygulama genelinde tutarlı bir hata işleme yöntemi
 * 
 * @param error - Yakalanan hata
 * @param showToast - Toast bildirimi gösterilsin mi? (varsayılan: true)
 * @param options - Ek yapılandırma seçenekleri
 * @returns İşlenmiş hata mesajı
 */
export const handleError = (
  error: unknown, 
  showToast = true,
  options?: {
    toastTitle?: string;
    fallbackMessage?: string;
    logToConsole?: boolean;
  }
) => {
  const {
    toastTitle = "Hata",
    fallbackMessage = "Bir hata oluştu",
    logToConsole = process.env.NODE_ENV !== "production"
  } = options || {};

  // Hata mesajını çıkar
  let errorMessage = fallbackMessage;

  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    errorMessage = error.message;
  } else if (
    error &&
    typeof error === 'object' &&
    'error' in error &&
    typeof error.error === 'string'
  ) {
    errorMessage = error.error;
  }

  // Console'a log
  if (logToConsole) {
    console.error("Handled error:", error);
  }

  // Toast bildirim
  if (showToast) {
    toast({
      variant: "destructive",
      title: toastTitle,
      description: errorMessage,
    });
  }

  return errorMessage;
};

/**
 * Bir async işlevi try-catch ile sarmalayıp hata yakalama
 * Bu helper ile hataları tutarlı şekilde yakalayabiliriz
 * 
 * @example
 * const fetchData = async () => {
 *   const { data, error } = await tryCatch(async () => {
 *     const response = await api.get('/endpoint');
 *     return response.data;
 *   });
 * 
 *   if (error) {
 *     // İşlem hatalı
 *     return;
 *   }
 * 
 *   // İşlem başarılı, data kullanılabilir
 * }
 */
export const tryCatch = async <T>(
  fn: () => Promise<T>,
  options?: {
    errorMessage?: string;
    showToast?: boolean;
    toastTitle?: string;
    logToConsole?: boolean;
  }
): Promise<{ data: T | null; error: string | null }> => {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (error) {
    const errorMessage = handleError(error, options?.showToast ?? true, {
      toastTitle: options?.toastTitle,
      fallbackMessage: options?.errorMessage,
      logToConsole: options?.logToConsole,
    });
    
    return { data: null, error: errorMessage };
  }
};

// ----------------
// KULLANIM ÖRNEKLERİ
// ----------------

// ÖRNEK 1: API çağrılarında:
/*
import { tryCatch } from '@/lib/error-handling';

const fetchUserData = async (userId: string) => {
  const { data, error } = await tryCatch(
    async () => {
      const response = await supabase.from('users').select('*').eq('id', userId).single();
      
      if (response.error) {
        throw response.error; // Supabase hatasını yakalar
      }
      
      return response.data;
    },
    { 
      errorMessage: "Kullanıcı bilgileri yüklenemedi",
      toastTitle: "Veri Yükleme Hatası"
    }
  );

  if (error) {
    // İşlemi burada durdurabilir veya fallback davranışı uygulayabilirsiniz
    return null;
  }

  return data;
};
*/

// ÖRNEK 2: Form işlemlerinde:
/*
const handleSubmit = async (formData: FormData) => {
  setIsSubmitting(true);
  
  const { data, error } = await tryCatch(
    async () => {
      // Form doğrulama
      if (!formData.name) {
        throw new Error("İsim alanı zorunludur");
      }
      
      // API isteği
      const response = await supabase.from('items').insert(formData);
      
      if (response.error) {
        throw response.error;
      }
      
      return response.data;
    },
    {
      toastTitle: "Form Gönderme Hatası"
    }
  );
  
  setIsSubmitting(false);
  
  if (error) {
    setFormError(error); // Form hatasını state'e kaydet
    return;
  }
  
  // Başarılı ise toast göster ve form state'i sıfırla
  toast({
    title: "Başarılı!",
    description: "Formunuz başarıyla gönderildi.",
  });
  
  resetForm();
};
*/

// ÖRNEK 3: useEffect içinde:
/*
useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    
    const { data, error } = await tryCatch(
      async () => {
        const response = await supabase.from('devices').select('*');
        
        if (response.error) {
          throw response.error;
        }
        
        return response.data;
      },
      {
        showToast: false // Toast gösterme, bunu bileşen içinde ele alacağız
      }
    );
    
    setLoading(false);
    
    if (error) {
      setError(error);
      return;
    }
    
    setData(data);
  };
  
  fetchData();
}, []);
*/