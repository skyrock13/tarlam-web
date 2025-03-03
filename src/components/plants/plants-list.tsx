// src/components/plants/plants-list.tsx
'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card'
import Link from 'next/link'
import {
  Droplet as DropletIcon,
  Thermometer as ThermometerIcon,
  Sun as SunIcon,
  Timer as TimerIcon,
  Wind as WindIcon,
  Leaf as LeafIcon,
  Plus as PlusIcon,
  Search,
  SlidersHorizontal,
  Grid3x3 as Grid3X3,
  LayoutList,
  FilterX,
  RefreshCw,
  Edit,
  Boxes,
  Flower2 as PlantIcon,
  Egg as EggIcon,
  Flower as FlowerIcon,
  GitBranch as Workflow,
  Filter,
  ArrowUpDown,
  ChevronsUpDown,
  Trash2
} from 'lucide-react'
import { usePlants } from '@/hooks/usePlants'
import { LoadingSection } from '@/components/shared/loading'
import Image from 'next/image'
import { Database } from '@/lib/types/supabase'
import PlantForm from '../plants/plant-form'
import EditPlantForm from '../plants/edit-plant-detail-form'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"

type PlantType = Database['public']['Enums']['plant_type']
type RootPlantSubcategory = Database['public']['Enums']['root_plant_subcategory']
type Plant = NonNullable<ReturnType<typeof usePlants>['plants']>[0]

