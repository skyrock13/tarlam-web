// src/components/devices/firmware-update-modal.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertCircle, DownloadCloud } from 'lucide-react';

interface FirmwareUpdateModalProps {
  open: boolean;
  onClose: () => void;
  progress: number;
  deviceId: string;
}

export default function FirmwareUpdateModal({ 
  open, 
  onClose, 
  progress, 
  deviceId 
}: FirmwareUpdateModalProps) {
  const [status, setStatus] = useState<'preparing' | 'downloading' | 'installing' | 'success' | 'error'>(
    progress === 0 ? 'preparing' : progress >= 100 ? 'success' : progress < 50 ? 'downloading' : 'installing'
  );
  
  // Progress değişikliğinde status güncelle
  useEffect(() => {
    if (progress === 0) {
      setStatus('preparing');
    } else if (progress < 50 && progress > 0) {
      setStatus('downloading');
    } else if (progress >= 50 && progress < 100) {
      setStatus('installing');
    } else if (progress >= 100) {
      setStatus('success');
    }
  }, [progress]);
  
  // Status mesajını döndür
  const getStatusMessage = () => {
    switch (status) {
      case 'preparing':
        return 'Güncelleme hazırlanıyor...';
      case 'downloading':
        return 'Firmware indiriliyor...';
      case 'installing':
        return 'Firmware yükleniyor...';
      case 'success':
        return 'Firmware başarıyla güncellendi!';
      case 'error':
        return 'Güncelleme sırasında bir hata oluştu.';
      default:
        return 'Firmware güncelleniyor...';
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      // Güncelleme sırasında kapatmayı önle
      if (!isOpen && progress > 0 && progress < 100 && status !== 'error') {
        return;
      }
      onClose();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Firmware Güncelleme</DialogTitle>
          <DialogDescription>
            Cihaz firmware'iniz güncelleniyor. Bu işlem birkaç dakika sürebilir.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          {status === 'success' ? (
            <div className="text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-green-700 mb-2">Güncelleme Tamamlandı!</p>
              <p className="text-gray-500">Cihaz firmware'iniz başarıyla güncellendi.</p>
            </div>
          ) : status === 'error' ? (
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-red-700 mb-2">Güncelleme Başarısız Oldu</p>
              <p className="text-gray-500">Firmware güncellenirken bir hata oluştu. Lütfen tekrar deneyin.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center mb-6">
                <div className="relative h-24 w-24 flex items-center justify-center">
                  <svg className="absolute h-full w-full animate-spin" viewBox="0 0 100 100">
                    <circle 
                      className="opacity-25" 
                      cx="50" cy="50" r="45" 
                      stroke="currentColor" 
                      strokeWidth="10" 
                      fill="none" 
                    />
                    <circle 
                      className="opacity-75" 
                      cx="50" cy="50" r="45" 
                      stroke="currentColor" 
                      strokeWidth="10" 
                      fill="none" 
                      strokeDasharray="283" 
                      strokeDashoffset={283 - (283 * progress / 100)} 
                    />
                  </svg>
                  <DownloadCloud className="h-12 w-12 text-blue-500" />
                </div>
              </div>
              
              <div className="text-center mb-6">
                <p className="text-lg font-medium mb-1">{getStatusMessage()}</p>
                <p className="text-sm text-gray-500">Lütfen cihazın bağlantısını kesmeyin.</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>İlerleme</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </>
          )}
        </div>
        
        <DialogFooter>
          {(status === 'success' || status === 'error') && (
            <Button onClick={onClose}>
              {status === 'success' ? 'Kapat' : 'Tekrar Dene'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
