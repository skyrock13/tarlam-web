'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/types/supabase';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, AlertCircle } from 'lucide-react';

interface BulkDeviceFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkDeviceForm({ open, onClose, onSuccess }: BulkDeviceFormProps) {
  const [modelId, setModelId] = useState<string>('');
  const [serialNumbers, setSerialNumbers] = useState<string>('');
  const [count, setCount] = useState<string>('10');
  const [digitCount, setDigitCount] = useState<string>('4');
  const [bulkType, setBulkType] = useState<'manual' | 'auto'>('manual');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<any[]>([]);
  const [previewSerials, setPreviewSerials] = useState<string[]>([]);
  const { toast } = useToast();

  const supabase = createClientComponentClient<Database>();

  const generateRandomSerial = (prefix: string, digits: number): string => {
    const max = Math.pow(10, digits) - 1;
    const randomNum = Math.floor(Math.random() * (max + 1));
    return `${prefix}${randomNum.toString().padStart(digits, '0')}`;
  };

  useEffect(() => {
    const fetchModels = async () => {
      if (!open) return;

      const { data, error } = await supabase
        .from('device_models')
        .select(`
          id,
          name,
          type_id,
          device_types ( 
            name 
          )
        `);

      if (error) {
        setError('Failed to load device models');
        return;
      }

      setModels(data || []);
    };

    fetchModels();
  }, [open, supabase]);

  useEffect(() => {
    if (bulkType !== 'auto' || !modelId) return;

    try {
      const totalCount = parseInt(count);
      const digits = parseInt(digitCount);
      if (isNaN(totalCount) || isNaN(digits)) {
        setPreviewSerials([]);
        return;
      }

      const selectedModel = models.find(model => model.id === modelId);
      const deviceTypeName = selectedModel?.device_types?.name; // Doğru şekilde erişim

      const deviceTypePrefix = deviceTypeName
        ? deviceTypeName.substring(0, 2).toUpperCase()
        : 'XX';
      const currentYear = new Date().getFullYear();
      const computedPrefix = `${deviceTypePrefix}-${currentYear}-`;

      const sampleSerials: string[] = [];
      const sampleCount = Math.min(totalCount, 5);
      for (let i = 0; i < sampleCount; i++) {
        sampleSerials.push(generateRandomSerial(computedPrefix, digits));
      }
      if (totalCount > sampleCount) {
        sampleSerials.push('...');
        sampleSerials.push(generateRandomSerial(computedPrefix, digits));
      }

      setPreviewSerials(sampleSerials);
    } catch (e) {
      setPreviewSerials([]);
    }
  }, [count, digitCount, bulkType, modelId, models]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!modelId) {
      setError('Please select a device model');
      setIsSubmitting(false);
      return;
    }

    let serials: string[] = [];

    if (bulkType === 'manual') {
      serials = serialNumbers
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      if (serials.length === 0) {
        setError('Please enter at least one serial number');
        setIsSubmitting(false);
        return;
      }
    } else {
      try {
        const totalCount = parseInt(count);
        const digits = parseInt(digitCount);
        if (isNaN(totalCount) || isNaN(digits)) {
          setError('Please enter valid numbers for count and digits');
          setIsSubmitting(false);
          return;
        }
        if (totalCount <= 0 || totalCount > 500) {
          setError('Count must be between 1 and 500');
          setIsSubmitting(false);
          return;
        }

        const selectedModel = models.find(model => model.id === modelId);
        const deviceTypeName = selectedModel?.device_types?.name;

        const deviceTypePrefix = deviceTypeName
          ? deviceTypeName.substring(0, 2).toUpperCase()
          : 'XX';
        const currentYear = new Date().getFullYear();
        const computedPrefix = `${deviceTypePrefix}-${currentYear}-`;

        const serialSet = new Set<string>();
        let attempts = 0;
        const maxAttempts = totalCount * 10;

        while (serialSet.size < totalCount && attempts < maxAttempts) {
          serialSet.add(generateRandomSerial(computedPrefix, digits));
          attempts++;
        }

        if (serialSet.size < totalCount) {
          setError('Failed to generate enough unique serial numbers. Increase digit count?');
          setIsSubmitting(false);
          return;
        }

        serials = Array.from(serialSet);
      } catch (e) {
        setError('Error generating serial numbers');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const devicesToInsert = serials.map(serial => ({
        name: `Device ${serial}`,
        serial_number: serial,
        model_id: modelId,
        is_online: false
      }));

      const { error: insertError } = await supabase
        .from('devices')
        .insert(devicesToInsert)
        .select();

      if (insertError) throw insertError;

      toast({
        title: 'Success',
        description: `Added ${serials.length} devices to inventory`,
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Bulk Add Devices</DialogTitle>
          <DialogDescription>
            Add multiple devices to inventory at once
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} id="bulkForm" className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="model" className="text-right">Device Model</Label>
            <Select 
              value={modelId} 
              onValueChange={setModelId}
              disabled={isSubmitting}
            >
              <SelectTrigger id="model" className="col-span-3">
                <SelectValue placeholder="Select a device model" />
              </SelectTrigger>
              <SelectContent>
                {models.map(model => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="bulkType" className="text-right">Input Method</Label>
            <Select 
              value={bulkType} 
              onValueChange={(value: 'manual' | 'auto') => setBulkType(value)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="bulkType" className="col-span-3">
                <SelectValue placeholder="Select input method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual Entry</SelectItem>
                <SelectItem value="auto">Auto Generate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {bulkType === 'manual' ? (
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="serials" className="text-right pt-2">Serial Numbers</Label>
              <div className="col-span-3 space-y-2">
                <Textarea
                  id="serials"
                  placeholder="Enter one serial number per line"
                  value={serialNumbers}
                  onChange={(e) => setSerialNumbers(e.target.value)}
                  className="min-h-[150px] font-mono text-sm"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Each line will be treated as one serial number
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="count" className="text-right">Count</Label>
                <Input
                  id="count"
                  type="number"
                  min="1"
                  max="500"
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  className="col-span-3"
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="digitCount" className="text-right">Digits</Label>
                <Input
                  id="digitCount"
                  type="number"
                  min="1"
                  max="10"
                  value={digitCount}
                  onChange={(e) => setDigitCount(e.target.value)}
                  className="col-span-3"
                  disabled={isSubmitting}
                />
              </div>

              {previewSerials.length > 0 && (
                <div className="grid grid-cols-4 items-start gap-4">
                  <div className="text-right pt-2">
                    <Label>Preview</Label>
                  </div>
                  <div className="col-span-3">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Serial Number Preview</AlertTitle>
                      <AlertDescription>
                        <div className="mt-2 font-mono text-sm">
                          {previewSerials.map((serial, index) => (
                            <div key={index}>{serial}</div>
                          ))}
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          Will generate {count} serial numbers in total
                        </div>
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              )}
            </>
          )}
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="bulkForm" disabled={isSubmitting || !modelId}>
            {isSubmitting ? 'Processing...' : 'Add Devices'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
