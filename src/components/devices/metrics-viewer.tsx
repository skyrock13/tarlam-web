import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RefreshCw, Download, Calendar, Zap, Filter, Droplet, Thermometer, Activity, Droplets, Info, ChevronRight } from 'lucide-react';
import _ from 'lodash';

// TypeScript için tip tanımlamaları
interface DeviceSpecifications {
  dimensions?: {
    depth: number;
    width: number;
    height: number;
  };
  light_type?: string;
  tank_capacity?: string | number;
  [key: string]: any;
}

interface DeviceMetadata {
  device_type?: string;
  os_info?: {
    platform?: string;
    release?: string;
    type?: string;
    arch?: string;
  };
  hw_info?: {
    model?: string;
    cpus?: number;
    total_mem?: number;
  };
  ip_address?: string;
  MAC_address?: string;
  device_structure?: {
    tank_capacity?: string | number;
    [key: string]: any;
  };
  specifications?: DeviceSpecifications;
  tank_capacity?: string | number;
  [key: string]: any;
}

interface DeviceInfo {
  id: string;
  name: string;
  serial_number?: string;
  model_id?: string;
  firmware_version?: string;
  is_online?: boolean;
  last_connection_at?: string;
  metadata?: DeviceMetadata;
  specifications?: DeviceSpecifications;
  created_at?: string;
  updated_at?: string;
}

interface DeviceNode {
  id: string;
  device_id: string;
  name: string;
  node_type: string;
  is_active?: boolean;
  calibration_date?: string;
  metadata?: any;
  created_at?: string;
  updated_at?: string;
}

interface DeviceMetric {
  id: string;
  device_id: string;
  node_id: string;
  metric_type: string;
  value: number;
  unit?: string;
  quality?: number;
  created_at?: string;
}

interface TarlamMetricsViewerProps {
  metrics: DeviceMetric[];
  nodes: DeviceNode[];
  deviceId: string;
  deviceInfo?: DeviceInfo;
  onRefresh: () => void;
}

// Sabit veri ve fonksiyonlar
const NODE_TYPE_TO_SENSORS: Record<string, string[]> = {
  'temperature': ['temperature', 'humidity'],
  'ec': ['ec'],
  'ph': ['ph'],
  'water_temperature': ['water_temperature', 'water_level'],
  'water_flow': ['water_flow'],
  'light': ['light']
};

const SENSOR_TO_NODE_TYPE: Record<string, string> = {
  'temperature': 'temperature',
  'humidity': 'temperature',
  'ec': 'ec',
  'ph': 'ph',
  'water_temperature': 'water_temperature',
  'water_level': 'water_temperature', 
  'water_flow': 'water_flow',
  'light': 'light'
};

const UNIT_MAP: Record<string, string> = {
  'temperature': '°C',
  'water_temperature': '°C',
  'humidity': '%',
  'light': '%',
  'water_level': '%',
  'ec': 'μS/cm',
  'ph': '',
  'water_flow': 'L/min'
};

const COLOR_MAP: Record<string, string> = {
  'temperature': '#FF7300',     // Turuncu
  'humidity': '#9966FF',        // Mor
  'ec': '#0088FE',              // Mavi
  'ph': '#00C49F',              // Yeşil
  'water_temperature': '#FF6B6B', // Kırmızı
  'water_level': '#4F93FF',     // Mavi
  'water_flow': '#FF9800',      // Amber
  'light': '#FFD700'            // Altın
};

const NAME_MAP: Record<string, string> = {
  'temperature': 'Sıcaklık',
  'humidity': 'Nem',
  'ec': 'EC',
  'ph': 'pH',
  'water_temperature': 'Su Sıcaklığı',
  'water_flow': 'Su Akışı',
  'water_level': 'Su Seviyesi',
  'light': 'Işık'
};

// Tarih biçimlendirme fonksiyonu
const formatDate = (dateStr: string | number | Date, includeTime = true): string => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = includeTime
    ? { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }
    : { year: 'numeric', month: '2-digit', day: '2-digit' };
  return date.toLocaleString(undefined, options);
};

