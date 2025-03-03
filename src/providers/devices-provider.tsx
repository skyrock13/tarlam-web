// src/providers/devices-provider.tsx
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useDevices, DeviceWithDetails } from '@/hooks/useDevices';
import { Database } from '@/lib/types/supabase';

type DeviceInsert = Database['public']['Tables']['devices']['Insert'];
type DeviceUpdate = Database['public']['Tables']['devices']['Update'];

type DevicesContextType = {
  devices: DeviceWithDetails[];
  loading: boolean;
  error: string | null;
  refreshDevices: (force?: boolean) => Promise<void>;
  createDevice: (device: DeviceInsert) => Promise<any>;
  updateDevice: (id: string, updates: DeviceUpdate) => Promise<any>;
  deleteDevice: (id: string) => Promise<void>;
  getImageUrl: (filename: string | null) => string | undefined;
  canUserAccessDevice: (deviceId: string) => boolean;
};

const DevicesContext = createContext<DevicesContextType | undefined>(undefined);

export function DevicesProvider({ children }: { children: ReactNode }) {
  const devicesData = useDevices();
  
  return (
    <DevicesContext.Provider value={devicesData}>
      {children}
    </DevicesContext.Provider>
  );
}

export function useDevicesContext() {
  const context = useContext(DevicesContext);
  if (context === undefined) {
    throw new Error('useDevicesContext must be used within a DevicesProvider');
  }
  return context;
}