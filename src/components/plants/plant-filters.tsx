// src/components/plants/plant-filters.tsx
'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Database } from '@/lib/types/supabase'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import {
  Filter as FilterIcon, 
  Search, 
  Leaf as LeafIcon, 
  Flower2 as PlantIcon, 
  Thermometer as ThermometerIcon, 
  Droplet as DropletIcon, 
  Sun as SunIcon, 
  Timer as TimerIcon, 
  ArrowUpDown, 
  FilterX, 
  Flower as FlowerIcon, 
  Egg as EggIcon,
  LeafyGreen
} from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type PlantType = Database['public']['Enums']['plant_type']
type RootPlantSubcategory = Database['public']['Enums']['root_plant_subcategory']

interface PlantFiltersProps {
  search: string;
  type: PlantType | "all";
  onSearchChange: (value: string) => void;
  onTypeChange: (value: PlantType | 'all') => void;
  onSubcategoryChange: (value: RootPlantSubcategory | 'all') => void;
  initialSubcategory: RootPlantSubcategory | 'all';
  growthTimeRange?: [number, number];
  onGrowthTimeRangeChange?: (range: [number, number]) => void;
  phRange?: [number, number];
  onPhRangeChange?: (range: [number, number]) => void;
  temperatureRange?: [number, number];
  onTemperatureRangeChange?: (range: [number, number]) => void;
  sortBy?: string;
  onSortByChange?: (value: string) => void;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
}

// Typeguards
function isValidPlantType(value: string | undefined): value is PlantType | 'all' {
  if (value === undefined) return false;
  return ['all', 'root', 'micro'].includes(value);
}

function isValidRootSubcategory(value: string | undefined | null): value is RootPlantSubcategory | null {
  if (value === undefined || value === null) return true;
  return ['leafy_greens', 'edible_flowers', 'aromatic'].includes(value);
}