// Sensör tipine göre ikon getir
const getSensorIcon = (sensorType: string, size = 16, color: string | null = null) => {
  const iconColor = color || COLOR_MAP[sensorType] || '#666';
  
  switch(sensorType) {
    case 'temperature':
      return <Thermometer size={size} color={iconColor} />;
    case 'humidity':
      return <Droplet size={size} color={iconColor} />;
    case 'water_temperature':
      return <Thermometer size={size} color={iconColor} />;
    case 'water_level':
      return <Droplet size={size} color={iconColor} fill={iconColor} />;
    case 'water_flow':
      return <Activity size={size} color={iconColor} />;
    case 'ec':
      return <Droplets size={size} color={iconColor} />;
    case 'ph':
      return <Droplets size={size} color={iconColor} />;
    case 'light':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      );
    default:
      return <Info size={size} color={iconColor} />;
  }
};

// Mini grafik oluşturma
const generateMiniChart = (data: number[], color: string) => {
  if (!data || data.length < 2) return null;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const width = 100;
  const height = 40;
  const padding = 5;
  
  // Noktaları oluştur
  let points = data.map((value, index) => {
    const x = padding + (index * (width - 2 * padding) / (data.length - 1));
    const y = height - padding - ((value - min) / range * (height - 2 * padding));
    return `${x},${y}`;
  });
  
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="absolute bottom-0 left-0 opacity-60">
      <defs>
        <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.6" />
          <stop offset="100%" stopColor={color} stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <path
        d={`M${padding},${height - padding} ${points.join(' ')} L${width - padding},${height - padding} Z`}
        fill={`url(#gradient-${color.replace('#', '')})`}
        stroke={color}
        strokeWidth="2"
      />
    </svg>
  );
};

