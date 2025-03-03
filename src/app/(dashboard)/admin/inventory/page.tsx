// src/app/(dashboard)/admin/inventory/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSupabase } from '@/providers/supabase-provider';
import { useDevices, DeviceWithDetails } from '@/hooks/useDevices';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSection } from '@/components/shared/loading';
import { PlusIcon, Search, FilterX, Box, User, Server } from 'lucide-react';
import DeviceForm from '@/components/devices/device-form';
import AssignDeviceForm from '../assign-device-form';
import BulkDeviceForm from '../bulk-device-form';
import Image from 'next/image';
import Link from 'next/link';

export default function InventoryPage() {
  const { supabase, user } = useSupabase();
  const { devices, loading, error, refreshDevices } = useDevices();
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState('');
  const [modelFilter, setModelFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkFormOpen, setIsBulkFormOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceWithDetails | null>(null);
  const [isAssignFormOpen, setIsAssignFormOpen] = useState(false);

  useEffect(() => {
    // Admin kontrolü
    if (user?.user_metadata?.is_admin || user?.user_metadata?.is_super_admin || user?.app_metadata?.admin === true ) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  // Stokta olan cihazları filtrele (kullanıcıya atanmamış)
  const unassignedDevices = useMemo(() => {
    return devices.filter(device => !device.user_devices || device.user_devices.length === 0);
  }, [devices]);

  // Arama ve filtreleme
  const filteredDevices = useMemo(() => {
    let result = unassignedDevices;
    
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        device => 
          device.name.toLowerCase().includes(searchLower) || 
          device.serial_number.toLowerCase().includes(searchLower)
      );
    }
    
    if (modelFilter !== 'all') {
      result = result.filter(device => device.model_id === modelFilter);
    }
    
    return result;
  }, [unassignedDevices, search, modelFilter]);

  const uniqueModels = useMemo(() => {
    const models = new Set<string>();
    unassignedDevices.forEach(device => {
      if (device.model_id) models.add(device.model_id);
    });
    return Array.from(models);
  }, [unassignedDevices]);

  if (loading) {
    return <LoadingSection text="Loading inventory..." />;
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-500">You don't have permission to access this page.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsBulkFormOpen(true)}>
            <Box className="mr-2 h-4 w-4" />
            Bulk Add
          </Button>
          <Button onClick={() => setIsFormOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Device
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total in Stock</p>
                <p className="text-3xl font-bold">{unassignedDevices.length}</p>
              </div>
              <Box className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Unique Models</p>
                <p className="text-3xl font-bold">{uniqueModels.length}</p>
              </div>
              <Server className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Assigned</p>
                <p className="text-3xl font-bold">{devices.length - unassignedDevices.length}</p>
              </div>
              <User className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-grow">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search devices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={modelFilter} onValueChange={setModelFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Models</SelectItem>
              {uniqueModels.map(modelId => {
                const model = devices.find(d => d.model_id === modelId)?.device_models;
                return (
                  <SelectItem key={modelId} value={modelId}>
                    {model?.name || modelId}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          
          {(search || modelFilter !== 'all') && (
            <Button 
              variant="outline" 
              onClick={() => {
                setSearch('');
                setModelFilter('all');
              }}
            >
              <FilterX className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Inventory List */}
      {filteredDevices.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Box className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-xl font-medium text-gray-500">No devices in stock</p>
            <p className="text-gray-400 mb-6">Add new devices to inventory</p>
            <Button onClick={() => setIsFormOpen(true)}>Add Device</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDevices.map(device => (
            <Card key={device.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start">
                  {device.imageUrl && (
                    <div className="relative w-24 h-24 mr-4 shrink-0">
                      <Image
                        src={device.imageUrl}
                        alt={device.name}
                        fill
                        className="object-cover rounded-md"
                        sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <CardTitle className="text-base">{device.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Serial: {device.serial_number}
                    </p>
                    {device.device_models && (
                      <p className="text-xs text-muted-foreground">
                        Model: {device.device_models.name}
                      </p>
                    )}
                    <Badge
                      className={device.is_online ? 'bg-green-500 text-white mt-2' : 'bg-red-500 text-white mt-2'}
                    >
                      {device.is_online ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-2 flex justify-end">
                <div className="flex gap-2">
                  <Link href={`/devices/${device.id}`}>
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => {
                      setSelectedDevice(device);
                      setIsAssignFormOpen(true);
                    }}
                  >
                    Assign to User
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Forms */}
      <DeviceForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => {
          refreshDevices();
          setIsFormOpen(false);
        }}
      />

      {selectedDevice && (
        <AssignDeviceForm
          open={isAssignFormOpen}
          onClose={() => {
            setIsAssignFormOpen(false);
            setSelectedDevice(null);
          }}
          onSuccess={() => {
            refreshDevices();
            setIsAssignFormOpen(false);
            setSelectedDevice(null);
          }}
          device={selectedDevice}
        />
      )}

      <BulkDeviceForm
        open={isBulkFormOpen}
        onClose={() => setIsBulkFormOpen(false)}
        onSuccess={() => {
          refreshDevices();
          setIsBulkFormOpen(false);
        }}
      />
    </div>
  );
}