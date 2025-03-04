// src/lib/constants/sensors.ts

// Map node types to their respective sensor types
export const NODE_TYPE_TO_SENSORS: Record<string, string[]> = {
    'temperature': ['temperature', 'humidity'],
    'ec': ['ec'],
    'ph': ['ph'],
    'water_temperature': ['water_temperature', 'water_level'],
    'water_flow': ['water_flow'],
    'light': ['light'],
    'nutrition': ['nitrogen', 'phosphorous', 'potassium'],
    'pressure': ['pressure'],
    'co2': ['co2'],
    'motion': ['motion'],
    'camera': ['image'],
  };
  
  // Map sensor types back to their node type
  export const SENSOR_TO_NODE_TYPE: Record<string, string> = {
    'temperature': 'temperature',
    'humidity': 'temperature',
    'ec': 'ec',
    'ph': 'ph',
    'water_temperature': 'water_temperature',
    'water_level': 'water_temperature', 
    'water_flow': 'water_flow',
    'light': 'light',
    'nitrogen': 'nutrition',
    'phosphorous': 'nutrition',
    'potassium': 'nutrition',
    'pressure': 'pressure',
    'co2': 'co2',
    'motion': 'motion',
    'image': 'camera',
  };
  
  // Units for each metric type
  export const UNIT_MAP: Record<string, string> = {
    'temperature': '°C',
    'water_temperature': '°C',
    'humidity': '%',
    'light': '%',
    'water_level': '%',
    'ec': 'μS/cm',
    'ph': '',
    'water_flow': 'L/min',
    'nitrogen': 'ppm',
    'phosphorous': 'ppm',
    'potassium': 'ppm',
    'pressure': 'kPa',
    'co2': 'ppm',
    'motion': '',
  };
  
  // Color scheme for each metric type
  export const COLOR_MAP: Record<string, string> = {
    'temperature': '#FF7300',     // Orange
    'humidity': '#9966FF',        // Purple
    'ec': '#0088FE',              // Blue
    'ph': '#00C49F',              // Green
    'water_temperature': '#FF6B6B', // Red
    'water_level': '#4F93FF',     // Blue
    'water_flow': '#FF9800',      // Amber
    'light': '#FFD700',           // Gold
    'nitrogen': '#82CA9D',        // Green
    'phosphorous': '#8884D8',     // Purple
    'potassium': '#FFBB28',       // Yellow
    'pressure': '#A4DE6C',        // Light Green
    'co2': '#FF8042',             // Orange
    'motion': '#AAAAAA',          // Gray
  };
  
  // Display names for each metric type
  export const NAME_MAP: Record<string, string> = {
    'temperature': 'Temperature',
    'humidity': 'Humidity',
    'ec': 'EC',
    'ph': 'pH',
    'water_temperature': 'Water Temperature',
    'water_flow': 'Water Flow',
    'water_level': 'Water Level',
    'light': 'Light',
    'nitrogen': 'Nitrogen',
    'phosphorous': 'Phosphorous',
    'potassium': 'Potassium',
    'pressure': 'Pressure',
    'co2': 'CO₂',
    'motion': 'Motion',
  };
  
  // Normal ranges for each metric type
  export const NORMAL_RANGE: Record<string, [number, number]> = {
    'temperature': [20, 25],       // Normal indoor temperature range (°C)
    'humidity': [40, 60],          // Normal humidity range (%)
    'ec': [1.0, 2.0],              // Normal EC range for most plants (μS/cm)
    'ph': [5.5, 6.5],              // Normal pH range for most plants
    'water_temperature': [18, 22], // Normal water temperature range (°C)
    'water_level': [70, 100],      // Normal water level (%)
    'water_flow': [1.0, 5.0],      // Normal water flow (L/min)
    'light': [50, 80],             // Normal light intensity (%)
    'nitrogen': [100, 200],        // Normal nitrogen levels (ppm)
    'phosphorous': [30, 50],       // Normal phosphorous levels (ppm)
    'potassium': [150, 250],       // Normal potassium levels (ppm)
    'pressure': [90, 110],         // Normal pressure (kPa)
    'co2': [400, 1000],            // Normal CO₂ levels (ppm)
  };
  
  // Critical thresholds for each metric type
  export const CRITICAL_THRESHOLDS: Record<string, { low: number, high: number }> = {
    'temperature': { low: 15, high: 30 },
    'humidity': { low: 30, high: 70 },
    'ec': { low: 0.5, high: 3.0 },
    'ph': { low: 5.0, high: 7.0 },
    'water_temperature': { low: 15, high: 28 },
    'water_level': { low: 30, high: 100 },
    'water_flow': { low: 0.5, high: 10.0 },
    'light': { low: 20, high: 100 },
    'nitrogen': { low: 50, high: 300 },
    'phosphorous': { low: 20, high: 80 },
    'potassium': { low: 100, high: 350 },
    'pressure': { low: 85, high: 115 },
    'co2': { low: 300, high: 1500 },
  };