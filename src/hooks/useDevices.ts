// src/hooks/useDevices.ts
'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { useSupabase } from '@/providers/supabase-provider';
import { Database } from '@/lib/types/supabase';
import { useToast } from '@/components/ui/use-toast';

type Device = Database['public']['Tables']['devices']['Row'];
type DeviceInsert = Database['public']['Tables']['devices']['Insert'];
type DeviceUpdate = Database['public']['Tables']['devices']['Update'];
type DeviceModel = Database['public']['Tables']['device_models']['Row'];
type DeviceType = Database['public']['Tables']['device_types']['Row'];
type DeviceCategory = Database['public']['Tables']['device_categories']['Row'];
type DeviceStructure = Database['public']['Tables']['device_structure']['Row'];
type DeviceNode = Database['public']['Tables']['device_nodes']['Row'];
type User = Database['public']['Tables']['users']['Row'];

export type DeviceWithDetails = Device & {
  device_models: (DeviceModel & {
    device_types: DeviceType;
    device_categories: DeviceCategory;
  }) | null;
  imageUrl?: string;
  user_devices: { user: User; is_primary_owner: boolean | null }[] | null;
  device_structure: DeviceStructure[] | null;
  device_nodes?: DeviceNode[] | null;
};

export function useDevices() {
  const { supabase, user } = useSupabase();
  const [devices, setDevices] = useState<DeviceWithDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Add request tracking and caching
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const cacheExpiryTimeMs = 30000; // 30 seconds cache
  
  // Image URL cache
  const imageUrlCache = useRef(new Map<string, string>());
    
  const getImageUrl = useCallback((filename: string | null): string | undefined => {
    if (!filename) return undefined;
    
    if (imageUrlCache.current.has(filename)) {
      return imageUrlCache.current.get(filename);
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!baseUrl) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL is not defined");
    }
    const url = `${baseUrl}/storage/v1/object/public/device_images/${filename}`;
    
    // Cache the result
    imageUrlCache.current.set(filename, url);
    return url;
  }, []);
  
  const fetchDevices = useCallback(async (forceRefresh = false) => {
    if (isFetchingRef.current) {
      console.log('Skipping duplicate fetchDevices call - already in progress');
      return;
    }    
    const now = Date.now();
    if (!forceRefresh && 
        devices.length > 0 && 
        now - lastFetchTimeRef.current < cacheExpiryTimeMs) {
      console.log('Using cached devices data');
      return;
    }
    
    try {
      console.log('Fetching devices from Supabase');
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      let query = supabase
        .from('devices')
        .select(`
          *,
          device_models (
            *,
            device_types (*),
            device_categories (*)
          ),
          user_devices (
            user:users(*),
            is_primary_owner
          ),
          device_structure(*),
          device_nodes(*)
        `)
        .order('created_at', { ascending: false });
      
      // if (
      //   user &&
      //   !(          
      //     user.user_metadata?.is_admin === true ||
      //     user.user_metadata?.is_super_admin === true
      //   )
      // ) {        
      //   query = query.filter('user_devices.user_id', 'eq', user.id);
      // }      
      
      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      const devicesWithDetails: DeviceWithDetails[] = (data || []).map((device: any) => {
        const imageUrl = device.device_models
          ? getImageUrl(device.device_models.image_filename)
          : undefined;

        const deviceModel = device.device_models
          ? {
              ...device.device_models,
              device_types: device.device_models.device_types,
              device_categories: device.device_models.device_categories,
            }
          : null;

        return {
          ...device,
          imageUrl,
          device_models: deviceModel,
          user_devices: device.user_devices,
          device_structure: device.device_structure,
          device_nodes: device.device_nodes,
        };
      });

      setDevices(devicesWithDetails);
      lastFetchTimeRef.current = now;
    } catch (err: any) {
      console.error('Error fetching devices:', err);
      setError(err?.message || 'Cihazlar yüklenirken bir hata oluştu');
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Cihaz verileri yüklenirken bir sorun oluştu."
      });
      setDevices([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [supabase, getImageUrl, toast, user, devices.length]);
  
  const canUserAccessDevice = useCallback((deviceId: string): boolean => {
    if (!user) return false;
    const device = devices.find(d => d.id === deviceId);
    if (!device) return false;
    if (user.user_metadata?.is_admin === true) return true;
    return device.user_devices?.some(ud => ud.user.id === user.id) || false;
  }, [devices, user]);

  const createDevice = useCallback(async (device: DeviceInsert) => {
    try {
      const { data, error: insertError } = await supabase
        .from('devices')
        .insert(device)
        .select()
        .single();
      if (insertError) throw insertError;

      const { data: newDevice, error: fetchError } = await supabase
        .from('devices')
        .select(`
          *,
          device_models (
            *,
            device_types (*),
            device_categories(*)
          ),
          user_devices (
            user:users(*),
            is_primary_owner
          ),
          device_structure(*),
          device_nodes(*)
        `)
        .eq('id', data.id)
        .single();
      if (fetchError) throw fetchError;

      if (user) {
        const { error: relationError } = await supabase
          .from('user_devices')
          .insert({
            user_id: user.id,
            device_id: data.id,
            is_primary_owner: true
          });
        if (relationError) throw relationError;
      }

      const imageUrl = newDevice.device_models
        ? getImageUrl(newDevice.device_models.image_filename)
        : undefined;
      const newDeviceWithDetails: DeviceWithDetails = {
        ...newDevice,
        imageUrl,
        device_models: newDevice.device_models
          ? {
              ...newDevice.device_models,
              device_types: newDevice.device_models.device_types,
              device_categories: newDevice.device_models.device_categories,
            }
          : null,
        user_devices: newDevice.user_devices,
        device_structure: newDevice.device_structure,
        device_nodes: newDevice.device_nodes,
      };

      lastFetchTimeRef.current = Date.now();
      
      setDevices(prevDevices => [newDeviceWithDetails, ...prevDevices]);
      toast({
        title: "Başarılı",
        description: "Yeni cihaz başarıyla eklendi."
      });
      return newDevice;
    } catch (e: any) {
      setError(e?.message);
      toast({
        variant: "destructive",
        title: "Hata",
        description: `Cihaz eklenirken bir sorun oluştu: ${e?.message}`
      });
      throw e;
    }
  }, [supabase, getImageUrl, user, toast]);

  const updateDevice = useCallback(async (id: string, updates: DeviceUpdate) => {
    if (!canUserAccessDevice(id)) {
      const errorMsg = "Bu cihaza erişim izniniz yok.";
      toast({
        variant: "destructive",
        title: "Hata",
        description: errorMsg
      });
      throw new Error(errorMsg);
    }
    try {
      const { data, error: updateError } = await supabase
        .from('devices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (updateError) throw updateError;

      const { data: updatedDevice, error: fetchError } = await supabase
        .from('devices')
        .select(`
          *,
          device_models (
            *,
            device_types (*),
            device_categories(*)
          ),
          user_devices (
            user:users(*),
            is_primary_owner
          ),
          device_structure(*),
          device_nodes(*)
        `)
        .eq('id', data.id)
        .single();
      if (fetchError) throw fetchError;

      const imageUrl = updatedDevice.device_models
        ? getImageUrl(updatedDevice.device_models.image_filename)
        : undefined;
      const updatedDeviceWithDetails: DeviceWithDetails = {
        ...updatedDevice,
        imageUrl,
        device_models: updatedDevice.device_models
          ? {
              ...updatedDevice.device_models,
              device_types: updatedDevice.device_models.device_types,
              device_categories: updatedDevice.device_models.device_categories,
            }
          : null,
        user_devices: updatedDevice.user_devices,
        device_structure: updatedDevice.device_structure,
        device_nodes: updatedDevice.device_nodes,
      };

      lastFetchTimeRef.current = Date.now();
      
      setDevices(prevDevices =>
        prevDevices.map(device =>
          device.id === id ? updatedDeviceWithDetails : device
        )
      );
      toast({
        title: "Başarılı",
        description: "Cihaz bilgileri güncellendi."
      });
      return updatedDevice;
    } catch (e: any) {
      setError(e?.message);
      toast({
        variant: "destructive",
        title: "Hata",
        description: `Cihaz güncellenirken bir sorun oluştu: ${e?.message}`
      });
      throw e;
    }
  }, [supabase, getImageUrl, toast, canUserAccessDevice]);

  const deleteDevice = useCallback(async (id: string) => {
    if (!canUserAccessDevice(id)) {
      const errorMsg = "Bu cihaza erişim izniniz yok.";
      toast({
        variant: "destructive",
        title: "Hata",
        description: errorMsg
      });
      throw new Error(errorMsg);
    }
    try {
      await Promise.all([
        supabase.from('user_devices').delete().eq('device_id', id),
        supabase.from('device_nodes').delete().eq('device_id', id),
        supabase.from('device_structure').delete().eq('device_id', id)
      ]);

      const { error: deleteError } = await supabase
        .from('devices')
        .delete()
        .eq('id', id);
      if (deleteError) throw deleteError;

      lastFetchTimeRef.current = Date.now();
      
      setDevices(prevDevices => prevDevices.filter(device => device.id !== id));
      toast({
        title: "Başarılı",
        description: "Cihaz başarıyla silindi."
      });
    } catch (e: any) {
      setError(e?.message);
      toast({
        variant: "destructive",
        title: "Hata",
        description: `Cihaz silinirken bir sorun oluştu: ${e?.message}`
      });
      throw e;
    }
  }, [supabase, toast, canUserAccessDevice]);

  useEffect(() => {
    if (user) {
      fetchDevices();
    } else {
      setDevices([]);
      setLoading(false);
    }
  }, [user]);

  return {
    devices,
    loading,
    error,
    createDevice,
    updateDevice,
    deleteDevice,
    refreshDevices: (force = true) => fetchDevices(force),
    getImageUrl,
    canUserAccessDevice
  };
}