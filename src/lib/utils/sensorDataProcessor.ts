
import { DeviceMetric, DeviceNode } from '@/lib/types/sub_types';
import { 
  NORMAL_RANGE, 
  CRITICAL_THRESHOLDS, 
  UNIT_MAP 
} from '../constants/sensor';

interface MetricSummary {
  latestValue: number;
  average: number;
  min: number;
  max: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  trend: 'rising' | 'falling' | 'stable';
  timestamp: string;
}

interface ProcessedNodeData {
  [nodeId: string]: {
    metrics: {
      [metricType: string]: MetricSummary;
    };
    lastUpdate: string;
    isActive: boolean;
    name: string;
  };
}

class SensorDataProcessor {
  /**
   * Process raw metrics data into a structured format for each node
   */
  static processMetrics(
    metrics: DeviceMetric[],
    nodes: DeviceNode[]
  ): ProcessedNodeData {
    const result: ProcessedNodeData = {};

    // Initialize result with empty data for each node
    nodes.forEach(node => {
      result[node.id] = {
        metrics: {},
        lastUpdate: '',
        isActive: node.is_active !== false,
        name: node.name || `Node ${node.id.substring(0, 8)}`
      };
    });

    // Group metrics by node and metric type
    const metricsByNode: Record<string, Record<string, DeviceMetric[]>> = {};
    
    metrics.forEach(metric => {
      if (!metricsByNode[metric.node_id]) {
        metricsByNode[metric.node_id] = {};
      }
      
      if (!metricsByNode[metric.node_id][metric.metric_type]) {
        metricsByNode[metric.node_id][metric.metric_type] = [];
      }
      
      metricsByNode[metric.node_id][metric.metric_type].push(metric);
    });

    // Process each node's metrics
    Object.entries(metricsByNode).forEach(([nodeId, metricTypes]) => {
      if (!result[nodeId]) return; // Skip if node is not in the nodes list
      
      let latestTimestamp = '';
      
      // Process each metric type
      Object.entries(metricTypes).forEach(([metricType, nodeMetrics]) => {
        // Sort metrics by timestamp (newest first)
        const sortedMetrics = [...nodeMetrics].sort((a, b) => {
          return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
        });
        
        if (sortedMetrics.length === 0) return;
        
        // Get latest timestamp for this node
        if (!latestTimestamp || new Date(sortedMetrics[0].created_at || '') > new Date(latestTimestamp)) {
          latestTimestamp = sortedMetrics[0].created_at || '';
        }
        
        // Calculate metrics summary
        const latestValue = sortedMetrics[0].value;
        const values = sortedMetrics.map(m => m.value);
        const average = values.reduce((sum, val) => sum + val, 0) / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        const unit = sortedMetrics[0].unit || UNIT_MAP[metricType] || '';
        
        // Determine status
        let status: 'normal' | 'warning' | 'critical' = 'normal';
        
        if (CRITICAL_THRESHOLDS[metricType]) {
          const { low, high } = CRITICAL_THRESHOLDS[metricType];
          
          if (latestValue < low || latestValue > high) {
            status = 'critical';
          } else if (NORMAL_RANGE[metricType]) {
            const [normalLow, normalHigh] = NORMAL_RANGE[metricType];
            
            if (latestValue < normalLow || latestValue > normalHigh) {
              status = 'warning';
            }
          }
        }
        
        // Determine trend
        let trend: 'rising' | 'falling' | 'stable' = 'stable';
        
        if (sortedMetrics.length >= 3) {
          const recentValues = sortedMetrics.slice(0, 3).map(m => m.value);
          
          // Calculate the average change
          const changes = recentValues.slice(0, -1).map((val, i) => recentValues[i + 1] - val);
          const avgChange = changes.reduce((sum, val) => sum + val, 0) / changes.length;
          
          // Determine trend based on average change
          const threshold = Math.abs(average) * 0.02; // 2% change threshold
          
          if (avgChange > threshold) {
            trend = 'rising';
          } else if (avgChange < -threshold) {
            trend = 'falling';
          }
        }
        
        // Save metric summary
        result[nodeId].metrics[metricType] = {
          latestValue,
          average,
          min,
          max,
          unit,
          status,
          trend,
          timestamp: sortedMetrics[0].created_at || ''
        };
      });
      
      // Update last update timestamp for this node
      if (latestTimestamp) {
        result[nodeId].lastUpdate = latestTimestamp;
      }
    });

    return result;
  }

