// src/app/(dashboard)/devices/page.tsx
'use client';

import { useEffect } from 'react';
import DevicesList from '@/components/devices/device-list';
import { useDevicesContext } from '@/providers/devices-provider';

export default function DevicesPage() {
  const { refreshDevices } = useDevicesContext();

  // Initial load of devices when the page mounts
  useEffect(() => {
    refreshDevices(true);
  }, [refreshDevices]);

  return (
    <div className="space-y-6">
      <DevicesList />
    </div>
  );
}