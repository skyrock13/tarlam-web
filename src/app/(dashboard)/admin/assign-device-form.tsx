// src/components/admin/assign-device-form.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/types/supabase';
import { DeviceWithDetails } from '@/hooks/useDevices';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

interface AssignDeviceFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  device: DeviceWithDetails;
}

export default function AssignDeviceForm({ open, onClose, onSuccess, device }: AssignDeviceFormProps) {
  const [userId, setUserId] = useState('');
  const [isPrimaryOwner, setIsPrimaryOwner] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const supabase = createClientComponentClient<Database>();

  // Kullanıcıları yükle
  useEffect(() => {
    const fetchUsers = async () => {
      if (!open) return;
      
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name');
        
      if (error) {
        setError('Failed to load users');
        return;
      }
      
      setUsers(data || []);
    };
    
    fetchUsers();
  }, [open, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    if (!userId) {
      setError('Please select a user');
      setIsSubmitting(false);
      return;
    }
    
    try {
      const { error: assignError } = await supabase
        .from('user_devices')
        .insert({
          user_id: userId,
          device_id: device.id,
          is_primary_owner: isPrimaryOwner
        });
        
      if (assignError) throw assignError;
      
      toast({
        title: 'Success',
        description: 'Device assigned to user successfully',
      });
      
      onSuccess();
      
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Device to User</DialogTitle>
          <DialogDescription>
            Select a user to assign device: {device.name} (SN: {device.serial_number})
          </DialogDescription>
        </DialogHeader>
        
        {error && <div className="text-red-500 mb-4">{error}</div>}
        
        <form onSubmit={handleSubmit} id="assignForm" className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="user" className="text-right">User</Label>
            <Select 
              value={userId} 
              onValueChange={setUserId}
              disabled={isSubmitting}
            >
              <SelectTrigger id="user" className="col-span-3">
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.first_name} {user.last_name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="col-start-2 col-span-3 flex items-center space-x-2">
              <Checkbox 
                id="primaryOwner" 
                checked={isPrimaryOwner} 
                onCheckedChange={() => setIsPrimaryOwner(!isPrimaryOwner)}
                disabled={isSubmitting}
              />
              <label
                htmlFor="primaryOwner"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Make primary owner
              </label>
            </div>
          </div>
        </form>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="assignForm" disabled={isSubmitting || !userId}>
            {isSubmitting ? 'Assigning...' : 'Assign Device'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}