  /**
   * Get the latest values for each metric type across all nodes
   */
  static getLatestMetrics(processedData: ProcessedNodeData): Record<string, MetricSummary> {
    const result: Record<string, MetricSummary> = {};
    
    // Iterate through all nodes
    Object.values(processedData).forEach(nodeData => {
      // Iterate through all metrics in this node
      Object.entries(nodeData.metrics).forEach(([metricType, summary]) => {
        // If this metric type doesn't exist in the result or this node has a newer value
        if (
          !result[metricType] ||
          new Date(summary.timestamp) > new Date(result[metricType].timestamp)
        ) {
          result[metricType] = { ...summary };
        }
      });
    });
    
    return result;
  }

  /**
   * Filter metrics by time range
   */
  static filterByTimeRange(
    metrics: DeviceMetric[],
    timeRange: '1h' | '6h' | '12h' | '24h' | '7d' | '30d' | 'all' = 'all'
  ): DeviceMetric[] {
    if (timeRange === 'all') return metrics;
    
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
    }
    
    return metrics.filter(metric => 
      new Date(metric.created_at || '') >= cutoffDate
    );
  }

  /**
   * Generate alerts based on processed metrics data
   */
  static generateAlerts(processedData: ProcessedNodeData): {
    nodeId: string;
    nodeName: string;
    metricType: string;
    value: number;
    unit: string;
    timestamp: string;
    severity: 'warning' | 'critical';
    message: string;
  }[] {
    const alerts: { nodeId: string; nodeName: string; metricType: string; value: number; unit: string; timestamp: string; severity: "warning" | "critical"; message: string; }[] = [];
    
    // Iterate through all nodes
    Object.entries(processedData).forEach(([nodeId, nodeData]) => {
      // Iterate through all metrics in this node
      Object.entries(nodeData.metrics).forEach(([metricType, summary]) => {
        if (summary.status === 'warning' || summary.status === 'critical') {
          // Determine if the value is too high or too low
          let condition: 'high' | 'low' = 'high';
          
          if (NORMAL_RANGE[metricType]) {
            const [normalLow, normalHigh] = NORMAL_RANGE[metricType];
            condition = summary.latestValue < normalLow ? 'low' : 'high';
          }
          
          // Create alert message
          const message = `${condition === 'high' ? 'High' : 'Low'} ${metricType} reading: ${summary.latestValue}${summary.unit}`;
          
          alerts.push({
            nodeId,
            nodeName: nodeData.name,
            metricType,
            value: summary.latestValue,
            unit: summary.unit,
            timestamp: summary.timestamp,
            severity: summary.status,
            message
          });
        }
      });
    });
    
    // Sort alerts by severity (critical first) then by timestamp (newest first)
    return alerts.sort((a, b) => {
      if (a.severity === 'critical' && b.severity !== 'critical') return -1;
      if (a.severity !== 'critical' && b.severity === 'critical') return 1;
      
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }

  /**
   * Calculate system health score based on all metrics
   */
  static calculateSystemHealth(processedData: ProcessedNodeData): {
    score: number;
    status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    alerts: number;
    criticalAlerts: number;
  } {
    const alerts = this.generateAlerts(processedData);
    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
    
    // Count active nodes with recent data (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const activeNodes = Object.values(processedData).filter(node => 
      node.isActive && new Date(node.lastUpdate) >= oneDayAgo
    ).length;
    
    // Total node count
    const totalNodes = Object.keys(processedData).length;
    
    // Calculate node health score (0-100)
    const nodeHealthScore = totalNodes > 0 ? (activeNodes / totalNodes) * 100 : 100;
    
    // Calculate metrics health score
    const metricCount = Object.values(processedData).reduce((count, node) => 
      count + Object.keys(node.metrics).length, 0
    );
    
    // Calculate metric health score (0-100)
    let metricsHealthScore = 100;
    
    if (metricCount > 0) {
      const warningPenalty = (alerts.length - criticalAlerts) * 5; // 5 points per warning
      const criticalPenalty = criticalAlerts * 15; // 15 points per critical alert
      metricsHealthScore = Math.max(0, 100 - warningPenalty - criticalPenalty);
    }
    
    // Calculate overall health score
    const overallScore = Math.round((nodeHealthScore * 0.4) + (metricsHealthScore * 0.6));
    
    // Determine status
    let status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    
    if (overallScore >= 90) {
      status = 'excellent';
    } else if (overallScore >= 75) {
      status = 'good';
    } else if (overallScore >= 50) {
      status = 'fair';
    } else if (overallScore >= 25) {
      status = 'poor';
    } else {
      status = 'critical';
    }
    
    return {
      score: overallScore,
      status,
      alerts: alerts.length,
      criticalAlerts
    };
  }
}

export default SensorDataProcessor;