'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useDevicesContext } from '@/providers/devices-provider';
import { notFound, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSection } from '@/components/shared/loading';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, Settings, Server, Activity, Info, Edit, 
  Trash2, AlertTriangle, RefreshCw, DownloadCloud, Zap, 
  Terminal, WifiOff, Bell, Share2, FileText, Shield
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import DeviceForm from '@/components/devices/device-form';
import FirmwareUpdateModal from '@/components/devices/firmware-update-modal';
import DeviceShareModal from '@/components/devices/device-share-modal';
import EnhancedMetricsViewer from '@/components/devices/metrics-viewer';
import MaintenanceLog from '@/components/devices/maintenance-log';
import { createClient } from '@supabase/supabase-js';

interface PageProps {
  params: { id: string };
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function DeviceDetailPage({ params }: PageProps) {
  const { id } = params;
  const { devices, loading, error, deleteDevice, refreshDevices, updateDevice, canUserAccessDevice } = useDevicesContext();
  const router = useRouter();
  const { toast } = useToast();
  
  // Local state
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isUpdatingFirmware, setIsUpdatingFirmware] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [isSharingDialogOpen, setIsSharingDialogOpen] = useState(false);
  const [firmwareProgress, setFirmwareProgress] = useState(0);
  
  // Supabase'den metrik verilerini çekmek için state
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // get device from context
  const device = useMemo(() => devices.find(d => d.id === id), [devices, id]);
  
  // Örnek bakım kayıtları (demo amaçlı)
  const [maintenanceRecords] = useState([
    {
      id: '1',
      maintenance_type: 'restart',
      description: 'Rutin cihaz yeniden başlatma',
      scheduled_date: new Date().toISOString(),
      completed_date: new Date().toISOString(),
      performed_actions: { status: 'success', duration: '35s' },
      user: {
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@example.com'
      }
    },
    {
      id: '2',
      maintenance_type: 'firmware_update',
      description: 'Firmware v1.2.5 güncellemesi',
      scheduled_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      completed_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      performed_actions: { version: '1.2.5', status: 'success' },
      user: {
        first_name: 'System',
        last_name: 'Automatic',
        email: 'system@example.com'
      }
    }
  ]);