export default function PlantFilters({
  onSearchChange,
  onTypeChange,
  search,
  type,
  onSubcategoryChange,
  initialSubcategory,
  growthTimeRange = [0, 100],
  onGrowthTimeRangeChange,
  phRange = [5, 8.5],
  onPhRangeChange,
  temperatureRange = [15, 30],
  onTemperatureRangeChange,
  sortBy = 'name-asc',
  onSortByChange,
  hasActiveFilters = false,
  onClearFilters
}: PlantFiltersProps) {
  const [subcategory, setSubcategory] = useState<RootPlantSubcategory | 'all'>(initialSubcategory);
  const [activeFiltersCount, setActiveFiltersCount] = useState<number>(0);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  useEffect(() => {
    // Count active filters
    let count = 0;
    if (search) count++;
    if (type !== 'all') count++;
    if (subcategory !== 'all') count++;
    if (growthTimeRange[0] !== 0 || growthTimeRange[1] !== 100) count++;
    if (phRange[0] !== 5 || phRange[1] !== 8.5) count++;
    if (temperatureRange[0] !== 15 || temperatureRange[1] !== 30) count++;
    setActiveFiltersCount(count);
  }, [search, type, subcategory, growthTimeRange, phRange, temperatureRange]);

  useEffect(() => {
    if (isValidPlantType(type) && typeof onTypeChange === 'function') {
      onTypeChange(type)
    }
  }, [type, onTypeChange])

  useEffect(() => {
    if (typeof onSearchChange === 'function') {
      onSearchChange(search)
    }
  }, [search, onSearchChange])

  useEffect(() => {
    onSubcategoryChange(subcategory);
  }, [subcategory, onSubcategoryChange]);

  const handleTypeChange = (newType: PlantType | 'all') => {
    onTypeChange(newType);
    if (newType !== 'root') {
      setSubcategory('all');
      onSubcategoryChange('all');
    }
  }

  const handleGrowthTimeChange = (value: number[]) => {
    if (onGrowthTimeRangeChange) {
      onGrowthTimeRangeChange([value[0], value[1]]);
    }
  }

  const handlePhChange = (value: number[]) => {
    if (onPhRangeChange) {
      onPhRangeChange([value[0], value[1]]);
    }
  }

  const handleTemperatureChange = (value: number[]) => {
    if (onTemperatureRangeChange) {
      onTemperatureRangeChange([value[0], value[1]]);
    }
  }

  const handleSortChange = (value: string) => {
    if (onSortByChange) {
      onSortByChange(value);
    }
  }

  return (
    <div className="space-y-4">
      {/* Main filters row */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-grow">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search plants..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Tabs value={type} onValueChange={(value) => handleTypeChange(value as PlantType | 'all')} className="w-auto">
            <TabsList>
              <TabsTrigger value="all" className="flex items-center gap-1">
                All Types
              </TabsTrigger>
                              <TabsTrigger value="root" className="flex items-center gap-1">
                <LeafIcon className="h-4 w-4" />
                Root
              </TabsTrigger>
              <TabsTrigger value="micro" className="flex items-center gap-1">
                <PlantIcon className="h-4 w-4" />
                Microgreens
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort By</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem 
                checked={sortBy === 'name-asc'}
                onCheckedChange={() => handleSortChange('name-asc')}
              >
                Name (A-Z)
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={sortBy === 'name-desc'}
                onCheckedChange={() => handleSortChange('name-desc')}
              >
                Name (Z-A)
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={sortBy === 'growth-fast'}
                onCheckedChange={() => handleSortChange('growth-fast')}
              >
                Fastest Growth
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={sortBy === 'growth-slow'}
                onCheckedChange={() => handleSortChange('growth-slow')}
              >
                Slowest Growth
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={sortBy === 'newest'}
                onCheckedChange={() => handleSortChange('newest')}
              >
                Newest First
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={sortBy === 'oldest'}
                onCheckedChange={() => handleSortChange('oldest')}
              >
                Oldest First
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Advanced Filters Button */}
          <Popover open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <FilterIcon className="h-4 w-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Advanced Filters</h4>
                  {hasActiveFilters && onClearFilters && (
                    <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-8 px-2">
                      <FilterX className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
                
                {/* Type Filter (in the dropdown as well) */}
                <div>
                  <label className="text-sm font-medium leading-none mb-2 flex">
                    <PlantIcon className="h-4 w-4 mr-1" />
                    Plant Type
                  </label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge
                      variant={type === 'all' ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleTypeChange('all')}
                    >
                      All Types
                    </Badge>
                    <Badge
                      variant={type === 'root' ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleTypeChange('root')}
                    >
                      <LeafIcon className="h-3 w-3 mr-1" />
                      Root
                    </Badge>
                    <Badge
                      variant={type === 'micro' ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleTypeChange('micro')}
                    >
                      <PlantIcon className="h-3 w-3 mr-1" />
                      Microgreens
                    </Badge>
                  </div>
                </div>
                
                {/* Subcategory Select (if type is root) */}
                {type === 'root' && (
                  <div>
                    <label className="text-sm font-medium leading-none mb-2 flex">
                      <PlantIcon className="h-4 w-4 mr-1" />
                      Root Subcategory
                    </label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge
                        variant={subcategory === 'all' ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setSubcategory('all')}
                      >
                        All
                      </Badge>
                      <Badge
                        variant={subcategory === 'leafy_greens' ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setSubcategory('leafy_greens')}
                      >
                        <LeafyGreen className="h-3 w-3 mr-1" />
                        Leafy Greens
                      </Badge>
                      <Badge
                        variant={subcategory === 'edible_flowers' ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setSubcategory('edible_flowers')}
                      >
                        <FlowerIcon className="h-3 w-3 mr-1" />
                        Edible Flowers
                      </Badge>
                      <Badge
                        variant={subcategory === 'aromatic' ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setSubcategory('aromatic')}
                      >
                        <EggIcon className="h-3 w-3 mr-1" />
                        Aromatic
                      </Badge>
                    </div>
                  </div>
                )}
                
                {/* Growth Time Range Slider */}
                {onGrowthTimeRangeChange && (
                  <div>
                    <label className="text-sm font-medium leading-none mb-3 flex justify-between">
                      <div className="flex items-center">
                        <TimerIcon className="h-4 w-4 mr-1 text-green-500" />
                        Growth Time
                      </div>
                      <span className="text-sm text-gray-500">{growthTimeRange[0]}-{growthTimeRange[1]} days</span>
                    </label>
                    <Slider
                      defaultValue={growthTimeRange}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={handleGrowthTimeChange}
                      className="my-4"
                    />
                  </div>
                )}
                
                {/* pH Range Slider */}
                {onPhRangeChange && (
                  <div>
                    <label className="text-sm font-medium leading-none mb-3 flex justify-between">
                      <div className="flex items-center">
                        <DropletIcon className="h-4 w-4 mr-1 text-blue-500" />
                        pH Range
                      </div>
                      <span className="text-sm text-gray-500">{phRange[0]}-{phRange[1]}</span>
                    </label>
                    <Slider
                      defaultValue={phRange}
                      min={4}
                      max={9}
                      step={0.1}
                      onValueChange={handlePhChange}
                      className="my-4"
                    />
                  </div>
                )}
                
                {/* Temperature Range Slider */}
                {onTemperatureRangeChange && (
                  <div>
                    <label className="text-sm font-medium leading-none mb-3 flex justify-between">
                      <div className="flex items-center">
                        <ThermometerIcon className="h-4 w-4 mr-1 text-red-500" />
                        Temperature
                      </div>
                      <span className="text-sm text-gray-500">{temperatureRange[0]}°-{temperatureRange[1]}°C</span>
                    </label>
                    <Slider
                      defaultValue={temperatureRange}
                      min={5}
                      max={40}
                      step={1}
                      onValueChange={handleTemperatureChange}
                      className="my-4"
                    />
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Root subcategory dropdown (shown outside the advanced filters if type is root) */}
          {type === 'root' && (
            <Select 
              value={subcategory} 
              onValueChange={(value) => {
                if (isValidRootSubcategory(value) || value === 'all') {
                  setSubcategory(value as RootPlantSubcategory | 'all')
                }
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Subcategory" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Root Subcategories</SelectLabel>
                  <SelectItem value="all">
                    All Subcategories
                  </SelectItem>
                  <SelectItem value="leafy_greens">
                    <div className="flex items-center">
                      <LeafyGreen className="h-4 w-4 mr-2 text-green-500" />
                      Leafy Greens
                    </div>
                  </SelectItem>
                  <SelectItem value="edible_flowers">
                    <div className="flex items-center">
                      <FlowerIcon className="h-4 w-4 mr-2 text-pink-500" />
                      Edible Flowers
                    </div>
                  </SelectItem>
                  <SelectItem value="aromatic">
                    <div className="flex items-center">
                      <EggIcon className="h-4 w-4 mr-2 text-purple-500" />
                      Aromatic
                    </div>
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
          
          {/* Clear Filters Button (shown when filters are active) */}
          {hasActiveFilters && onClearFilters && (
            <Button variant="outline" onClick={onClearFilters}>
              <FilterX className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>
      
      {/* Active filters display */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Active Filters:</span>
          
          {search && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Search className="h-3 w-3" />
              Search: {search.length > 15 ? search.substring(0, 15) + '...' : search}
              <button className="ml-1 hover:text-primary" onClick={() => onSearchChange('')}>×</button>
            </Badge>
          )}
          
          {type !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <PlantIcon className="h-3 w-3" />
              Type: {type}
              <button className="ml-1 hover:text-primary" onClick={() => handleTypeChange('all')}>×</button>
            </Badge>
          )}
          
          {subcategory !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <LeafyGreen className="h-3 w-3" />
              Subcategory: {subcategory.replace('_', ' ')}
              <button className="ml-1 hover:text-primary" onClick={() => setSubcategory('all')}>×</button>
            </Badge>
          )}
          
          {(growthTimeRange[0] !== 0 || growthTimeRange[1] !== 100) && onGrowthTimeRangeChange && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <TimerIcon className="h-3 w-3" />
              Growth: {growthTimeRange[0]}-{growthTimeRange[1]} days
              <button 
                className="ml-1 hover:text-primary" 
                onClick={() => onGrowthTimeRangeChange([0, 100])}
              >×</button>
            </Badge>
          )}
          
          {(phRange[0] !== 5 || phRange[1] !== 8.5) && onPhRangeChange && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <DropletIcon className="h-3 w-3" />
              pH: {phRange[0]}-{phRange[1]}
              <button 
                className="ml-1 hover:text-primary" 
                onClick={() => onPhRangeChange([5, 8.5])}
              >×</button>
            </Badge>
          )}
          
          {(temperatureRange[0] !== 15 || temperatureRange[1] !== 30) && onTemperatureRangeChange && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <ThermometerIcon className="h-3 w-3" />
              Temp: {temperatureRange[0]}°-{temperatureRange[1]}°C
              <button 
                className="ml-1 hover:text-primary" 
                onClick={() => onTemperatureRangeChange([15, 30])}
              >×</button>
            </Badge>
          )}
          
          {onClearFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-7 px-2 text-xs">
              Clear All
            </Button>
          )}
        </div>
      )}
    </div>
  )
}