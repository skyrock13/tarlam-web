
// src/components/admin/device-model-list.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/types/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LoadingSection } from '@/components/shared/loading';
import { Search, Edit, Trash2, RefreshCw, Image } from 'lucide-react';
import DeviceModelForm from './device-model-form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';

export default function DeviceModelList() {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<any>(null);
  const { toast } = useToast();
  
  const supabase = createClientComponentClient<Database>();
  
  const fetchModels = async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('device_models')
        .select(`
          *,
          device_categories (id, name),
          device_types (id, name)
        `)
        .order('name');
        
      if (error) throw error;
      
      setModels(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };
  
  useEffect(() => {
    fetchModels();
  }, []);
  
  const handleEdit = (model: any) => {
    setSelectedModel(model);
    setIsEditFormOpen(true);
  };
  
  const handleDelete = (model: any) => {
    setModelToDelete(model);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!modelToDelete) return;
    
    try {
      const { error } = await supabase
        .from('device_models')
        .delete()
        .eq('id', modelToDelete.id);
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Device model deleted successfully',
      });
      
      fetchModels();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setModelToDelete(null);
    }
  };
  
  const filteredModels = models.filter(model =>
    model.name.toLowerCase().includes(search.toLowerCase()) ||
    model.device_categories?.name.toLowerCase().includes(search.toLowerCase()) ||
    model.device_types?.name.toLowerCase().includes(search.toLowerCase())
  );
  
  if (loading) {
    return <LoadingSection text="Loading device models..." />;
  }
  
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-grow">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search models..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={fetchModels}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      
      {filteredModels.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-xl font-medium text-gray-500">No device models found</p>
            <p className="text-gray-400 mb-6">Try adding a new device model</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>                
                <TableHead className="text-center">Image</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredModels.map((model) => (
                <TableRow key={model.id}>
                  <TableCell className="font-medium">{model.name}</TableCell>
                  <TableCell>
                    {model.device_categories?.name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {model.device_types?.name || 'N/A'}
                  </TableCell>
                  <TableCell className="text-center">
                    {model.image_filename ? (
                      <Badge variant="outline" className="bg-green-50">
                        <Image className="h-3 w-3 mr-1" />
                        Yes
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50">No</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEdit(model)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(model)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {selectedModel && (
        <DeviceModelForm
          open={isEditFormOpen}
          onClose={() => {
            setIsEditFormOpen(false);
            setSelectedModel(null);
          }}
          onSuccess={() => {
            fetchModels();
            setIsEditFormOpen(false);
            setSelectedModel(null);
          }}
          initialData={selectedModel}
        />
      )}
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Device Model</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{modelToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}