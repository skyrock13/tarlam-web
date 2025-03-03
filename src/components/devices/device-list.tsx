// src/components/devices/DevicesList.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { DeviceWithDetails } from '@/hooks/useDevices';
import { useDevicesContext } from '@/providers/devices-provider';
import { LoadingSection } from '@/components/shared/loading';
import Image from 'next/image';
import Link from 'next/link';
import DeviceForm from './device-form';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Input } from "../ui/input";
import {
  User as UserIcon,
  Plus,
  Search,
  ListFilter,
  Grid,
  List,
  SlidersHorizontal,
  RefreshCw,
  AlertCircle,
  Server,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export default function DevicesList() {
  const { devices, loading, error, refreshDevices } = useDevicesContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceWithDetails | null>(null);

  // New states for enhanced features
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [modelFilter, setModelFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isInitialMount = useRef(true);

  // Initialize and load data
  useEffect(() => {
    if (isInitialMount.current) {
      refreshDevices(false);
      isInitialMount.current = false;
    }
  }, [refreshDevices]);

  // Handle form events
  const handleEdit = (device: DeviceWithDetails) => {
    setSelectedDevice(device);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setSelectedDevice(null);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    refreshDevices(true);
  };

  // Handle manual refresh
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshDevices(true);
    setTimeout(() => setIsRefreshing(false), 600); // Visual feedback
  };

  // Filter and sort functions
  const getFilteredDevices = () => {
    return devices.filter(device => {
      // Search filter
      if (searchQuery && !device.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !device.serial_number.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Status filter
      if (statusFilter === 'online' && !device.is_online) return false;
      if (statusFilter === 'offline' && device.is_online) return false;

      // Model filter
      if (modelFilter !== 'all' && device.model_id !== modelFilter) return false;

      // Category filter
      if (categoryFilter !== 'all' &&
        device.device_models?.device_categories?.id !== categoryFilter) return false;

      if (!device.user_devices || device.user_devices.length === 0) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      // Sort options
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default:
          return 0;
      }
    });
  };

  // Collect unique models and categories for filters
  const uniqueModels = Array.from(new Set(devices.map(d => d.model_id)));
  const uniqueCategories = Array.from(
    new Set(devices.map(d => d.device_models?.device_categories?.id).filter(Boolean))
  );

  // Format date for better display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (e) {
      return dateString;
    }
  };

  // Get filtered devices
  const filteredDevices = getFilteredDevices();
  
  const assignedDevices = devices.filter(device => 
    device.user_devices && device.user_devices.length > 0
  );

  // Online ve offline cihaz sayılarını hesapla
  const onlineDevicesCount = assignedDevices.filter(d => d.is_online).length;
  const offlineDevicesCount = assignedDevices.filter(d => !d.is_online).length;

  // Toplam cihaz sayısını hesapla
  const assignedDevicesCount = assignedDevices.length;

  // Loading and error states
  if (loading && devices.length === 0) {
    return <LoadingSection text="Loading devices..." />;
  }

  if (error) {
    return (
      <Card className="border-red-300 bg-red-50 my-4">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <CardTitle>Error Loading Devices</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => refreshDevices(true)}>
            Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with title and add button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Devices</h1>
        <Button onClick={handleAdd} className="flex items-center">
          <Plus className="mr-2 h-4 w-4" /> Add Device
        </Button>
      </div>

      {/* Stats Overview */}
     <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Devices</p>
                <p className="text-3xl font-bold">{assignedDevicesCount}</p>
              </div>
              <Server className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Online</p>
                <p className="text-3xl font-bold text-green-600">
                  {onlineDevicesCount}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Offline</p>
                <p className="text-3xl font-bold text-red-600">
                  {offlineDevicesCount}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Models</p>
                <p className="text-3xl font-bold">{uniqueModels.length}</p>
              </div>
              <div className="flex -space-x-2">                
                {uniqueModels.length > 3 && (
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 border-2 border-white text-xs">
                    +{uniqueModels.length - 3}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
        <div className="relative flex-grow">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search devices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex space-x-2">
          <Select value={statusFilter} onValueChange={(value: 'all' | 'online' | 'offline') => setStatusFilter(value)}>
            <SelectTrigger className="w-[120px]">
              <div className="flex items-center">
                <div className={`h-2 w-2 rounded-full mr-2 ${statusFilter === 'online' ? 'bg-green-500' :
                    statusFilter === 'offline' ? 'bg-red-500' : 'bg-gray-500'
                  }`}></div>
                {statusFilter === 'all' ? 'All Status' :
                  statusFilter === 'online' ? 'Online' : 'Offline'}
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px]">
              <div className="flex items-center">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Sort
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="recent">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <ListFilter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Filter by Model</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={modelFilter === 'all'}
                onCheckedChange={() => setModelFilter('all')}
              >
                All Models
              </DropdownMenuCheckboxItem>
              {uniqueModels.map((modelId) => {
                const model = devices.find(d => d.model_id === modelId)?.device_models;
                return (
                  <DropdownMenuCheckboxItem
                    key={modelId}
                    checked={modelFilter === modelId}
                    onCheckedChange={() => setModelFilter(modelId)}
                  >
                    {model?.name || modelId}
                  </DropdownMenuCheckboxItem>
                );
              })}

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={categoryFilter === 'all'}
                onCheckedChange={() => setCategoryFilter('all')}
              >
                All Categories
              </DropdownMenuCheckboxItem>
              {uniqueCategories.map((categoryId) => {
                const category = devices.find(d =>
                  d.device_models?.device_categories?.id === categoryId
                )?.device_models?.device_categories;
                return (
                  <DropdownMenuCheckboxItem
                    key={categoryId}
                    checked={categoryFilter === categoryId}
                    onCheckedChange={() => setCategoryFilter(categoryId)}
                  >
                    {category?.name || categoryId}
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="icon"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>

          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Devices List/Grid */}
      {devices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Server className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-xl font-medium text-gray-500">No devices found</p>
            <p className="text-gray-400 mb-6">Add your first device to get started</p>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" /> Add Device
            </Button>
          </CardContent>
        </Card>
      ) : filteredDevices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-xl font-medium text-gray-500">No matching devices</p>
            <p className="text-gray-400 mb-6">Try adjusting your search or filters</p>
            <Button variant="outline" onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setModelFilter('all');
              setCategoryFilter('all');
            }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDevices.map((device) => (
            <Card key={device.id} className="flex flex-col overflow-hidden hover:shadow-md transition-shadow duration-200">
              <Link href={`/devices/${device.id}`} className="flex p-4">
                {device.imageUrl ? (
                  <div className="relative w-24 h-24 mr-4 shrink-0">
                    <Image
                      src={device.imageUrl}
                      alt={`Image of ${device.name}`}
                      fill
                      className="object-cover rounded-md"
                      sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
                    />
                  </div>
                ) : (
                  <div className="relative w-24 h-24 mr-4 shrink-0 bg-gray-100 rounded-md flex items-center justify-center">
                    <Server className="h-10 w-10 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 space-y-1">
                  <CardHeader className="p-0">
                    <CardTitle className="text-base">{device.name}</CardTitle>
                    <CardDescription className="text-xs">
                      Serial No: {device.serial_number}
                    </CardDescription>
                    {device.device_models && (
                      <CardDescription className="text-xs">
                        Model: {device.device_models.name}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <div className="flex items-center space-x-2">
                    <Badge
                      className={device.is_online ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}
                    >
                      {device.is_online ? 'Online' : 'Offline'}
                    </Badge>
                    <CardDescription className="text-xs">
                      Son Bağlantı: {formatDate(device.last_connection_at)}
                    </CardDescription>
                  </div>
                  {device.user_devices && device.user_devices[0]?.user && (
                    <div className="flex items-center mt-2">
                      <UserIcon className="h-4 w-4 mr-1 text-gray-500" />
                      <span className="text-xs">
                        Owner: {device.user_devices[0].user.first_name}
                        {device.user_devices[0].user.last_name &&
                          ` ${device.user_devices[0].user.last_name}`}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
              <CardContent className="p-2 flex justify-end border-t mt-auto">
                <div className="flex justify-end">
                  <Link href={`/devices/${device.id}`}>
                    <Button variant="outline" size="sm" className="mr-2">View</Button>
                  </Link>
                  <Button variant="secondary" size="sm" onClick={() => handleEdit(device)}>
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="border rounded-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Device
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Model
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Connection
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDevices.map((device) => (
                <tr key={device.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {device.imageUrl ? (
                        <div className="relative w-10 h-10 mr-3 shrink-0">
                          <Image
                            src={device.imageUrl}
                            alt={`Image of ${device.name}`}
                            fill
                            className="object-cover rounded-md"
                            sizes="40px"
                          />
                        </div>
                      ) : (
                        <div className="relative w-10 h-10 mr-3 shrink-0 bg-gray-100 rounded-md flex items-center justify-center">
                          <Server className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{device.name}</div>
                        <div className="text-xs text-gray-500">SN: {device.serial_number}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      className={device.is_online ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}
                    >
                      {device.is_online ? 'Online' : 'Offline'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{device.device_models?.name || 'N/A'}</div>
                    <div className="text-xs text-gray-500">{device.device_models?.device_categories?.name || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {device.user_devices && device.user_devices[0]?.user ? (
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-1 text-gray-500" />
                        <span className="text-sm text-gray-900">
                          {device.user_devices[0].user.first_name}
                          {device.user_devices[0].user.last_name &&
                            ` ${device.user_devices[0].user.last_name}`}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">No owner</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(device.last_connection_at)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link href={`/devices/${device.id}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                      <Button variant="secondary" size="sm" onClick={() => handleEdit(device)}>
                        Edit
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Device Form */}
      <DeviceForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleFormSuccess}
        initialDevice={selectedDevice}
      />
    </div>
  );
}