  // Metrics verilerini Supabase'den çek
  const fetchMetrics = useCallback(async () => {
    setLoadingMetrics(true);
    const { data, error } = await supabase
      .from('device_metrics')
      .select('*')
      .eq('device_id', id)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Error fetching metrics:', error);
    } else {
      setMetrics(data || []);
    }
    setLoadingMetrics(false);
  }, [id]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Handle device restart
  const handleRestartDevice = useCallback(async () => {
    if (!device || !device.is_online) return;
    
    setIsRestarting(true);
    try {
      await updateDevice(id, { 
        is_online: false, 
        metadata: { 
          ...device.metadata,
          last_restart: new Date().toISOString()
        }
      });
      
      toast({
        title: "Cihaz Yeniden Başlatılıyor",
        description: "Bu işlem birkaç dakika sürebilir."
      });
      
      // Simulate device coming back online after 10 seconds
      setTimeout(async () => {
        await updateDevice(id, { is_online: true });
        setIsRestarting(false);
        toast({
          title: "Cihaz Çevrimiçi",
          description: "Cihaz başarıyla yeniden başlatıldı."
        });
      }, 10000);
    } catch (error) {
      console.error('Error restarting device:', error);
      setIsRestarting(false);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Cihaz yeniden başlatılırken bir sorun oluştu."
      });
    }
  }, [device, id, updateDevice, toast]);

  // Handle firmware update
  const handleStartFirmwareUpdate = useCallback(() => {
    if (!device || !device.is_online) return;
    
    setIsUpdatingFirmware(true);
    setFirmwareProgress(0);
    
    // Simulate firmware update progress
    const interval = setInterval(() => {
      setFirmwareProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          // Complete update after reaching 100%
          setTimeout(() => {
            completeFirmwareUpdate();
          }, 1000);
          return 100;
        }
        return prev + 5;
      });
    }, 500);
  }, [device]);

  // Complete firmware update
  const completeFirmwareUpdate = useCallback(async () => {
    try {
      const newVersion = device?.firmware_version 
        ? incrementVersion(device.firmware_version)
        : "1.0.0";
        
      await updateDevice(id, { 
        firmware_version: newVersion,
        metadata: {
          ...device?.metadata,
          last_firmware_update: new Date().toISOString()
        }
      });
      
      toast({
        title: "Firmware Güncellendi",
        description: `Firmware başarıyla ${newVersion} sürümüne güncellendi.`
      });
    } catch (error) {
      console.error('Error updating firmware:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Firmware güncellenirken bir sorun oluştu."
      });
    } finally {
      setIsUpdatingFirmware(false);
      setFirmwareProgress(0);
    }
  }, [device, id, updateDevice, toast]);

  // Increment version number helper
  const incrementVersion = (version: string): string => {
    const parts = version.split('.');
    if (parts.length !== 3) return "1.0.0";
    
    let patch = parseInt(parts[2]) + 1;
    if (patch > 9) {
      patch = 0;
      let minor = parseInt(parts[1]) + 1;
      if (minor > 9) {
        minor = 0;
        const major = parseInt(parts[0]) + 1;
        return `${major}.${minor}.${patch}`;
      }
      return `${parts[0]}.${minor}.${patch}`;
    }
    return `${parts[0]}.${parts[1]}.${patch}`;
  };

  // Handle share device (mock implementation)
  const handleShareDevice = useCallback((email: string, role: string) => {
    toast({
      title: "Cihaz Paylaşıldı",
      description: `${email} adresine davet gönderildi.`
    });
    setIsSharingDialogOpen(false);
  }, [toast]);

  // Handle device deletion
  const handleDelete = useCallback(async () => {
    try {
      await deleteDevice(id);
      router.push('/devices');
    } catch (error) {
      console.error('Error deleting device:', error);
    }
  }, [deleteDevice, id, router]);

  // Handle form edit success
  const handleEditSuccess = useCallback(() => {
    refreshDevices(true);
    setIsEditing(false);
  }, [refreshDevices]);

  // Format date helper
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString();
    } catch (e) {
      return dateStr;
    }
  };
  
  // Calculate uptime if available
  const calculateUptime = useMemo(() => {
    if (!device?.metadata?.uptime) return 'N/A';
    
    const uptimeSeconds = Number(device.metadata.uptime);
    if (isNaN(uptimeSeconds)) return device.metadata.uptime;
    
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    
    return `${days}g ${hours}s ${minutes}d`;
  }, [device?.metadata?.uptime]);

  // Loading state
  if (loading) {
    return <LoadingSection text="Cihaz detayları yükleniyor..." />;
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <Card className="border-red-300 bg-red-50">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <CardTitle>Cihaz Yüklenirken Hata</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">{error}</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => router.push('/devices')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Cihazlara Dön
            </Button>
            <Button className="ml-2" onClick={() => refreshDevices(true)}>
              <RefreshCw className="mr-2 h-4 w-4" /> Tekrar Dene
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Not found state
  if (!device) {
    notFound();
    return null;
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* Back button and actions row */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-6">
        <Button variant="outline" onClick={() => router.push('/devices')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Cihazlara Dön
        </Button>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit className="mr-2 h-4 w-4" /> Düzenle
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsSharingDialogOpen(true)} 
            className="border-blue-300 hover:bg-blue-50"
          >
            <Share2 className="mr-2 h-4 w-4" /> Paylaş
          </Button>
          <Button 
            variant={device.is_online ? "outline" : "ghost"}
            onClick={handleRestartDevice}
            disabled={!device.is_online || isRestarting}
            className={device.is_online ? "border-amber-300 hover:bg-amber-50" : ""}
          >
            {isRestarting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Yeniden Başlatılıyor...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" /> Yeniden Başlat
              </>
            )}
          </Button>
          <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" /> Sil
          </Button>
        </div>
      </div>

      {/* Header card with image and basic info */}
      <Card className="mb-6 overflow-hidden border-t-4 border-t-blue-500">
        <div className="md:flex">
          {/* Image (Left Side) */}
          {device.imageUrl ? (
            <div className="relative w-full md:w-1/3 h-64 md:h-auto">
              <Image
                src={device.imageUrl}
                alt={device.name}
                fill
                className="object-cover"
                sizes="(max-width: 767px) 100vw, (max-width: 1023px) 33vw, 25vw"
              />
            </div>
          ) : (
            <div className="relative w-full md:w-1/3 h-64 md:h-auto bg-gray-200 flex items-center justify-center">
              <Server className="h-24 w-24 text-gray-400" />
            </div>
          )}
          
          {/* Basic Info (Right side) */}
          <div className="flex-1 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
              <h1 className="text-2xl font-bold mr-2">{device.name}</h1>
              <div className="flex gap-2">
                <Badge className={device.is_online ? "bg-green-500" : "bg-red-500"}>
                  {device.is_online ? "Çevrimiçi" : "Çevrimdışı"}
                </Badge>
                {device.firmware_version && (
                  <Badge variant="outline" className="border-blue-300">
                    Firmware v{device.firmware_version}
                  </Badge>
                )}
              </div>
            </div>
            
            <p className="text-gray-500 mb-4">Seri No: {device.serial_number}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Model</p>
                <p className="font-medium">{device.device_models?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tip</p>
                <p className="font-medium">{device.device_models?.device_types?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Kategori</p>
                <p className="font-medium">{device.device_models?.device_categories?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Firmware</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{device.firmware_version || 'N/A'}</p>
                  {device.is_online && !isUpdatingFirmware && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 px-2 text-xs"
                      onClick={handleStartFirmwareUpdate}
                    >
                      <DownloadCloud className="h-3 w-3 mr-1" /> Güncelle
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Son Bağlantı</p>
                <p className="font-medium">{formatDate(device.last_connection_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Oluşturulma</p>
                <p className="font-medium">{formatDate(device.created_at)}</p>
              </div>
            </div>
            
            {isUpdatingFirmware && (
              <div className="mt-4">
                <div className="flex justify-between mb-1">
                  <p className="text-sm font-medium">Firmware Güncelleniyor...</p>
                  <p className="text-sm">{firmwareProgress}%</p>
                </div>
                <Progress value={firmwareProgress} className="h-2" />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Offline warning */}
      {!device.is_online && (
        <Card className="mb-6 bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-100">
                <WifiOff className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-red-700">Cihaz Çevrimdışı</h3>
                <p className="text-red-600">
                  Bu cihaz şu anda çevrimdışı. Cihaz yeniden bağlanana kadar bazı özellikler kullanılamayabilir.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions Panel */}
      {device.is_online && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Hızlı İşlemler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col" 
                onClick={handleRestartDevice}
                disabled={!device.is_online || isRestarting}
              >
                <RefreshCw className={`h-6 w-6 mb-2 ${isRestarting ? 'animate-spin' : ''}`} />
                <span>Yeniden Başlat</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col"
                onClick={handleStartFirmwareUpdate}
                disabled={isUpdatingFirmware}
              >
                <DownloadCloud className="h-6 w-6 mb-2" />
                <span>Firmware Güncelle</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col">
                <Terminal className="h-6 w-6 mb-2" />
                <span>Tanılama Çalıştır</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col">
                <Shield className="h-6 w-6 mb-2" />
                <span>Güvenlik Denetimi</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for detailed information */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-6">
          <TabsTrigger value="overview">
            <Info className="mr-2 h-4 w-4" /> Genel Bakış
          </TabsTrigger>
          <TabsTrigger value="metrics">
            <Zap className="mr-2 h-4 w-4" /> Metrikler
          </TabsTrigger>
          <TabsTrigger value="specifications">
            <Server className="mr-2 h-4 w-4" /> Özellikler
          </TabsTrigger>
          <TabsTrigger value="maintenance">
            <Activity className="mr-2 h-4 w-4" /> Bakım
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" /> Ayarlar
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cihaz Durumu</CardTitle>
              <CardDescription>Mevcut operasyonel durum</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-slate-100 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Durum</p>
                  <div className="flex items-center">
                    <div className={`h-3 w-3 rounded-full mr-2 ${device.is_online ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <p className="font-medium">{device.is_online ? 'Çevrimiçi' : 'Çevrimdışı'}</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-100 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Çalışma Süresi</p>
                  <p className="font-medium">{calculateUptime}</p>
                </div>
                <div className="p-4 bg-slate-100 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Son İletişim</p>
                  <p className="font-medium">{formatDate(device.last_connection_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Health Card */}
          <Card>
            <CardHeader>
              <CardTitle>Sistem Sağlığı</CardTitle>
              <CardDescription>Temel performans göstergeleri</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {device.is_online ? (
                  <>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Bellek Kullanımı</span>
                        <span className="text-sm">{device.metadata?.memory_usage || '25'}%</span>
                      </div>
                      <Progress value={device.metadata?.memory_usage || 25} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">CPU Yükü</span>
                        <span className="text-sm">{device.metadata?.cpu_load || '40'}%</span>
                      </div>
                      <Progress value={device.metadata?.cpu_load || 40} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Depolama</span>
                        <span className="text-sm">{device.metadata?.storage_usage || '60'}%</span>
                      </div>
                      <Progress value={device.metadata?.storage_usage || 60} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Ağ Sinyali</span>
                        <span className="text-sm">{device.metadata?.network_signal || 'İyi'}</span>
                      </div>
                      <Progress value={device.metadata?.network_signal_strength || 75} className="h-2" />
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <WifiOff className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">Cihaz çevrimdışı olduğu için sağlık verileri kullanılamıyor</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {device.device_models && (
            <Card>
              <CardHeader>
                <CardTitle>Model Detayları</CardTitle>
                <CardDescription>Bu cihaz modeli hakkında bilgiler</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Model Adı</p>
                    <p className="font-medium">{device.device_models.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Kategori</p>
                    <p className="font-medium">{device.device_models.device_categories?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tip</p>
                    <p className="font-medium">{device.device_models.device_types?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Özellikler</p>
                    <p className="font-medium">
                      {device.device_models.specifications ? 'Mevcut' : 'Belirtilmemiş'}
                    </p>
                  </div>
                </div>

                {device.device_models.description && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-1">Açıklama</p>
                    <p>{device.device_models.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {device.user_devices && device.user_devices.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Kullanıcı Erişimi</CardTitle>
                  <CardDescription>Bu cihaza erişimi olan kullanıcılar</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setIsSharingDialogOpen(true)}
                  size="sm"
                >
                  <Share2 className="mr-2 h-4 w-4" /> Paylaş
                </Button>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {device.user_devices.map((userDevice, index) => (
                    <div key={index} className="py-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium">
                          {userDevice.user?.first_name || ''} {userDevice.user?.last_name || ''}
                        </p>
                        <p className="text-sm text-gray-500">{userDevice.user?.email || ''}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {userDevice.is_primary_owner ? (
                          <Badge className="bg-blue-500">Ana Sahip</Badge>
                        ) : (
                          <Badge variant="outline">Kullanıcı</Badge>
                        )}
                        {!userDevice.is_primary_owner && (
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cihaz Metrikleri</CardTitle>
              <CardDescription>Sensör verileri ve performans metrikleri</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingMetrics ? (
                <LoadingSection text="Metrikler yükleniyor..." />
              ) : (
                <EnhancedMetricsViewer 
                  metrics={metrics} 
                  nodes={device.device_nodes || []} 
                  deviceId={id} 
                />
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={fetchMetrics}>
                <RefreshCw className="mr-2 h-4 w-4" /> Verileri Yenile
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Uyarı Yapılandırması</CardTitle>
              <CardDescription>Bildirim eşiklerini yapılandırın</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-medium">Sıcaklık Uyarısı</h4>
                    <p className="text-sm text-gray-500">Sıcaklık 30°C'nin üzerine çıktığında uyar</p>
                  </div>
                  <div className="relative inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-gray-200 transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-500">
                    <span className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform translate-x-5`}></span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-medium">Bağlantı Uyarısı</h4>
                    <p className="text-sm text-gray-500">Cihaz çevrimdışı olduğunda uyar</p>
                  </div>
                  <div className="relative inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-gray-200 transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-500">
                    <span className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform translate-x-5`}></span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-medium">Depolama Uyarısı</h4>
                    <p className="text-sm text-gray-500">Depolama kullanımı %80'i aştığında uyar</p>
                  </div>
                  <div className="relative inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-gray-200 transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-500">
                    <span className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform translate-x-0`}></span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-medium">Performans Uyarısı</h4>
                    <p className="text-sm text-gray-500">CPU kullanımı sürekli yüksek olduğunda uyar</p>
                  </div>
                  <div className="relative inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-gray-200 transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-500">
                    <span className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform translate-x-0`}></span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button disabled={!device.is_online}>Uyarı Ayarlarını Kaydet</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Specifications Tab */}
        <TabsContent value="specifications" className="space-y-4">
          {device.device_models?.specifications ? (
            <Card>
              <CardHeader>
                <CardTitle>Teknik Özellikler</CardTitle>
                <CardDescription>Bu cihaz hakkında detaylı teknik bilgiler</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-slate-50 p-4 rounded-md overflow-auto max-h-96 text-sm">
                  {JSON.stringify(device.device_models.specifications, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Teknik Özellikler</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Bu cihaz için teknik özellik verisi mevcut değil.</p>
              </CardContent>
            </Card>
          )}

          {device.device_nodes && device.device_nodes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Cihaz Düğümleri</CardTitle>
                <CardDescription>Bağlı düğümler ve modüller</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {device.device_nodes.map((node, index) => (
                    <div key={index} className="border rounded-md p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                      <p className="font-medium">{node.name || `Düğüm ${index + 1}`}</p>
                      <p className="text-sm text-gray-500 mb-2">ID: {node.id.substring(0, 8)}...</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-500">Tip</p>
                          <p>{node.node_type || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Durum</p>
                          <div className="flex items-center">
                            <div className={`h-2 w-2 rounded-full mr-1 ${node.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <p>{node.is_active ? 'Aktif' : 'Pasif'}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-500">Son Kalibrasyon</p>
                          <p>{node.calibration_date ? new Date(node.calibration_date).toLocaleDateString() : 'Hiç'}</p>
                        </div>
                      </div>
                      {device.is_online && node.is_active && (
                        <div className="mt-3 pt-3 border-t">
                          <Button size="sm" variant="outline" className="w-full">
                            <Terminal className="mr-2 h-3 w-3" /> Düğümü Test Et
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {device.device_structure && device.device_structure.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Cihaz Yapısı</CardTitle>
                <CardDescription>Fiziksel düzen yapılandırması</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {device.device_structure.map((structure, index) => (
                    <div key={index} className="border rounded-md p-4 hover:shadow-sm transition-shadow">
                      <p className="font-medium">{structure.shelf_id ? `Raf ${structure.shelf_id}` : `Bileşen ${index + 1}`}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                        <div>
                          <p className="text-gray-500">Raf ID</p>
                          <p>{structure.shelf_id}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Durum</p>
                          <p>{structure.is_active ? 'Aktif' : 'Pasif'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Tepsi Sayısı</p>
                          <p>{structure.tray_count}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Pod Sayısı</p>
                          <p>{structure.pod_count}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Tepsi Tipi</p>
                          <p>{structure.tray_type || 'Standart'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bakım Geçmişi</CardTitle>
              <CardDescription>Bu cihaz için tüm bakım ve servis kayıtları</CardDescription>
            </CardHeader>
            <CardContent>
              <MaintenanceLog records={maintenanceRecords} />
            </CardContent>
            <CardFooter>
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" /> Bakım Raporu İndir
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Periyodik Bakım</CardTitle>
              <CardDescription>Planlanmış bakım görevleri</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-medium">Aylık Sistem Kontrolü</h4>
                    <p className="text-sm text-gray-500">Her ayın ilk günü otomatik tanılama çalıştır</p>
                  </div>
                  <div className="relative inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-gray-200 transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-500">
                    <span className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform translate-x-5`}></span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-medium">Üç Aylık Yazılım Güncellemesi</h4>
                    <p className="text-sm text-gray-500">Üç ayda bir en son yazılım güncellemelerini kontrol et</p>
                  </div>
                  <div className="relative inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-gray-200 transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-500">
                    <span className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform translate-x-5`}></span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-medium">Yıllık Donanım Bakımı</h4>
                    <p className="text-sm text-gray-500">Yılda bir kez donanım bakımı için hatırlatma gönder</p>
                  </div>
                  <div className="relative inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-gray-200 transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-500">
                    <span className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform translate-x-0`}></span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Bakım Programını Kaydet</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cihaz Ayarları</CardTitle>
              <CardDescription>Cihaz ayarlarını yapılandırın</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Güç Yönetimi</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h4 className="text-sm">Düşük Güç Modu</h4>
                        <p className="text-xs text-gray-500">Boştayken güç tüketimini azalt</p>
                      </div>
                      <div className="relative inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-gray-200 transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-500">
                        <span className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform translate-x-0`}></span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h4 className="text-sm">Planlı Yeniden Başlatma</h4>
                        <p className="text-xs text-gray-500">Cihazı otomatik olarak haftalık yeniden başlat</p>
                      </div>
                      <div className="relative inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-gray-200 transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-500">
                        <span className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform translate-x-0`}></span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Bağlantı</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h4 className="text-sm">Bulut Senkronizasyonu</h4>
                        <p className="text-xs text-gray-500">Verileri bulut sunucularıyla senkronize et</p>
                      </div>
                      <div className="relative inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-gray-200 transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-500">
                        <span className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform translate-x-5`}></span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h4 className="text-sm">Uzaktan Erişim</h4>
                        <p className="text-xs text-gray-500">Cihazın uzaktan kontrolüne izin ver</p>
                      </div>
                      <div className="relative inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-gray-200 transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-500">
                        <span className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform translate-x-5`}></span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Veri Yönetimi</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h4 className="text-sm">Veri Günlüğü</h4>
                        <p className="text-xs text-gray-500">Detaylı etkinlik günlüklerini kaydet</p>
                      </div>
                      <div className="relative inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-gray-200 transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-500">
                        <span className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform translate-x-0`}></span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h4 className="text-sm">Performans Metrikleri</h4>
                        <p className="text-xs text-gray-500">Detaylı performans verilerini topla</p>
                      </div>
                      <div className="relative inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-gray-200 transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-500">
                        <span className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform translate-x-5`}></span>
                      </div>
                    </div>
                  </div>
                </div>

                {device.metadata && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Gelişmiş Ayarlar</h3>
                    <pre className="bg-slate-50 p-4 rounded-md overflow-auto max-h-60 text-sm">
                      {JSON.stringify(device.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button disabled={!device.is_online}>Ayarları Kaydet</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Tehlikeli Bölge</CardTitle>
              <CardDescription>Bu cihaz için yıkıcı eylemler</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-4 border border-red-200 rounded-md">
                <div>
                  <p className="font-medium">Cihazı Sil</p>
                  <p className="text-sm text-gray-500">Bu işlem geri alınamaz</p>
                </div>
                <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                  Sil
                </Button>
              </div>
              
              <div className="flex justify-between items-center p-4 border rounded-md">
                <div>
                  <p className="font-medium">Fabrika Ayarlarına Sıfırla</p>
                  <p className="text-sm text-gray-500">Cihazı fabrika ayarlarına sıfırla</p>
                </div>
                <Button variant="outline" disabled={!device.is_online}>Sıfırla</Button>
              </div>
              
              <div className="flex justify-between items-center p-4 border rounded-md">
                <div>
                  <p className="font-medium">Hata Ayıklama Modu</p>
                  <p className="text-sm text-gray-500">Gelişmiş hata ayıklamayı etkinleştir</p>
                </div>
                <Button variant="outline" disabled={!device.is_online}>Etkinleştir</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Device Form Dialog */}
      <DeviceForm
        open={isEditing}
        onClose={() => setIsEditing(false)}
        onSuccess={handleEditSuccess}
        initialDevice={device}
      />

      {/* Firmware Update Modal */}
      <FirmwareUpdateModal
        open={isUpdatingFirmware}
        onClose={() => setIsUpdatingFirmware(false)}
        progress={firmwareProgress}
        deviceId={id}
      />

      {/* Share Device Modal */}
      <DeviceShareModal
        open={isSharingDialogOpen}
        onClose={() => setIsSharingDialogOpen(false)}
        onShare={handleShareDevice}
        deviceId={id}
        deviceName={device.name}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bu cihazı silmek istediğinizden emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Bu, cihazı kalıcı olarak silecek
              ve tüm ilişkili verileri kaldıracaktır.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
