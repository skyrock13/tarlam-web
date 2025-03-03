// src/components/admin/device-model-form.tsx
'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/types/supabase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

interface DeviceModelFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export default function DeviceModelForm({ open, onClose, onSuccess, initialData }: DeviceModelFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [categoryId, setCategoryId] = useState(initialData?.category_id || '');
  const [typeId, setTypeId] = useState(initialData?.type_id || '');  
  const [specifications, setSpecifications] = useState(
    initialData?.specifications ? JSON.stringify(initialData.specifications, null, 2) : '{}'
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const { toast } = useToast();
  
  const supabase = createClientComponentClient<Database>();

  // Kategori ve tipleri yükle
  useState(() => {
    const fetchData = async () => {
      const { data: categoriesData } = await supabase.from('device_categories').select('*');
      const { data: typesData } = await supabase.from('device_types').select('*');
      
      if (categoriesData) setCategories(categoriesData);
      if (typesData) setTypes(typesData);
    };
    
    fetchData();
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    if (!name || !categoryId || !typeId) {
      setError('Name, Category and Type are required');
      setIsSubmitting(false);
      return;
    }
    
    try {
      let imageFilename = initialData?.image_filename || null;
      
      // Dosya yükleme
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        // device_type adını bulup, boşlukları '_' ile değiştiriyoruz.
        const typeObj = types.find(t => t.id === typeId);
        const typeName = typeObj ? typeObj.name : name;
        const fileName = `model_${typeName.toLowerCase().replace(/\s+/g, '_')}.${fileExt}`;
       
        const { error: uploadError } = await supabase.storage
          .from('device_images')
          .upload(fileName, selectedFile, { upsert: true });
          
        if (uploadError) throw uploadError;
        
        imageFilename = fileName;
      }
      
      let specs = {};
      try {
        specs = JSON.parse(specifications);
      } catch (e) {
        setError('Invalid JSON in specifications');
        setIsSubmitting(false);
        return;
      }
      
      const modelData = {
        name,
        description,
        category_id: categoryId,
        type_id: typeId,
        specifications: specs,
        image_filename: imageFilename
      };
      
      if (initialData) {        
        const { error: updateError } = await supabase
          .from('device_models')
          .update(modelData)
          .eq('id', initialData.id);
          
        if (updateError) throw updateError;
        
        toast({
          title: 'Success',
          description: 'Device model updated successfully',
        });
      } else {        
        const { error: insertError } = await supabase
          .from('device_models')
          .insert(modelData);
          
        if (insertError) throw insertError;
        
        toast({
          title: 'Success',
          description: 'Device model added successfully',
        });
      }
      
      onSuccess();
      
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Device Model' : 'Add New Device Model'}</DialogTitle>
          <DialogDescription>
            {initialData 
              ? 'Update the details of this device model.' 
              : 'Fill in the details to create a new device model.'}
          </DialogDescription>
        </DialogHeader>
        
        {error && <div className="text-red-500 mb-4">{error}</div>}
        
        <form onSubmit={handleSubmit} id="deviceModelForm" className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">Category</Label>
            <Select 
              value={categoryId} 
              onValueChange={setCategoryId}
              disabled={isSubmitting}
            >
              <SelectTrigger id="category" className="col-span-3">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">Type</Label>
            <Select 
              value={typeId} 
              onValueChange={setTypeId}
              disabled={isSubmitting}
            >
              <SelectTrigger id="type" className="col-span-3">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                {types.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="specifications" className="text-right">Specifications (JSON)</Label>
            <Textarea
              id="specifications"
              value={specifications}
              onChange={(e) => setSpecifications(e.target.value)}
              className="col-span-3 font-mono text-sm"
              rows={5}
              disabled={isSubmitting}
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="image" className="text-right">Image</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="col-span-3"
              disabled={isSubmitting}
            />
          </div>
        </form>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="deviceModelForm" disabled={isSubmitting}>
            {isSubmitting 
              ? (initialData ? 'Updating...' : 'Creating...') 
              : (initialData ? 'Update Model' : 'Create Model')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
