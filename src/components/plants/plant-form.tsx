// src/components/forms/PlantForm.tsx
'use client'

import { useState } from 'react'
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
// Import the new enum type:
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


interface PlantFormProps {
    onClose: () => void;
    onSuccess: () => void;
    open: boolean;
}

// Updated type guard to include the new enum
function isValidPlantType(value: string | undefined): value is PlantType | 'all' {
    if (value === undefined) return false;
    return ['all', 'root', 'micro'].includes(value);
}

function isValidRootSubcategory(value: string | undefined | null): value is RootPlantSubcategory | null { // Added null
    if (value === undefined || value === null) return true; // Allow null (it's optional)
    return ['leafy_greens', 'edible_flowers', 'aromatic'].includes(value);
}

export default function PlantForm({ onClose, onSuccess, open }: PlantFormProps) {
    const { createPlant } = usePlants()
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

    // Growing parameters - individual states
    const [growingDescription, setGrowingDescription] = useState('');
    const [pruningNeeds, setPruningNeeds] = useState('');
    const [lightIntensity, setLightIntensity] = useState('');
    const [difficultyLevel, setDifficultyLevel] = useState('');

    // New fields:
    const [humidityMin, setHumidityMin] = useState('');
    const [humidityMax, setHumidityMax] = useState('');
    const [rootSubcategory, setRootSubcategory] = useState<RootPlantSubcategory | null>(null); // Allow null


    const supabase = createClientComponentClient<Database>();


    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
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

        let imageFilename: string | null = null;
        if (selectedFile) {
            const fileExt = selectedFile.name.split('.').pop();
            const randomNumber = Math.floor(Math.random() * 1000000);
            const fileName = `<span class="math-inline">\{name\.toLowerCase\(\)\.replace\(/\\s\+/g, '\_'\)\}\_</span>{randomNumber}.${fileExt}`;
            imageFilename = fileName;

            const { error: storageError } = await supabase.storage
                .from('plant_images')
                .upload(fileName, selectedFile);

            if (storageError) {
                setError("File upload failed: " + storageError.message);
                setIsSubmitting(false);
                return;
            }
        }

        // Construct the growing_parameters object
        const growing_parameters = {
            description: growingDescription,
            pruning_needs: pruningNeeds,
            light_intensity: lightIntensity,
            difficulty_level: difficultyLevel,
        };

        const newPlant = {
            name,
            scientific_name: scientificName,
            plant_type: plantType,
            ph_min: parseFloat(phMin) || undefined,
            ph_max: parseFloat(phMax) || undefined,
            ec_min: parseFloat(ecMin) || undefined,
            ec_max: parseFloat(ecMax) || undefined,
            temperature_min: parseInt(temperatureMin) || undefined,
            temperature_max: parseInt(temperatureMax) || undefined,
            light_hours: parseInt(lightHours) || undefined,
            growth_time: parseInt(growthTime) || undefined,
            image_filename: imageFilename,
            growing_parameters,
            humidity_min: parseFloat(humidityMin) || undefined,
            humidity_max: parseFloat(humidityMax) || undefined,
            root_subcategory: rootSubcategory,

        };



        try {
            await createPlant(newPlant);
            onSuccess();
            setName('');
            setScientificName('');
            setPlantType('all');
            setPhMin('');
            setPhMax('');
            setEcMin('');
            setEcMax('');
            setTemperatureMin('');
            setTemperatureMax('');
            setLightHours('');
            setGrowthTime('');
            setSelectedFile(null);
            setGrowingDescription('');
            setPruningNeeds('');
            setLightIntensity('');
            setDifficultyLevel('');
            setHumidityMin('');
            setHumidityMax('');
            setRootSubcategory(null);
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
                    <DialogTitle>Add New Plant</DialogTitle>
                    <DialogDescription>
                        Enter the details of the new plant.
                    </DialogDescription>
                </DialogHeader>
                {error && <div className="text-red-500 mb-4">{error}</div>}

                <form onSubmit={handleCreate} id="myForm" className="grid gap-4 py-4">
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
                                <SelectItem value="all">All Types</SelectItem>
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
                                value={rootSubcategory || undefined}  // Handle null for Select
                                onValueChange={(value) => {
                                    if (isValidRootSubcategory(value)) {
                                        setRootSubcategory(value);
                                    }
                                }}
                                disabled={isSubmitting}
                            >
                                <SelectTrigger id="rootSubcategory" className="col-span-3">
                                    <SelectValue placeholder="Select a subcategory" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="leafy_greens">Leafy Greens</SelectItem>
                                    <SelectItem value="edible_flowers">Edible Flowers</SelectItem>
                                    <SelectItem value="aromatic">Aromatic</SelectItem>
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
                </form>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting} variant="default" form="myForm">
                        {isSubmitting ? 'Adding...' : 'Add Plant'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}