export default function PlantsList() {
  const { plants, loading, error, refreshPlants, deletePlant } = usePlants()
  const [search, setSearch] = useState('')
  const [type, setType] = useState<PlantType | 'all'>('all')
  const [subcategory, setSubcategory] = useState<RootPlantSubcategory | 'all'>('all')
  const [isAddFormOpen, setIsAddFormOpen] = useState(false)
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [sortBy, setSortBy] = useState<string>('name-asc')
  const [confirmDelete, setConfirmDelete] = useState<Plant | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const isInitialMount = useRef(true)

  // Only refresh once when component first mounts
  useEffect(() => {
    if (isInitialMount.current) {
      refreshPlants()
      isInitialMount.current = false
    }
  }, [refreshPlants])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshPlants()
    setTimeout(() => setIsRefreshing(false), 600) // Visual feedback
  }

  const handleEdit = (plant: Plant) => {
    console.log("Selected plant for editing:", plant);
    setSelectedPlant(plant);
    setIsEditFormOpen(true);
  };

  const handleDeleteClick = (plant: Plant) => {
    setConfirmDelete(plant)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (confirmDelete) {
      try {
        await deletePlant(confirmDelete.id)
        setConfirmDelete(null)
        setShowDeleteDialog(false)
        refreshPlants()
      } catch (error) {
        console.error('Error deleting plant:', error)
      }
    }
  }

  // Filter and sort plants
  const filteredPlants = useMemo(() => {
    if (!plants) return []

    let result = [...plants]

    // Search filter
    if (search) {
      const searchTermLower = search.toLowerCase()
      result = result.filter(
        (plant) =>
          plant.name.toLowerCase().includes(searchTermLower) ||
          (plant.scientific_name && plant.scientific_name.toLowerCase().includes(searchTermLower))
      )
    }

    // Type filter
    if (type !== 'all') {
      result = result.filter((plant) => plant.plant_type === type)
    }

    // Subcategory filter
    if (type === 'root' && subcategory !== 'all') {
      result = result.filter((plant) => plant.root_subcategory === subcategory)
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'growth-fast':
          return (a.growth_time || 999) - (b.growth_time || 999)
        case 'growth-slow':
          return (b.growth_time || 0) - (a.growth_time || 0)
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        default:
          return 0
      }
    })

    return result
  }, [plants, search, type, subcategory, sortBy])

  // Count for stats
  const stats = useMemo(() => {
    const rootPlants = plants.filter(p => p.plant_type === 'root').length
    const microPlants = plants.filter(p => p.plant_type === 'micro').length

    return {
      total: plants.length,
      root: rootPlants,
      micro: microPlants,
      categories: {
        leafy: plants.filter(p => p.root_subcategory === 'leafy_greens').length,
        flowers: plants.filter(p => p.root_subcategory === 'edible_flowers').length,
        aromatic: plants.filter(p => p.root_subcategory === 'aromatic').length
      }
    }
  }, [plants])

  if (loading && plants.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <h1 className="text-2xl font-bold">Plants Catalog</h1>
          <Button disabled>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Plant
          </Button>
        </div>

        {/* Skeleton loading state */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-8 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-between gap-4">
          <Skeleton className="h-10 flex-grow" />
          <Skeleton className="h-10 w-[300px]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start">
                  <Skeleton className="w-24 h-24 rounded-md mr-4" />
                  <div className="flex-1">
                    <Skeleton className="h-6 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {[...Array(5)].map((_, j) => (
                    <Skeleton key={j} className="h-5 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <h1 className="text-2xl font-bold">Plants Catalog</h1>
          <Button onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <PlantIcon className="h-16 w-16 text-red-500 mb-4" />
            <p className="text-xl font-medium text-red-500">Error Loading Plants</p>
            <p className="text-red-400 mb-6">{error}</p>
            <Button variant="outline" onClick={handleRefresh}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  function handleFormSuccess(): void {
    throw new Error('Function not implemented.')
  }

  return (
    <div className="space-y-6">
      {/* Header with title and add button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Plants Catalog</h1>
        <Button onClick={() => setIsAddFormOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Plant
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Plants</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <PlantIcon className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Root Plants</p>
                <p className="text-3xl font-bold text-green-600">{stats.root}</p>
              </div>
              <LeafIcon className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Microgreens</p>
                <p className="text-3xl font-bold text-emerald-600">{stats.micro}</p>
              </div>
              <PlantIcon className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <div className="flex gap-2 mt-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="outline" className="bg-green-50">
                          <LeafIcon className="h-3 w-3 mr-1" />
                          {stats.categories.leafy}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>Leafy Greens</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="outline" className="bg-pink-50">
                          <FlowerIcon className="h-3 w-3 mr-1" />
                          {stats.categories.flowers}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>Edible Flowers</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="outline" className="bg-purple-50">
                          <EggIcon className="h-3 w-3 mr-1" />
                          {stats.categories.aromatic}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>Aromatic</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <Boxes className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search plants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Tabs value={type} onValueChange={(value) => {
            setType(value as PlantType | 'all')
            if (value !== 'root') setSubcategory('all')
          }} className="w-auto">
            <TabsList>
              <TabsTrigger value="all">All Types</TabsTrigger>
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

          {type === 'root' && (
            <Select value={subcategory} onValueChange={(value) => setSubcategory(value as RootPlantSubcategory | 'all')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Subcategory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subcategories</SelectItem>
                <SelectItem value="leafy_greens">Leafy Greens</SelectItem>
                <SelectItem value="edible_flowers">Edible Flowers</SelectItem>
                <SelectItem value="aromatic">Aromatic</SelectItem>
              </SelectContent>
            </Select>
          )}

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
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setSortBy('name-asc')}>
                  Name (A-Z)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('name-desc')}>
                  Name (Z-A)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('growth-fast')}>
                  Fastest Growth
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('growth-slow')}>
                  Slowest Growth
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('newest')}>
                  Newest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('oldest')}>
                  Oldest First
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {(search || type !== 'all' || subcategory !== 'all') && (
            <Button
              variant="outline"
              onClick={() => {
                setSearch('')
                setType('all')
                setSubcategory('all')
              }}
            >
              <FilterX className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>

          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <LayoutList className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Plants display */}
      {filteredPlants.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <PlantIcon className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-xl font-medium text-gray-500">No plants found</p>
            <p className="text-gray-400 mb-6">Try adjusting your search filters</p>
            <div className="flex gap-2">
              {(search || type !== 'all' || subcategory !== 'all') ? (
                <Button variant="outline" onClick={() => {
                  setSearch('')
                  setType('all')
                  setSubcategory('all')
                }}>
                  Clear Filters
                </Button>
              ) : (
                <Button onClick={() => setIsAddFormOpen(true)}>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Your First Plant
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlants.map((plant) => (
            <PlantCard
              key={plant.id}
              plant={plant}
              onEdit={() => handleEdit(plant)}
              onDelete={() => handleDeleteClick(plant)}
            />
          ))}
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plant
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type/Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Growth Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Parameters
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPlants.map((plant) => (
                  <tr key={plant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {plant.imageUrl ? (
                          <div className="relative w-10 h-10 mr-3 flex-shrink-0">
                            <Image
                              src={plant.imageUrl}
                              alt={plant.name}
                              fill
                              className="object-cover rounded-md"
                              sizes="40px"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 mr-3 bg-gray-100 flex items-center justify-center rounded-md flex-shrink-0">
                            <PlantIcon className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{plant.name}</div>
                          <div className="text-xs text-gray-500">{plant.scientific_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline" className={plant.plant_type === 'root' ? 'bg-green-50' : 'bg-blue-50'}>
                        {plant.plant_type === 'root' ? (
                          <LeafIcon className="h-3 w-3 mr-1" />
                        ) : (
                          <PlantIcon className="h-3 w-3 mr-1" />
                        )}
                        {plant.plant_type}
                      </Badge>
                      {plant.root_subcategory && (
                        <div className="mt-1">
                          <Badge variant="outline" className="bg-gray-50 text-xs">
                            {plant.root_subcategory === 'leafy_greens' && 'Leafy Greens'}
                            {plant.root_subcategory === 'edible_flowers' && 'Edible Flowers'}
                            {plant.root_subcategory === 'aromatic' && 'Aromatic'}
                          </Badge>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <TimerIcon className="h-4 w-4 text-green-500 mr-1" />
                        <span>{plant.growth_time} days</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-xs">
                        <div className="flex items-center gap-1">
                          <DropletIcon className="h-3 w-3 text-blue-500" />
                          <span>pH: {plant.ph_min}-{plant.ph_max}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ThermometerIcon className="h-3 w-3 text-red-500" />
                          <span>{plant.temperature_min}°-{plant.temperature_max}°C</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <SunIcon className="h-3 w-3 text-yellow-500" />
                          <span>{plant.light_hours}h light</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link href={`/plants/${plant.id}`}>
                          <Button variant="outline" size="sm">View</Button>
                        </Link>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(plant)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(plant)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Add Plant Form */}
      <PlantForm
        open={isAddFormOpen}
        onClose={() => setIsAddFormOpen(false)}
        onSuccess={() => {
          refreshPlants();
          setIsAddFormOpen(false);
        }}
      />
      {/* Edit Plant Form */}

      {selectedPlant && (
        <EditPlantForm
          open={isEditFormOpen}
          onClose={() => {
            setIsEditFormOpen(false);
            setSelectedPlant(null);
          }}
          onSuccess={() => {
            refreshPlants();
            setIsEditFormOpen(false);
            setSelectedPlant(null);
          }}
          initialPlant={selectedPlant}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{confirmDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// PlantCard component
interface PlantCardProps {
  plant: Plant
  onEdit: () => void
  onDelete: () => void
}

function PlantCard({ plant, onEdit, onDelete }: PlantCardProps) {
  // Helper function for displaying plant metrics
  function MetricItem({ icon, label, className, tooltip }: {
    icon: React.ReactNode,
    label: string,
    className?: string,
    tooltip?: string
  }) {
    const content = (
      <div className={`flex items-center gap-1 ${className || ""}`}>
        {icon}
        <span className="text-sm">{label}</span>
      </div>
    );

    if (tooltip) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {content}
            </TooltipTrigger>
            <TooltipContent>
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return content;
  }

  // Helper for getting subcategory display name
  const getSubcategoryName = (subcategory: string) => {
    switch (subcategory) {
      case 'leafy_greens': return 'Leafy Greens';
      case 'edible_flowers': return 'Edible Flowers';
      case 'aromatic': return 'Aromatic';
      default: return subcategory;
    }
  };

  // Helper for getting subcategory icon
  const getSubcategoryIcon = (subcategory: string) => {
    switch (subcategory) {
      case 'leafy_greens': return <LeafIcon className="h-3 w-3 mr-1" />;
      case 'edible_flowers': return <FlowerIcon className="h-3 w-3 mr-1" />;
      case 'aromatic': return <EggIcon className="h-3 w-3 mr-1" />;
      default: return null;
    }
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start">
          {plant.imageUrl ? (
            <div className="relative w-24 h-24 mr-4 flex-shrink-0 rounded-md overflow-hidden">
              <Image
                src={plant.imageUrl}
                alt={plant.name}
                fill
                className="object-cover"
                sizes="(max-width: 767px) 50vw, (max-width: 1023px) 25vw, 16vw"
              />
            </div>
          ) : (
            <div className="w-24 h-24 mr-4 bg-gray-100 flex items-center justify-center rounded-md flex-shrink-0">
              <PlantIcon className="h-10 w-10 text-gray-400" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{plant.name}</h3>
                <p className="text-sm text-muted-foreground italic">
                  {plant.scientific_name}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <Badge variant="outline" className={plant.plant_type === 'root' ? 'bg-green-50' : 'bg-blue-50'}>
                  {plant.plant_type === 'root' ? (
                    <LeafIcon className="h-3 w-3 mr-1" />
                  ) : (
                    <PlantIcon className="h-3 w-3 mr-1" />
                  )}
                  {plant.plant_type}
                </Badge>
                {plant.root_subcategory && (
                  <Badge variant="outline" className="bg-gray-50 text-xs">
                    {getSubcategoryIcon(plant.root_subcategory)}
                    {getSubcategoryName(plant.root_subcategory)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="col-span-2 bg-gray-50 p-2 rounded-md flex items-center gap-2">
            <TimerIcon className="h-4 w-4 text-green-500" />
            <span className="font-medium">Growth Time: {plant.growth_time || 'N/A'} days</span>
          </div>

          <MetricItem
            icon={<DropletIcon className="h-4 w-4 text-blue-500" />}
            label={`pH: ${plant.ph_min || '?'}-${plant.ph_max || '?'}`}
            tooltip="Optimal pH range"
          />

          <MetricItem
            icon={<DropletIcon className="h-4 w-4 text-blue-500" />}
            label={`EC: ${plant.ec_min || '?'}-${plant.ec_max || '?'} ms/cm`}
            tooltip="Electrical conductivity range"
          />

          <MetricItem
            icon={<ThermometerIcon className="h-4 w-4 text-red-500" />}
            label={`${plant.temperature_min || '?'}°-${plant.temperature_max || '?'}°C`}
            tooltip="Temperature range"
          />

          <MetricItem
            icon={<SunIcon className="h-4 w-4 text-yellow-500" />}
            label={`${plant.light_hours || '?'}h light`}
            tooltip="Daily light hours"
          />

          {plant.humidity_min && plant.humidity_max && (
            <MetricItem
              icon={<WindIcon className="h-4 w-4 text-blue-500" />}
              label={`${plant.humidity_min}%-${plant.humidity_max}%`}
              tooltip="Humidity range"
            />
          )}

          {plant.growing_parameters?.difficulty_level && (
            <MetricItem
              icon={<Workflow className="h-4 w-4 text-purple-500" />}
              label={`Difficulty: ${plant.growing_parameters.difficulty_level}`}
              tooltip="Cultivation difficulty"
            />
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0 px-4 pb-4 flex justify-between mt-auto">
        <Link href={`/plants/${plant.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">View Details</Button>
        </Link>
        <div className="flex gap-1 ml-2">
          <Button variant="ghost" size="sm" onClick={(e) => {
            e.preventDefault();
            onEdit();
          }}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={(e) => {
            e.preventDefault();
            onDelete();
          }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}