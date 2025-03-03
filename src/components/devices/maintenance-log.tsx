// src/components/devices/maintenance-log.tsx
'use client';

import { useMemo } from 'react';
import { Badge } from "@/components/ui/badge";

interface MaintenanceRecord {
  id: string;
  maintenance_type: string;
  description: string;
  scheduled_date: string;
  completed_date: string | null;
  performed_actions: any;
  user?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface MaintenanceLogProps {
  records: MaintenanceRecord[];
}

export default function MaintenanceLog({ records }: MaintenanceLogProps) {
  // Bakım tipine göre renk ve ikon belirleme
  const getMaintenanceTypeDetails = (type: string) => {
    switch (type) {
      case 'restart':
        return { color: 'bg-yellow-500', label: 'Yeniden Başlatma' };
      case 'firmware_update':
        return { color: 'bg-blue-500', label: 'Firmware Güncellemesi' };
      case 'calibration':
        return { color: 'bg-green-500', label: 'Kalibrasyon' };
      case 'repair':
        return { color: 'bg-red-500', label: 'Onarım' };
      case 'cleaning':
        return { color: 'bg-purple-500', label: 'Temizlik' };
      case 'inspection':
        return { color: 'bg-cyan-500', label: 'Denetim' };
      default:
        return { color: 'bg-gray-500', label: type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ') };
    }
  };
  
  // Tarihi formatla
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString();
    } catch (e) {
      return dateStr;
    }
  };
  
  // Kayıtları tarihe göre sırala
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      const dateA = a.completed_date || a.scheduled_date;
      const dateB = b.completed_date || b.scheduled_date;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [records]);
  
  if (records.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-500">Bu cihaz için bakım kaydı bulunmamaktadır.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {sortedRecords.map(record => {
        const { color, label } = getMaintenanceTypeDetails(record.maintenance_type);
        
        return (
          <div key={record.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <Badge className={color}>{label}</Badge>
                <div>
                  <p className="font-medium">{record.description}</p>
                  <p className="text-sm text-gray-500">
                    {record.completed_date ? 
                      `Tamamlanma: ${formatDate(record.completed_date)}` : 
                      `Planlanma: ${formatDate(record.scheduled_date)}`
                    }
                  </p>
                </div>
              </div>
              
              {record.user && (
                <div className="flex items-center">
                  <p className="text-sm text-gray-500">{record.user.first_name} {record.user.last_name}</p>
                </div>
              )}
            </div>
            
            {record.performed_actions && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm font-medium mb-1">Yapılan İşlemler:</p>
                <div className="text-sm text-gray-700 bg-slate-50 p-2 rounded">
                  <pre className="whitespace-pre-wrap text-xs">
                    {typeof record.performed_actions === 'object' 
                      ? JSON.stringify(record.performed_actions, null, 2) 
                      : String(record.performed_actions)
                    }
                  </pre>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}