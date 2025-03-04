// src/components/devices/enhanced-metrics-viewer.tsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RefreshCw, Download, Calendar, Zap, Filter, ArrowUpDown, Info } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import _ from 'lodash';

// Import types
import { DeviceMetric, DeviceNode, DeviceInfo } from '@/lib/types/sub_types';

// Constants for sensor mappings
const NODE_TYPE_TO_SENSORS: Record<string, string[]> = {
  'temperature': ['temperature', 'humidity'],
  'ec': ['ec'],
  'ph': ['ph'],
  'water_temperature': ['water_temperature', 'water_level'],
  'water_flow': ['water_flow'],
  'light': ['light']
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
  'temperature': '#FF7300',
  'humidity': '#9966FF',
  'ec': '#0088FE',
  'ph': '#00C49F',
  'water_temperature': '#FF6B6B',
  'water_level': '#4F93FF',
  'water_flow': '#FF9800',
  'light': '#FFD700'
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

// Helper functions
const formatDate = (dateStr: string | undefined, includeDate = false): string => {
  if (!dateStr) return '';
  
  const date = new Date(dateStr);
  
  if (includeDate) {
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
};

// Define props interface
interface EnhancedMetricsViewerProps {
  metrics: DeviceMetric[];
  nodes: DeviceNode[];
  deviceId: string;
  deviceInfo?: DeviceInfo;
  onRefresh?: () => Promise<void>;
}

const EnhancedMetricsViewer: React.FC<EnhancedMetricsViewerProps> = ({ 
  metrics = [], 
  nodes = [], 
  deviceId, 
  deviceInfo, 
  onRefresh 
}) => {
  const { toast } = useToast();
  
  // State
  const [timeRange, setTimeRange] = useState('24h');
  const [activeMetric, setActiveMetric] = useState('all');
  const [activeNodes, setActiveNodes] = useState<string[]>([]);
  const [filterVisible, setFilterVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // Initialize active nodes when nodes data changes
  useEffect(() => {
    if (nodes && nodes.length > 0) {
      const initialActiveNodes = nodes
        .filter(node => node.is_active !== false)
        .map(node => node.id);
      
      if (initialActiveNodes.length > 0) {
        setActiveNodes(initialActiveNodes);
      }
    }
  }, [nodes]);
  
  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setHasError(false);
    
    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        console.log('No refresh handler provided');
        // Wait a bit to simulate refresh
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      toast({
        title: "Başarılı",
        description: "Metrik verileri yenilendi",
      });
    } catch (error) {
      console.error('Error refreshing metrics:', error);
      setHasError(true);
      
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Metrik verileri yenilenirken bir hata oluştu",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, toast]);
  
  // Toggle node selection
  const toggleNode = useCallback((nodeId: string) => {
    setActiveNodes(prev => 
      prev.includes(nodeId)
        ? prev.filter(id => id !== nodeId)
        : [...prev, nodeId]
    );
  }, []);
  
  // Handle data download
  const handleDownload = useCallback(() => {
    if (!metrics.length) {
      toast({
        title: "Hata",
        description: "İndirilecek veri bulunamadı",
      });
      return;
    }
    
    try {
      // Create CSV content
      const headers = "timestamp,nodeId,metric_type,value,unit\n";
      const rows = metrics.map(metric => {
        const timestamp = metric.created_at || new Date().toISOString();
        const nodeId = metric.node_id;
        const type = metric.metric_type;
        const value = metric.value;
        const unit = metric.unit || UNIT_MAP[metric.metric_type] || '';
        
        return `${timestamp},${nodeId},${type},${value},${unit}`;
      }).join("\n");
      
      const csvContent = headers + rows;
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `device_${deviceId}_metrics_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Başarılı",
        description: "Veriler indirildi",
      });
    } catch (error) {
      console.error('Error downloading data:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Veriler indirilirken bir hata oluştu",
      });
    }
  }, [metrics, deviceId, toast]);
  
  // Filter metrics by time range - Optimized for performance
  const filteredMetrics = useMemo(() => {
    if (!metrics.length) return [];
    
    // First filter by node and metric type
    const nodeAndMetricFiltered = metrics.filter(metric => 
      activeNodes.includes(metric.node_id) && 
      (activeMetric === 'all' || metric.metric_type === activeMetric)
    );
    
    // If timeRange is 'all', return all data
    if (timeRange === 'all') {
      return nodeAndMetricFiltered;
    }
    
    // Otherwise filter by time
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '1h':
        startDate.setHours(now.getHours() - 1);
        break;
      case '6h':
        startDate.setHours(now.getHours() - 6);
        break;
      case '12h':
        startDate.setHours(now.getHours() - 12);
        break;
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
    }
    
    const startTime = startDate.getTime();
    
    return nodeAndMetricFiltered.filter(metric => {
      const metricTime = new Date(metric.created_at || '').getTime();
      return metricTime >= startTime;
    });
  }, [metrics, timeRange, activeNodes, activeMetric]);
  
  // Get chart data - Optimized for performance
  const chartData = useMemo(() => {
    if (filteredMetrics.length < 2) return [];
    
    // For large datasets, downsample to prevent rendering too many points
    const MAX_POINTS = 150;
    let metricsToProcess = filteredMetrics;
    
    if (filteredMetrics.length > MAX_POINTS) {
      // Simple downsampling - take every Nth point
      const sampleRate = Math.ceil(filteredMetrics.length / MAX_POINTS);
      metricsToProcess = filteredMetrics.filter((_, idx) => idx % sampleRate === 0);
    }
    
    // Group metrics by timestamp
    const groupedByTime = _.groupBy(metricsToProcess, 'created_at');
    
    // Create data points for chart
    return Object.entries(groupedByTime).map(([timestamp, metricsAtTime]) => {
      const dataPoint: any = { 
        timestamp,
        formattedTime: formatDate(timestamp, timeRange === '7d' || timeRange === '30d' || timeRange === 'all') 
      };
      
      // Add values for each metric type and node
      metricsAtTime.forEach(metric => {
        const node = nodes.find(n => n.id === metric.node_id);
        if (!node) return;
        
        const dataKey = `${metric.metric_type}_${node.name.replace(/\s+/g, '_')}_${node.id.substring(0, 4)}`;
        dataPoint[dataKey] = metric.value;
      });
      
      return dataPoint;
    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [filteredMetrics, nodes, timeRange]);
  
  // Get sensor types for all available nodes
  const availableSensorTypes = useMemo(() => {
    if (!metrics.length) return [];
    return _.uniq(metrics.map(m => m.metric_type));
  }, [metrics]);
  
  // Empty states
  if (!nodes.length || !metrics.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cihaz Metrikleri</CardTitle>
          <CardDescription>Cihaz için metrik verileri bulunmuyor</CardDescription>
        </CardHeader>
        <CardContent className="py-6 text-center">
          {isRefreshing ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <Skeleton className="h-32 w-full mx-auto" />
              <Skeleton className="h-4 w-1/2 mx-auto" />
            </div>
          ) : (
            <>
              <Info className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-xl font-medium text-gray-500">Metrik Verisi Bulunamadı</p>
              <p className="text-gray-400 mb-6">
                {hasError ? "Metrik verisi yüklenirken hata oluştu" : "Henüz metrik verisi bulunmuyor"}
              </p>
              <Button onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                {isRefreshing ? "Yenileniyor..." : "Yenile"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[130px]">
              <Calendar className="h-4 w-4 mr-2" />
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
            variant={filterVisible ? "default" : "outline"} 
            onClick={() => setFilterVisible(!filterVisible)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtreler
            {activeNodes.length > 0 && (
              <Badge variant="secondary" className="ml-2">{activeNodes.length}</Badge>
            )}
          </Button>
          
          <Select value={activeMetric} onValueChange={setActiveMetric}>
            <SelectTrigger className="w-[150px]">
              <Zap className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Metrik Tipi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Metrikler</SelectItem>
              {availableSensorTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {NAME_MAP[type] || type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Yenile
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleDownload} 
            disabled={isRefreshing || !filteredMetrics.length}
          >
            <Download className="h-4 w-4 mr-2" />
            İndir
          </Button>
        </div>
      </div>
      
      {/* Node Filters */}
      {filterVisible && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Düğüm Filtresi</h3>
              <Select value={activeNodes.length === nodes.length ? 'all' : 'custom'} onValueChange={(value) => {
                if (value === 'all') {
                  setActiveNodes(nodes.map(node => node.id));
                } else if (value === 'none') {
                  setActiveNodes([]);
                }
              }}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Tümünü Seç" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümünü Seç</SelectItem>
                  <SelectItem value="none">Hiçbirini Seçme</SelectItem>
                  <SelectItem value="custom">Özel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {nodes.map(node => (
                <Badge
                  key={node.id}
                  variant={activeNodes.includes(node.id) ? "default" : "outline"}
                  className={`cursor-pointer ${
                    activeNodes.includes(node.id) ? "bg-primary" : "hover:bg-primary/10"
                  }`}
                  onClick={() => toggleNode(node.id)}
                >
                  {node.name || `Node ${node.id.substring(0, 8)}`}
                  {activeNodes.includes(node.id) && " ✓"}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Metrik Görselleştirme</CardTitle>
          <CardDescription>Sensör verilerinin zaman içindeki değişimi</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 1 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="formattedTime" 
                    label={{ value: "Zaman", position: 'insideBottomRight', offset: -10 }}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    label={{ value: "Değer", angle: -90, position: 'insideLeft' }} 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value, name) => {
                      const parts = String(name).split('_');
                      const metricType = parts[0];
                      const nodeName = parts.slice(1, -1).join('_');
                      
                      return [
                        `${value} ${UNIT_MAP[metricType] || ''}`,
                        `${nodeName} - ${NAME_MAP[metricType] || metricType}`
                      ];
                    }}
                    labelFormatter={(label) => `Zaman: ${label}`}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', padding: '10px' }}
                  />
                  <Legend 
                    formatter={(value) => {
                      const parts = String(value).split('_');
                      const metricType = parts[0];
                      const nodeName = parts.slice(1, -1).join(' ');
                      
                      return `${NAME_MAP[metricType] || metricType}: ${nodeName}`;
                    }}
                    wrapperStyle={{ paddingTop: 10 }}
                  />
                  
                  {/* Generate lines for each node and metric combination */}
                  {Object.keys(chartData[0])
                    .filter(key => key !== 'timestamp' && key !== 'formattedTime')
                    .map(key => {
                      const metricType = key.split('_')[0];
                      
                      return (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={key}
                          stroke={COLOR_MAP[metricType] || '#8884d8'}
                          dot={{ r: 3, strokeWidth: 1 }}
                          activeDot={{ r: 6 }}
                          strokeWidth={2}
                        />
                      );
                    })
                  }
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-lg text-gray-500">Grafik için yeterli veri yok</p>
              <p className="text-sm text-gray-400">Farklı filtreler deneyin veya zaman aralığını genişletin</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Data Table - Display only the latest 100 records for performance */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Metrik Verileri</CardTitle>
            <Select 
              value="newest" 
              onValueChange={(value) => {
                // Sort functionality would go here
                console.log('Sort by:', value);
              }}
            >
              <SelectTrigger className="w-[160px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sıralama" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">En Yeniler Önce</SelectItem>
                <SelectItem value="oldest">En Eskiler Önce</SelectItem>
                <SelectItem value="value-high">En Yüksek Değer Önce</SelectItem>
                <SelectItem value="value-low">En Düşük Değer Önce</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredMetrics.length > 0 ? (
            <div className="border rounded-md overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Zaman
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Düğüm
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Metrik
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Değer
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* Display only the latest 100 records for performance */}
                  {filteredMetrics.slice(-100).map((metric, index) => {
                    const node = nodes.find(n => n.id === metric.node_id);
                    
                    return (
                      <tr key={`${metric.id || index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-2 whitespace-nowrap text-sm">
                          {formatDate(metric.created_at, true)}
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm">
                          {node?.name || metric.node_id.substring(0, 8)}
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm">
                          <Badge 
                            variant="outline" 
                            style={{ 
                              color: COLOR_MAP[metric.metric_type] || 'currentColor',
                              backgroundColor: `${COLOR_MAP[metric.metric_type]}15` || 'transparent'
                            }}
                          >
                            {NAME_MAP[metric.metric_type] || metric.metric_type}
                          </Badge>
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm font-mono">
                          {metric.value} {metric.unit || UNIT_MAP[metric.metric_type] || ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-lg text-gray-500">Veri Bulunamadı</p>
              <p className="text-sm text-gray-400 mb-4">Zaman aralığını veya filtreleri değiştirmeyi deneyin</p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Yenile
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedMetricsViewer;