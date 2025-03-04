
export interface DeviceSpecifications {
    dimensions?: {
      depth: number;
      width: number;
      height: number;
    };
    light_type?: string;
    tank_capacity?: string | number;
    [key: string]: any; // Diğer olası spesifikasyonları da kabul et
  }
  
  export interface DeviceMetadata {
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
    [key: string]: any; // Diğer metadata alanları için
  }
  
  export interface DeviceInfo {
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
  
  export interface DeviceNode {
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
  
  export interface DeviceMetric {
    id: string;
    device_id: string;
    node_id: string;
    metric_type: string;
    value: number;
    unit?: string;
    quality?: number;
    created_at?: string;
  }
  
  // Props tanımı
  export interface EnhancedMetricsViewerProps {
    metrics: DeviceMetric[];
    nodes: DeviceNode[];
    deviceId: string;
    deviceInfo?: DeviceInfo;
    onRefresh: () => void;
  }