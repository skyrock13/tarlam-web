// src/components/devices/device-share-modal.tsx
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DeviceShareModalProps {
  open: boolean;
  onClose: () => void;
  onShare: (email: string, role: string) => void;
  deviceId: string;
  deviceName: string;
}

export default function DeviceShareModal({
  open,
  onClose,
  onShare,
  deviceId,
  deviceName
}: DeviceShareModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = () => {
    if (!email) return;
    
    setIsSubmitting(true);
    onShare(email, role);
    
    // Formu sıfırla
    setEmail('');
    setRole('viewer');
    setIsSubmitting(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cihaz Erişimi Paylaş</DialogTitle>
          <DialogDescription>
            Diğer kullanıcılara "{deviceName}" cihazına erişim izni verin. E-posta davetiyesi alacaklar.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">E-posta adresi</Label>
            <Input
              id="email"
              type="email"
              placeholder="kullanici@ornek.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="role">İzin seviyesi</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Bir rol seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">İzleyici (salt okunur)</SelectItem>
                <SelectItem value="manager">Yönetici (tam erişim)</SelectItem>
                <SelectItem value="owner">Sahip (tüm yetkiler)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>İptal</Button>
          <Button onClick={handleSubmit} disabled={!email || isSubmitting}>
            {isSubmitting ? 'Gönderiliyor...' : 'Davet Gönder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}