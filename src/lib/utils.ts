import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


import { Database } from "./types/supabase"; // Import Database type.

//Define the interfaces
interface GrowingParameters {
    description?: string;
    pruning_needs?: string;
    light_intensity?: string;
    difficulty_level?: string;
  }

// Type guard function for GrowingParameters
export function isGrowingParameters(value: any): value is GrowingParameters {
    if (value === undefined) return false;
    return (
        typeof value === 'object' &&
        value !== null && // Important: check for null!
        (typeof value.description === 'string' || value.description === undefined) &&
        (typeof value.pruning_needs === 'string' || value.pruning_needs === undefined) &&
        (typeof value.light_intensity === 'string' || value.light_intensity === undefined) &&
        (typeof value.difficulty_level === 'string' || value.difficulty_level === undefined)
    );
}

//Type guard for PlantType
type PlantType = Database['public']['Enums']['plant_type']
export function isValidPlantType(value: string | undefined): value is PlantType | 'all' {
    if (value === undefined) return false;
    return ['all', 'root', 'micro'].includes(value);
}

//Type Guard for RootPlantSubcategory
type RootPlantSubcategory = Database['public']['Enums']['root_plant_subcategory']
export function isValidRootSubcategory(value: string | undefined | null): value is RootPlantSubcategory | null { // Added null
    if (value === undefined || value === null) return true; // Allow null (it's optional)
    return ['leafy_greens', 'edible_flowers', 'aromatic'].includes(value);
}