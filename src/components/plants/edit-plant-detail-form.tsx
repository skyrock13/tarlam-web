// src/components/forms/EditPlantForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { usePlants } from '@/hooks/usePlants'
import { Database } from '@/lib/types/supabase'
type PlantType = Database['public']['Enums']['plant_type']
type RootPlantSubcategory = Database['public']['Enums']['root_plant_subcategory']
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Label } from '@/components/ui/label';
import { isValidPlantType, isValidRootSubcategory } from '@/lib/utils/helpers';

type Plant = NonNullable<ReturnType<typeof usePlants>['plants'][0]>;

interface EditPlantFormProps {
  onClose: () => void;
  onSuccess: () => void;
  open: boolean;
  initialPlant: Plant;
}

export default function EditPlantForm({ onClose, onSuccess, open, initialPlant }: EditPlantFormProps) {
  const { updatePlant } = usePlants()
  const [name, setName] = useState('')
  const [scientificName, setScientificName] = useState('')
  const [plantType, setPlantType] = useState<PlantType | 'all'>('all')
  const [phMin, setPhMin] = useState('')
  const [phMax, setPhMax] = useState('')
  const [ecMin, setEcMin] = useState('')
  const [ecMax, setEcMax] = useState('')
  const [temperatureMin, setTemperatureMin] = useState('')
  const [temperatureMax, setTemperatureMax] = useState('')
  const [lightHours, setLightHours] = useState('')
  const [growthTime, setGrowthTime] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [growingDescription, setGrowingDescription] = useState('');
  const [pruningNeeds, setPruningNeeds] = useState('');
  const [lightIntensity, setLightIntensity] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState('');
  const [humidityMin, setHumidityMin] = useState('');
  const [humidityMax, setHumidityMax] = useState('');
  const [rootSubcategory, setRootSubcategory] = useState<RootPlantSubcategory | null>(null);
  const [currentImageFilename, setCurrentImageFilename] = useState<string | null>(null);

  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    if (initialPlant && open) {
      console.log("Editing plant data:", initialPlant);
      setName(initialPlant.name || '');
      setScientificName(initialPlant.scientific_name || '');
      setPlantType(initialPlant.plant_type || 'all');
      setPhMin(initialPlant.ph_min?.toString() || '');
      setPhMax(initialPlant.ph_max?.toString() || '');
      setEcMin(initialPlant.ec_min?.toString() || '');
      setEcMax(initialPlant.ec_max?.toString() || '');
      setTemperatureMin(initialPlant.temperature_min?.toString() || '');
      setTemperatureMax(initialPlant.temperature_max?.toString() || '');
      setLightHours(initialPlant.light_hours?.toString() || '');
      setGrowthTime(initialPlant.growth_time?.toString() || '');
      setGrowingDescription(initialPlant.growing_parameters?.description || '');
      setPruningNeeds(initialPlant.growing_parameters?.pruning_needs || '');
      setLightIntensity(initialPlant.growing_parameters?.light_intensity || '');
      setDifficultyLevel(initialPlant.growing_parameters?.difficulty_level || '');
      setHumidityMin(initialPlant.humidity_min?.toString() || '');
      setHumidityMax(initialPlant.humidity_max?.toString() || '');
      setRootSubcategory(initialPlant.root_subcategory || null);
      setCurrentImageFilename(initialPlant.image_filename || null);
    }
  }, [initialPlant, open]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!name) {
      setError("Name is required");
      setIsSubmitting(false);
      return;
    }

    if (!isValidPlantType(plantType)) {
      setError("Please select a valid plant type");
      setIsSubmitting(false);
      return;
    }

    if (plantType === 'root' && !isValidRootSubcategory(rootSubcategory)) {
      setError("Please select a valid root plant subcategory");
      setIsSubmitting(false);
      return;
    }

    let imageFilename: string | null = currentImageFilename;
    if (selectedFile) {
      const fileExt = selectedFile.name.split('.').pop();
      const randomNumber = Math.floor(Math.random() * 1000000);
      const fileName = `${name.toLowerCase().replace(/\s+/g, '_')}_${randomNumber}.${fileExt}`;
      imageFilename = fileName;

      const { error: storageError } = await supabase.storage
        .from('plant_images')
        .upload(fileName, selectedFile, {
          upsert: true,
        });

      if (storageError) {
        setError("File upload failed: " + storageError.message);
        setIsSubmitting(false);
        return;
      }
    }

    // Ensure plant_type is a valid enum value for database
    const plantTypeToSave = plantType === 'all' ? undefined : plantType;

    const updatedPlant = {
      name,
      scientific_name: scientificName,
      plant_type: plantTypeToSave,
      ph_min: parseFloat(phMin) || undefined,
      ph_max: parseFloat(phMax) || undefined,
      ec_min: parseFloat(ecMin) || undefined,
      ec_max: parseFloat(ecMax) || undefined,
      temperature_min: parseInt(temperatureMin) || undefined,
      temperature_max: parseInt(temperatureMax) || undefined,
      light_hours: parseInt(lightHours) || undefined,
      growth_time: parseInt(growthTime) || undefined,
      image_filename: imageFilename,
      growing_parameters: {
        description: growingDescription,
        pruning_needs: pruningNeeds,
        light_intensity: lightIntensity,
        difficulty_level: difficultyLevel,
      },
      humidity_min: parseFloat(humidityMin) || undefined,
      humidity_max: parseFloat(humidityMax) || undefined,
      root_subcategory: rootSubcategory,
    };
    
    try {
      await updatePlant(initialPlant.id, updatedPlant);
      onSuccess();
      onClose();
    } catch (error: any) {
      setError(error.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Plant</DialogTitle>
          <DialogDescription>
            Modify the details of the plant.
          </DialogDescription>
        </DialogHeader>
        {error && <div className="text-red-500 mb-4">{error}</div>}

        <form onSubmit={handleUpdate} id="myForm" className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isSubmitting}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="scientificName" className="text-right">Scientific Name</Label>
            <Input
              id="scientificName"
              type="text"
              value={scientificName}
              onChange={(e) => setScientificName(e.target.value)}
              disabled={isSubmitting}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="plantType" className="text-right">Plant Type</Label>
            <Select
              value={String(plantType)}
              onValueChange={(value) => {
                if (isValidPlantType(value)) {
                  setPlantType(value);
                }
              }}
            >
              <SelectTrigger id="plantType" className="col-span-3">
                <SelectValue placeholder="Select a plant type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Root</SelectItem>
                <SelectItem value="micro">Microgreens</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Root Plant Subcategory (Conditional) */}
          {plantType === 'root' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rootSubcategory" className="text-right">
                Root Subcategory
              </Label>
              <Select
                value={rootSubcategory === null ? 'all' : String(rootSubcategory)}
                onValueChange={(value) => {
                  if(isValidRootSubcategory(value) || value === 'all'){
                    setRootSubcategory(value === 'all' ? null : value as RootPlantSubcategory);
                  }
                }}
                disabled={isSubmitting}
              >
                <SelectTrigger id="rootSubcategory" className="col-span-3">
                  <SelectValue placeholder="Select a subcategory" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leafy_greens">
                    Leafy Greens
                  </SelectItem>
                  <SelectItem value="edible_flowers">
                    Edible Flowers
                  </SelectItem>
                  <SelectItem value="aromatic">
                    Aromatic
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phMin" className="text-right">pH Min</Label>
            <Input
              id="phMin"
              type="number"
              value={phMin}
              onChange={(e) => setPhMin(e.target.value)}
              disabled={isSubmitting}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phMax" className="text-right">pH Max</Label>
            <Input
              id="phMax"
              type="number"
              value={phMax}
              onChange={(e) => setPhMax(e.target.value)}
              disabled={isSubmitting}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ecMin" className="text-right">EC Min</Label>
            <Input
              id="ecMin"
              type="number"
              value={ecMin}
              onChange={(e) => setEcMin(e.target.value)}
              disabled={isSubmitting}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ecMax" className="text-right">EC Max</Label>
            <Input
              id="ecMax"
              type="number"
              value={ecMax}
              onChange={(e) => setEcMax(e.target.value)}
              disabled={isSubmitting}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="temperatureMin" className="text-right">Temperature Min (°C)</Label>
            <Input
              id="temperatureMin"
              type="number"
              value={temperatureMin}
              onChange={(e) => setTemperatureMin(e.target.value)}
              disabled={isSubmitting}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="temperatureMax" className="text-right">Temperature Max (°C)</Label>
            <Input
              id="temperatureMax"
              type="number"
              value={temperatureMax}
              onChange={(e) => setTemperatureMax(e.target.value)}
              disabled={isSubmitting}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="lightHours" className="text-right">Light Hours</Label>
            <Input
              id="lightHours"
              type="number"
              value={lightHours}
              onChange={(e) => setLightHours(e.target.value)}
              disabled={isSubmitting}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="growthTime" className="text-right">Growth Time (days)</Label>
            <Input
              id="growthTime"
              type="number"
              value={growthTime}
              onChange={(e) => setGrowthTime(e.target.value)}
              disabled={isSubmitting}
              className="col-span-3"
            />
          </div>

          {/* Growing Parameters Inputs */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="growingDescription" className="text-right">Description</Label>
            <Input
              id="growingDescription"
              value={growingDescription}
              onChange={(e) => setGrowingDescription(e.target.value)}
              disabled={isSubmitting}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="pruningNeeds" className="text-right">Pruning Needs</Label>
            <Input
              id="pruningNeeds"
              value={pruningNeeds}
              onChange={(e) => setPruningNeeds(e.target.value)}
              disabled={isSubmitting}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="lightIntensity" className="text-right">Light Intensity</Label>
            <Input
              id="lightIntensity"
              value={lightIntensity}
              onChange={(e) => setLightIntensity(e.target.value)}
              disabled={isSubmitting}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="difficultyLevel" className="text-right">Difficulty Level</Label>
            <Input
              id="difficultyLevel"
              value={difficultyLevel}
              onChange={(e) => setDifficultyLevel(e.target.value)}
              disabled={isSubmitting}
              className="col-span-3"
            />
          </div>

          {/* Humidity Min */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="humidityMin" className="text-right">Humidity Min</Label>
            <Input
              id="humidityMin"
              type="number"
              value={humidityMin}
              onChange={(e) => setHumidityMin(e.target.value)}
              disabled={isSubmitting}
              className="col-span-3"
            />
          </div>

          {/* Humidity Max */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="humidityMax" className="text-right">Humidity Max</Label>
            <Input
              id="humidityMax"
              type="number"
              value={humidityMax}
              onChange={(e) => setHumidityMax(e.target.value)}
              disabled={isSubmitting}
              className="col-span-3"
            />
          </div>
          
          {/* File Input */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="image" className="text-right">Image</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isSubmitting}
              className="col-span-3"
            />
          </div>
          
          {/* Current image filename display */}
          {currentImageFilename && !selectedFile && (
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="col-start-2 col-span-3 text-xs text-gray-500">
                Current image: {currentImageFilename}
              </div>
            </div>
          )}
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} variant="default" form="myForm">
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}