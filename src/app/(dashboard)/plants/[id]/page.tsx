// src/app/(dashboard)/plants/[id]/page.tsx
'use client';

import { usePlants } from '@/hooks/usePlants';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropletIcon,
  ThermometerIcon,
  SunIcon,
  TimerIcon,
  Leaf,
  AlertTriangle,
  Edit,
  LeafyGreen,
  WindIcon
} from 'lucide-react'
import { LoadingSection } from '@/components/shared/loading';
import { isGrowingParameters } from '@/lib/utils';
import { useState } from 'react';
import EditPlantForm from '@/components/plants/edit-plant-detail-form';
import { Button } from '@/components/ui/button';


interface PageProps {
  params: { id: string };
}

export default function PlantDetailPage({ params }: PageProps) {
  const { id } = params;
  const { plants, loading, error, refreshPlants } = usePlants();
    const [isEditFormOpen, setIsEditFormOpen] = useState(false);

  const plant = plants.find((p) => p.id === id);

  if (loading) {
    return <LoadingSection text="Loading plant details..." />;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!plant) {
    notFound();
    return null;
  }

    const MetricItem = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm">{label}</span>
        </div>
      );

  return (
    <div className="p-4">
      <Card className="overflow-hidden">
        <div className="md:flex">
          {plant.imageUrl && (
            <div className="relative w-full md:w-1/3 aspect-[5/3] -mt-6 -ml-6 md:m-0">
              <Image
                src={plant.imageUrl}
                alt={plant.name}
                fill
                className="object-cover rounded-t-lg md:rounded-l-lg md:rounded-tr-none"
                sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
              />
            </div>
          )}

          <div className="flex-1 p-6 space-y-4">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-bold">{plant.name}</CardTitle>
                        <CardDescription>{plant.scientific_name}</CardDescription>
                    </div>
                    {/* Edit Button */}
                    <Button variant="outline" size="icon" onClick={() => setIsEditFormOpen(true)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                </div>
              <Badge variant="outline" className="mt-2 w-fit">
                {plant.plant_type}
              </Badge>
            </CardHeader>

            <CardContent className="space-y-4">
              {plant.growing_parameters && isGrowingParameters(plant.growing_parameters) && (
                <p className="text-sm text-muted-foreground">
                  {plant.growing_parameters.description}
                </p>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <MetricItem icon={<DropletIcon className="h-5 w-5 text-blue-500" />} label={`${plant.ph_min}-${plant.ph_max}`} title="pH Range" />
                <MetricItem icon={<DropletIcon className="h-5 w-5 text-blue-500" />} label={`${plant.ec_min}-${plant.ec_max}`} title="EC Range" />
                <MetricItem icon={<ThermometerIcon className="h-5 w-5 text-red-500" />} label={`${plant.temperature_min}°-${plant.temperature_max}°C`} title="Temperature" />
                <MetricItem icon={<SunIcon className="h-5 w-5 text-yellow-500" />} label={`${plant.light_hours}h`} title="Light Hours" />
                <MetricItem icon={<Leaf className="h-5 w-5 text-green-500" />} label={`${plant.growing_parameters?.light_intensity || '-'}`} title="Light Intensity" />
                <MetricItem icon={<TimerIcon className="h-5 w-5 text-green-500" />} label={`${plant.growth_time} days`} title="Growth Time" />
                {plant.humidity_min && plant.humidity_max && (
                    <MetricItem
                        icon={<WindIcon className="h-5 w-5 text-blue-500" />}
                        label={`${plant.humidity_min}%-${plant.humidity_max}%`}
                        title="Humidity"
                    />
                )}
                {plant.root_subcategory && (
                    <MetricItem icon={<LeafyGreen className="h-5 w-5 text-green-500" />} label={plant.root_subcategory} title="Subcategory" />
                )}
              </div>

              {plant.care_instructions && (
                <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4" role="alert">
                    <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    <p className="text-sm">{plant.care_instructions}</p>
                    </div>
                </div>
              )}
            </CardContent>
          </div>
        </div>
          {/* Edit Form Modal */}
        <EditPlantForm
          open={isEditFormOpen}
          onClose={() => setIsEditFormOpen(false)}
          onSuccess={refreshPlants}
          initialPlant={plant} // Pass the plant data
        />
      </Card>
    </div>
  );
}

interface MetricItemProps {
  icon: React.ReactNode;
  label: string;
  title?: string;
}

function MetricItem({ icon, label, title }: MetricItemProps) {
  return (
     <div className="flex flex-col items-center justify-center p-4 border rounded-lg text-center">
      <div className="mb-2">{icon}</div>
      <div className="text-base font-semibold">{label}</div>
      {title && <div className="text-xs text-muted-foreground">{title}</div>}
    </div>
  );
}