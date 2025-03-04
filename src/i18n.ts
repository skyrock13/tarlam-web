// src/i18n.ts
// Türkçe dil paketi
const tr = {
    auth: {
      login: {
        title: 'Hoş geldiniz!',
        subtitle: 'Hesabınıza erişmek için giriş yapın',
        submit: 'Giriş Yap',
        forgotPassword: 'Şifremi unuttum',
        email: 'E-posta',
        password: 'Şifre',
        errors: {
          invalidCredentials: 'Geçersiz e-posta veya şifre'
        }
      },
      register: {
        title: 'Hesap Oluştur',
        subtitle: 'Başlamak için bilgilerinizi girin',
        submit: 'Kaydol',
        alreadyHaveAccount: 'Zaten hesabınız var mı?',
        firstName: 'Ad',
        lastName: 'Soyad',
        email: 'E-posta',
        password: 'Şifre',
        confirmPassword: 'Şifre Tekrarı',
        errors: {
          passwordMismatch: 'Şifreler eşleşmiyor',
          weakPassword: 'Şifre çok zayıf'
        }
      },
      forgotPassword: {
        title: 'Şifremi Unuttum',
        subtitle: 'E-posta adresinizi girin ve şifre sıfırlama bağlantısı alın',
        submit: 'Şifre Sıfırlama Bağlantısı Gönder',
        email: 'E-posta Adresi',
        backToLogin: 'Giriş sayfasına dön',
        sent: {
          title: 'E-posta Gönderildi',
          description: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.'
        }
      },
      resetPassword: {
        title: 'Şifre Sıfırlama',
        subtitle: 'Lütfen yeni şifrenizi belirleyin',
        submit: 'Şifremi Güncelle',
        newPassword: 'Yeni Şifre',
        confirmPassword: 'Şifre Tekrarı'
      }
    },
    common: {
      loading: 'Yükleniyor...',
      error: 'Hata',
      success: 'Başarılı',
      cancel: 'İptal',
      save: 'Kaydet',
      delete: 'Sil',
      edit: 'Düzenle',
      back: 'Geri',
      next: 'İleri',
      yes: 'Evet',
      no: 'Hayır',
      actions: 'İşlemler',
      confirm: 'Onay',
      confirmDelete: 'Bu öğeyi silmek istediğinizden emin misiniz?'
    },
    devices: {
      title: 'Cihazlar',
      add: 'Cihaz Ekle',
      edit: 'Cihaz Düzenle',
      delete: 'Cihaz Sil',
      serial: 'Seri No',
      model: 'Model',
      status: {
        online: 'Çevrimiçi',
        offline: 'Çevrimdışı'
      },
      firmware: 'Firmware',
      lastConnection: 'Son Bağlantı',
      noDevices: 'Herhangi bir cihaz bulunamadı',
      operations: {
        restart: 'Yeniden Başlat',
        update: 'Güncelle'
      }
    },
    plants: {
      title: 'Bitkiler',
      add: 'Bitki Ekle',
      edit: 'Bitki Düzenle',
      delete: 'Bitki Sil',
      types: {
        all: 'Tüm Tipler',
        root: 'Kök',
        micro: 'Mikro Yeşillikler'
      },
      parameters: {
        ph: 'pH',
        ec: 'EC',
        temperature: 'Sıcaklık',
        light: 'Işık'
      }
    }
  };
  
  // İngilizce dil paketi
  const en = {
    auth: {
      login: {
        title: 'Welcome back!',
        subtitle: 'Sign in to access your account',
        submit: 'Sign in',
        forgotPassword: 'Forgot password',
        email: 'Email',
        password: 'Password',
        errors: {
          invalidCredentials: 'Invalid email or password'
        }
      },
      register: {
        title: 'Create an Account',
        subtitle: 'Enter your information to get started',
        submit: 'Sign up',
        alreadyHaveAccount: 'Already have an account?',
        firstName: 'First Name',
        lastName: 'Last Name',
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        errors: {
          passwordMismatch: 'Passwords do not match',
          weakPassword: 'Password is too weak'
        }
      },
      forgotPassword: {
        title: 'Forgot Password',
        subtitle: 'Enter your email address and get a password reset link',
        submit: 'Send Reset Link',
        email: 'Email Address',
        backToLogin: 'Back to login',
        sent: {
          title: 'Email Sent',
          description: 'A password reset link has been sent to your email address.'
        }
      },
      resetPassword: {
        title: 'Reset Password',
        subtitle: 'Please set your new password',
        submit: 'Update Password',
        newPassword: 'New Password',
        confirmPassword: 'Confirm Password'
      }
    },
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      back: 'Back',
      next: 'Next',
      yes: 'Yes',
      no: 'No',
      actions: 'Actions',
      confirm: 'Confirm',
      confirmDelete: 'Are you sure you want to delete this item?'
    },
    devices: {
      title: 'Devices',
      add: 'Add Device',
      edit: 'Edit Device',
      delete: 'Delete Device',
      serial: 'Serial Number',
      model: 'Model',
      status: {
        online: 'Online',
        offline: 'Offline'
      },
      firmware: 'Firmware',
      lastConnection: 'Last Connection',
      noDevices: 'No devices found',
      operations: {
        restart: 'Restart',
        update: 'Update'
      }
    },
    plants: {
      title: 'Plants',
      add: 'Add Plant',
      edit: 'Edit Plant',
      delete: 'Delete Plant',
      types: {
        all: 'All Types',
        root: 'Root',
        micro: 'Microgreens'
      },
      parameters: {
        ph: 'pH',
        ec: 'EC',
        temperature: 'Temperature',
        light: 'Light'
      }
    }
  };
  
  export const messages = {
    tr,
    en
  };