// Tip tanımıyla birlikte bileşen
const TarlamMetricsViewer: React.FC<TarlamMetricsViewerProps> = ({ 
  metrics, 
  nodes, 
  deviceId, 
  deviceInfo, 
  onRefresh 
}) => {
  // State
  const [timeRange, setTimeRange] = useState('1h');
  const [activeTab, setActiveTab] = useState('overview');
  const [activeMetric, setActiveMetric] = useState('all');
  const [activeNodes, setActiveNodes] = useState<string[]>([]);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [lastUpdated] = useState(new Date());

  // Başlangıçta tüm aktif node'ları seç
  useEffect(() => {
    if (nodes && nodes.length > 0) {
      const initialActiveNodes = nodes
        .filter(node => node.is_active !== false)
        .map(node => node.id);
      setActiveNodes(initialActiveNodes);
    }
  }, [nodes]);

  // Node seçimini değiştir
  const toggleNodeSelection = (nodeId: string) => {
    setActiveNodes(prev =>
      prev.includes(nodeId)
        ? prev.filter(id => id !== nodeId)
        : [...prev, nodeId]
    );
  };

  // Zaman aralığına göre metrik filtrele
  const filteredMetrics = useMemo(() => {
    if (!metrics || !metrics.length) return [];

    const now = new Date();
    let cutoffDate = new Date();

    switch (timeRange) {
      case '1h':
        cutoffDate.setHours(now.getHours() - 1);
        break;
      case '6h':
        cutoffDate.setHours(now.getHours() - 6);
        break;
      case '12h':
        cutoffDate.setHours(now.getHours() - 12);
        break;
      case '24h':
        cutoffDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case 'all':
      default:
        return metrics.filter(metric =>
          activeNodes.includes(metric.node_id) &&
          (activeMetric === 'all' || metric.metric_type === activeMetric)
        );
    }

    return metrics.filter(metric =>
      new Date(metric.created_at || '') >= cutoffDate &&
      activeNodes.includes(metric.node_id) &&
      (activeMetric === 'all' || metric.metric_type === activeMetric)
    );
  }, [metrics, timeRange, activeNodes, activeMetric]);

  // ProcessedNodeData tipini tanımla
  interface ProcessedNodeData {
    [nodeId: string]: {
      id: string;
      nodeData: {
        [metricType: string]: Array<{
          timestamp: string;
          value: number;
          unit: string;
          quality: number;
        }>;
      };
    };
  }

  // Veriyi node ve metrik tipine göre grupla
  const processedData = useMemo<ProcessedNodeData>(() => {
    if (!filteredMetrics.length) return {};

    const nodeDataMap: ProcessedNodeData = {};

    filteredMetrics.forEach(item => {
      const nodeId = item.node_id;
      const metricType = item.metric_type;

      if (!nodeDataMap[nodeId]) {
        nodeDataMap[nodeId] = {
          id: nodeId,
          nodeData: {}
        };
      }

      if (!nodeDataMap[nodeId].nodeData[metricType]) {
        nodeDataMap[nodeId].nodeData[metricType] = [];
      }

      nodeDataMap[nodeId].nodeData[metricType].push({
        timestamp: item.created_at || new Date().toISOString(),
        value: item.value,
        unit: item.unit || UNIT_MAP[metricType] || '',
        quality: item.quality || 100
      });
    });

    return nodeDataMap;
  }, [filteredMetrics]);

  // Grafik veri noktası tipini tanımla
  interface ChartDataPoint {
    timestamp: string;
    formattedTime: string;
    [key: string]: any;
  }

  // Grafik için veri hazırla
  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (!filteredMetrics.length) return [];

    const data: ChartDataPoint[] = [];

    // Benzersiz zaman damgalarını al
    const allTimestamps = _.uniqBy(
      filteredMetrics.map(item => ({
        timestamp: item.created_at || '',
        formatted: new Date(item.created_at || '').toISOString()
      })),
      'formatted'
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Her zaman damgası için veri oluştur
    allTimestamps.forEach(({ timestamp }) => {
      const date = new Date(timestamp);
      const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const includeDate = timeRange === '7d' || timeRange === '30d' || timeRange === 'all';
      const formattedDateTime = includeDate
        ? `${date.toLocaleDateString()} ${formattedTime}`
        : formattedTime;

      const dataPoint: ChartDataPoint = {
        timestamp,
        formattedTime: formattedDateTime
      };

      // Her aktif node için veri ekle
      activeNodes.forEach(nodeId => {
        if (!processedData[nodeId]) return;
        
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;
        
        // Bu node'a ait sensör tipleri
        const nodeType = node.node_type;
        const sensorTypes = NODE_TYPE_TO_SENSORS[nodeType] || [];
        
        // Node'a ait her sensör tipi için değerleri ekle
        sensorTypes.forEach(sensorType => {
          // Aktif metrik filtresine uygunsa ekle
          if (activeMetric !== 'all' && sensorType !== activeMetric) return;
          
          // Bu node için bu metrik tipi verileri var mı?
          if (!processedData[nodeId].nodeData[sensorType]) return;
          
          // Bu zaman damgası için bir ölçüm bul
          const measurement = processedData[nodeId].nodeData[sensorType].find(
            m => m.timestamp === timestamp
          );
          
          if (measurement) {
            // Benzersiz bir anahtarla veriyi ekle
            const dataKey = `${sensorType}_${node.name.substring(0, 8)}_${nodeId.substring(0, 4)}`;
            dataPoint[dataKey] = measurement.value;
          }
        });
      });

      data.push(dataPoint);
    });

    return data;
  }, [filteredMetrics, processedData, nodes, timeRange, activeNodes, activeMetric]);

  // Tablo verisi
  const tableData = useMemo(() => {
    return filteredMetrics;
  }, [filteredMetrics]);

  // SummaryDataItem tipini tanımla
  interface SummaryDataItem {
    value: number;
    unit: string;
    trend: number[];
  }

  // Özet verileri hazırla - sensör tipine göre grupla
  const summaryData = useMemo<Record<string, SummaryDataItem>>(() => {
    if (!metrics || !metrics.length) return {};
    
    const result: Record<string, SummaryDataItem> = {};
    
    // Mevcut tüm sensör tiplerini bul
    const sensorTypes = _.uniq(metrics.map(m => m.metric_type));
    
    sensorTypes.forEach(sensorType => {
      // Bu sensör tipine ait tüm ölçümleri al
      const metricsOfType = metrics.filter(m => m.metric_type === sensorType);
      if (!metricsOfType.length) return;
      
      // Node'a göre grupla
      const nodeGroups = _.groupBy(metricsOfType, 'node_id');
      
      // Her node için en son ölçümü al
      const latestByNode = Object.entries(nodeGroups).map(([nodeId, nodeMetrics]) => {
        const sortedMetrics = _.sortBy(nodeMetrics, m => new Date(m.created_at || '').getTime()).reverse();
        return sortedMetrics[0]; // En son ölçüm
      });
      
      // Ortalama değeri hesapla
      const avgValue = _.meanBy(latestByNode, 'value');
      
      // Trend verisi (son 7 ölçüm)
      let trendData: number[] = [];
      if (latestByNode.length > 0) {
        // En çok ölçüme sahip node'u bul
        const nodeWithMostReadings = Object.entries(nodeGroups)
          .reduce((max, [nodeId, readings]) => 
            readings.length > max.length ? {nodeId, length: readings.length} : max, 
            {nodeId: null as string | null, length: 0}
          );
        
        if (nodeWithMostReadings.nodeId) {
          const nodeTrendData = nodeGroups[nodeWithMostReadings.nodeId]
            .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
            .slice(0, 7)
            .reverse()
            .map(m => m.value);
          
          trendData = nodeTrendData;
        }
      }
      
      result[sensorType] = {
        value: avgValue,
        unit: latestByNode[0]?.unit || UNIT_MAP[sensorType] || '',
        trend: trendData
      };
    });
    
    return result;
  }, [metrics]);

  // Verileri indir
  const handleDownload = () => {
    const headers = "id,device_id,node_id,created_at,created_at_local,metric_type,value,unit,quality\n";
    const csvContent = headers + tableData.map(row =>
      `${row.id},${row.device_id},${row.node_id},${row.created_at},${formatDate(row.created_at || '')},${row.metric_type},${row.value},${row.unit || UNIT_MAP[row.metric_type] || ''},${row.quality || 100}`
    ).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `device_${deviceId}_metrics_${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Kullanılabilir sensör tipleri
  const availableSensorTypes = useMemo(() => {
    if (!metrics || !metrics.length) return [];
    return _.uniq(metrics.map(m => m.metric_type));
  }, [metrics]);

  // Veri yok mesajı
  const NoDataMessage = () => (
    <div className="text-center py-10">
      <p className="text-gray-500">Bu zaman aralığı için veri bulunamadı.</p>
      <Button variant="outline" className="mt-4" onClick={onRefresh}>
        <RefreshCw className="mr-2 h-4 w-4" /> Verileri Yenile
      </Button>
    </div>
  );

  // Cihaz katmanı bilgisi
  const getDeviceLayerInfo = () => {
    if (!deviceInfo?.metadata?.device_structure) {
      return { layer: "1", totalLayers: "4" };
    }

    const structure = deviceInfo.metadata.device_structure;
    return {
      layer: structure.shelf_id || "1",
      totalLayers: structure.tray_count || "4"
    };
  };
  
  // Tank kapasitesi hesaplama - BİLEŞEN İÇİNDE TANIMLANMIŞ
  const getTankCapacity = (): number => {
    // 1. Doğrudan metadata içinde tank_capacity varsa onu kullan
    if (deviceInfo?.metadata?.tank_capacity) {
      return Number(deviceInfo.metadata.tank_capacity);
    }
    
    // 2. device_structure içinde tanımlanmışsa
    if (deviceInfo?.metadata?.device_structure?.tank_capacity) {
      return Number(deviceInfo.metadata.device_structure.tank_capacity);
    }
    
    // 3. Specifications içinde tank_capacity'yi kontrol et
    if (deviceInfo?.metadata?.specifications?.tank_capacity) {
      return Number(deviceInfo.metadata.specifications.tank_capacity);
    }
    
    // 4. Model specifications içinde tank_capacity varsa (Supabase tablosundaki device_models)
    if (deviceInfo?.specifications?.tank_capacity) {
      return Number(deviceInfo.specifications.tank_capacity);
    }
    
    // 5. Model ID'den çıkarsama yap
    if (deviceInfo?.model_id) {
      // "4 Katlı Model" gibi bir string'den kat sayısını bul
      const modelMatch = deviceInfo.model_id.match(/(\d+)\s*Katlı/i);
      if (modelMatch) {
        const layers = parseInt(modelMatch[1]) || 4;
        // Kat başına yaklaşık 40 litre su kapasitesi varsay
        return layers * 40;
      }
    }
    
    // 6. Varsayılan değer
    return 150; // Litre
  };

  const layerInfo = getDeviceLayerInfo();

  return (
    <div className="space-y-4">
      {/* Cihaz bilgisi başlığı */}
      {deviceInfo && (
        <Card className="bg-white shadow-sm border">
          <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between">
            <div className="flex items-center">
              <div className="bg-slate-100 rounded-md p-2 mr-3">
                <div className="w-12 h-12 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none">
                    <rect width="20" height="20" x="2" y="2" rx="2" />
                    <rect width="8" height="8" x="4" y="4" rx="1" />
                    <rect width="8" height="8" x="12" y="4" rx="1" />
                    <rect width="8" height="8" x="4" y="12" rx="1" />
                    <rect width="8" height="8" x="12" y="12" rx="1" />
                  </svg>
                </div>
              </div>
              <div>
                <h2 className="font-medium text-gray-800">{deviceInfo.name}</h2>
                <p className="text-xs text-gray-500">Seri No: {deviceInfo.serial_number || 'N/A'}</p>
                <p className="text-xs text-gray-500">{deviceInfo.model_id || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center mt-3 md:mt-0">
              <Badge className={`${deviceInfo.is_online ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} font-medium px-3 py-1`}>
                {deviceInfo.is_online ? '• Aktif' : '• Pasif'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Araç çubuğu */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-2">
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value)}>
            <SelectTrigger className="w-full md:w-36">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Zaman Aralığı" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Son 1 Saat</SelectItem>
              <SelectItem value="6h">Son 6 Saat</SelectItem>
              <SelectItem value="12h">Son 12 Saat</SelectItem>
              <SelectItem value="24h">Son 24 Saat</SelectItem>
              <SelectItem value="7d">Son 7 Gün</SelectItem>
              <SelectItem value="30d">Son 30 Gün</SelectItem>
              <SelectItem value="all">Tüm Veriler</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className={isFilterExpanded ? "border-blue-300 bg-blue-50" : ""}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filtreler
            {isFilterExpanded ?
              <span className="ml-1 text-xs bg-blue-100 text-blue-800 rounded-full px-2">{activeNodes.length}</span> :
              <span className="ml-1 text-xs bg-gray-100 rounded-full px-2">{activeNodes.length}</span>
            }
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onRefresh} className="whitespace-nowrap">
            <RefreshCw className="mr-2 h-4 w-4" />
            Verileri Yenile
          </Button>
          <Button variant="outline" onClick={handleDownload} disabled={!tableData.length} className="whitespace-nowrap">
            <Download className="mr-2 h-4 w-4" />
            İndir
          </Button>
        </div>
      </div>

      {/* Node filtre paneli */}
      {isFilterExpanded && (
        <Card className="mb-4 border-blue-200">
          <CardContent className="py-4 px-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Düğüm Filtreleri</h3>
            <div className="flex flex-wrap gap-2">
              {nodes.map(node => (
                <Badge
                  key={node.id}
                  variant={activeNodes.includes(node.id) ? "default" : "outline"}
                  className={`cursor-pointer ${activeNodes.includes(node.id) ? "bg-blue-500" : "hover:bg-blue-100"}`}
                  onClick={() => toggleNodeSelection(node.id)}
                >
                  {node.name}
                  {activeNodes.includes(node.id) && <span className="ml-1">✓</span>}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sekmeler */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="overview">
            <Droplet className="mr-2 h-4 w-4" /> Genel Bakış
          </TabsTrigger>
          <TabsTrigger value="chart">
            <Zap className="mr-2 h-4 w-4" /> Grafik Görünümü
          </TabsTrigger>
          <TabsTrigger value="table">
            <Filter className="mr-2 h-4 w-4" /> Tablo Görünümü
          </TabsTrigger>
        </TabsList>

        {/* Genel Bakış Sekmesi */}
        <TabsContent value="overview">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Genel Veriler</h3>
              <span className="text-xs text-gray-400">Son Güncelleme: {formatDate(lastUpdated)}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Temel metrikler (pH, EC, sıcaklık) */}
              {['ph', 'ec', 'temperature'].map(sensorType => {
                if (!summaryData[sensorType]) return null;
                
                return (
                <Card key={sensorType} className="relative overflow-hidden bg-white shadow-sm border">
                  <CardContent className="p-3 h-28">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">{NAME_MAP[sensorType] || sensorType}</span>
                      <Badge className="bg-gray-100 text-gray-500 rounded-full w-4 h-4 p-0 flex items-center justify-center text-xs font-normal">
                        i
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold text-gray-800 mt-1">
                      {typeof summaryData[sensorType].value === 'number' ? summaryData[sensorType].value.toFixed(1) : summaryData[sensorType].value}
                      {summaryData[sensorType].unit}
                    </div>
                    <div className="text-xs text-gray-500">/günlük</div>
                    {summaryData[sensorType].trend && summaryData[sensorType].trend.length > 1 && 
                      generateMiniChart(summaryData[sensorType].trend, COLOR_MAP[sensorType])}
                    <ChevronRight className="absolute top-3 right-2 h-4 w-4 text-gray-400" />
                  </CardContent>
                </Card>
              )})}
            </div>
          </div>

          {/* Su Seviyesi Kartı */}
          {summaryData.water_level && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">Sensör Veriler</h3>
                <span className="text-xs text-gray-400">Son Güncelleme: {formatDate(lastUpdated)}</span>
              </div>

              <Card className="mb-3 bg-white shadow-sm border">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-gray-700">Su Seviyesi</span>
                      <Badge className="bg-gray-100 text-gray-500 rounded-full w-4 h-4 p-0 flex items-center justify-center text-xs font-normal">i</Badge>
                    </div>
                    <div className="text-xl font-bold text-gray-800">
                      &gt;{summaryData.water_level.value.toFixed(0)}%
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                  
                  <div className="relative h-48 flex items-center justify-center">
                    <div className="relative w-40 h-40">
                      <div className="absolute inset-0 rounded-full border-8 border-gray-100"></div>
                      <div 
                        className="absolute inset-0 rounded-full border-8 border-transparent"
                        style={{
                          clipPath: `polygon(50% 50%, 0 0, 0 50%, 0 100%, ${summaryData.water_level.value}% 100%)`,
                          borderLeftColor: '#4F93FF',
                          borderBottomColor: '#4F93FF',
                          transform: 'rotate(-90deg)',
                        }}
                      ></div>
                      {/* Su seviyesi kapasiteye göre renklendirme */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div 
                          className={`w-20 h-20 rounded-full flex items-center justify-center ${
                            summaryData.water_level.value < 20 ? 'bg-red-100' : 
                            summaryData.water_level.value < 40 ? 'bg-yellow-100' : 'bg-blue-100'
                          }`}
                        >
                          <div className={`${
                            summaryData.water_level.value < 20 ? 'text-red-500' : 
                            summaryData.water_level.value < 40 ? 'text-yellow-500' : 'text-blue-500'
                          }`}>
                            <Droplet 
                              size={24} 
                              fill={summaryData.water_level.value < 20 ? '#EF4444' : 
                                  summaryData.water_level.value < 40 ? '#F59E0B' : '#4F93FF'} 
                              color={summaryData.water_level.value < 20 ? '#EF4444' : 
                                  summaryData.water_level.value < 40 ? '#F59E0B' : '#4F93FF'} 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-sm font-medium mt-4 ${
                      summaryData.water_level.value < 20 ? 'text-red-600' : 
                      summaryData.water_level.value < 40 ? 'text-yellow-600' : 'text-gray-700'
                    }`}>
                      {summaryData.water_level.value < 20 ? 'Kritik Seviye!' : 
                       summaryData.water_level.value < 40 ? 'Düşük Seviye' : 'Normal Seviye'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {(() => {
                        // Hesaplanmış tank kapasitesini al
                        const tankCapacity = getTankCapacity();
                        
                        // Su seviyesi yüzdesine göre mevcut su miktarını hesapla
                        const waterLevelPercent = summaryData.water_level.value / 100;
                        const currentWater = Math.round(tankCapacity * waterLevelPercent);
                        
                        return `Tankta yaklaşık ${currentWater} litre su bulunmaktadır (kapasite: ${tankCapacity} litre).`;
                      })()}
                    </div>
                    {summaryData.water_level.value < 20 && (
                      <div className="text-xs text-red-500 font-medium mt-1">
                        Lütfen en kısa sürede su ekleyin!
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Alt Bilgi Kartları */}
          <div className="grid grid-cols-2 gap-3">
            {/* Kat Bilgisi Kartı */}
            <Card className="bg-white shadow-sm border-0 relative">
              <CardContent className="p-4">
                <div className="flex items-center mb-1">
                  <div className="bg-orange-100 rounded-full p-2 mr-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    </svg>
                  </div>
                  <div className="text-xl font-medium text-gray-800">{layerInfo.layer}.Kat</div>
                </div>
                <div className="text-xs text-gray-500 mt-2 flex items-center">
                  <Badge className="bg-gray-100 text-gray-500 rounded-full w-4 h-4 p-0 flex items-center justify-center text-xs font-normal mr-1">i</Badge>
                  Su Akışı
                </div>
                <ChevronRight className="absolute top-4 right-3 h-4 w-4 text-gray-400" />
              </CardContent>
            </Card>

            {/* Su Sıcaklığı Kartı */}
            {summaryData.water_temperature && (
              <Card className="bg-white shadow-sm border-0 relative">
                <CardContent className="p-4">
                  <div className="flex items-center mb-1">
                    <div className="bg-red-100 rounded-full p-2 mr-2">
                      <Thermometer size={16} color="#EF4444" />
                    </div>
                    <div className="text-xl font-medium text-gray-800">
                      {summaryData.water_temperature.value.toFixed(0)}°C
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2 flex items-center">
                    <Badge className="bg-gray-100 text-gray-500 rounded-full w-4 h-4 p-0 flex items-center justify-center text-xs font-normal mr-1">i</Badge>
                    Su Sıcaklığı
                  </div>
                  <ChevronRight className="absolute top-4 right-3 h-4 w-4 text-gray-400" />
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Grafik Görünümü */}
        <TabsContent value="chart">
          <div className="mb-4">
            <Select value={activeMetric} onValueChange={(value) => setActiveMetric(value)}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Metrik Seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Metrikler</SelectItem>
                {availableSensorTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {NAME_MAP[type] || type} {UNIT_MAP[type] ? `(${UNIT_MAP[type]})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {chartData.length > 0 ? (
            <Card className="bg-white p-0 rounded-md border">
              <CardContent className="p-0">
                <div className="h-96 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="formattedTime"
                        label={{ value: 'Zaman (Yerel Saat)', position: 'insideBottom', offset: -5 }}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value, name) => {
                          // Sensör tipini anahtardan çıkar
                          const sensorType = String(name).split('_')[0];
                          
                          // Node bilgisini al
                          const nodeIdPart = String(name).split('_').slice(-1)[0];
                          const node = nodes.find(n => nodeIdPart.includes(n.id.substring(0, 4)));
                          
                          if (!node) return [value, name];
                          
                          // Birim ve adı getir
                          const unit = UNIT_MAP[sensorType] || '';
                          const sensorName = NAME_MAP[sensorType] || sensorType;
                          
                          return [
                            `${value} ${unit}`,
                            `${node.name} - ${sensorName}`
                          ];
                        }}
                        labelFormatter={(label) => `Zaman: ${label}`}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', padding: '10px' }}
                      />
                      <Legend
                        wrapperStyle={{ paddingTop: 10 }}
                        formatter={(value) => {
                          // Sensör tipini ve düğümü anahtardan çıkar
                          const parts = String(value).split('_');
                          const sensorType = parts[0];
                          const nodeName = parts.slice(1, -1).join('_');
                          
                          // Daha okunaklı bir etiket oluştur
                          return `${NAME_MAP[sensorType] || sensorType}: ${nodeName}`;
                        }}
                      />

                      {/* Grafikte tüm sensör tiplerini göster */}
                      {Object.entries(processedData).flatMap(([nodeId, nodeData]) => {
                        const node = nodes.find(n => n.id === nodeId);
                        if (!node) return [];
                        
                        // Bu node'un sensör tiplerini al
                        const nodeType = node.node_type;
                        const sensorTypes = NODE_TYPE_TO_SENSORS[nodeType] || [];
                        
                        // Her sensör tipi için çizgi ekle
                        return sensorTypes.flatMap(sensorType => {
                          if (activeMetric !== 'all' && sensorType !== activeMetric) return [];
                          
                          // Bu sensör tipi için veri var mı?
                          if (!nodeData.nodeData[sensorType] || nodeData.nodeData[sensorType].length === 0) return [];
                          
                          const dataKey = `${sensorType}_${node.name}_${nodeId.substring(0, 4)}`;
                          
                          return (
                            <Line
                              key={`${nodeId}-${sensorType}`}
                              type="monotone"
                              dataKey={dataKey}
                              name={dataKey}
                              stroke={COLOR_MAP[sensorType] || '#666'}
                              strokeWidth={2}
                              dot={{ r: 4, strokeWidth: 1 }}
                              activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                          );
                        });
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ) : (
            <NoDataMessage />
          )}
        </TabsContent>

        {/* Tablo Görünümü */}
        <TabsContent value="table">
          <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Select value={activeMetric} onValueChange={(value) => setActiveMetric(value)}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Metrik Filtrele" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Metrikler</SelectItem>
                  {availableSensorTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {NAME_MAP[type] || type} {UNIT_MAP[type] ? `(${UNIT_MAP[type]})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {tableData.length > 0 && (
              <p className="text-sm text-gray-500">Toplam: {tableData.length} kayıt</p>
            )}
          </div>

          {tableData.length > 0 ? (
            <Card className="border bg-white overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                      <tr>
                        <th scope="col" className="px-3 py-3">Zaman (Yerel)</th>
                        <th scope="col" className="px-3 py-3">Düğüm</th>
                        <th scope="col" className="px-3 py-3">Metrik</th>
                        <th scope="col" className="px-3 py-3">Değer</th>
                        <th scope="col" className="px-3 py-3">Birim</th>
                        <th scope="col" className="px-3 py-3">Kalite</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map((row, index) => {
                        const node = nodes.find(n => n.id === row.node_id);
                        const sensorType = row.metric_type;

                        return (
                          <tr key={row.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-3 py-2">{formatDate(row.created_at || '')}</td>
                            <td className="px-3 py-2">
                              <div className="flex flex-col">
                                <span>{node?.name || `Düğüm ${row.node_id.substring(0, 8)}`}</span>
                                <span className="text-xs text-gray-400">{row.node_id}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <Badge
                                className="px-2 py-1 font-medium"
                                style={{
                                  backgroundColor: `${COLOR_MAP[sensorType] || '#666'}20`,
                                  color: COLOR_MAP[sensorType] || '#666'
                                }}
                              >
                                <span className="flex items-center">
                                  {getSensorIcon(sensorType, 14)}
                                  <span className="ml-1">{NAME_MAP[sensorType] || sensorType}</span>
                                </span>
                              </Badge>
                            </td>
                            <td className="px-3 py-2 font-medium">
                              {row.value}
                            </td>
                            <td className="px-3 py-2">{row.unit || UNIT_MAP[sensorType] || ''}</td>
                            <td className="px-3 py-2">
                              <div className="flex items-center">
                                <div className={`w-3 h-3 rounded-full mr-2 ${
                                  (row.quality || 100) >= 90 ? 'bg-green-500' :
                                  (row.quality || 100) >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}></div>
                                {row.quality || 100}%
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <NoDataMessage />
          )}
        </TabsContent>
      </Tabs>

      <div className="text-right text-xs text-gray-500">
        Son Güncelleme: {formatDate(new Date().toISOString())}
      </div>
    </div>
  );
};

export default TarlamMetricsViewer;