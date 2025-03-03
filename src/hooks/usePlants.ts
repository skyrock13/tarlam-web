// src/hooks/usePlants.ts
'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { useSupabase } from '@/providers/supabase-provider';
import { Database } from '@/lib/types/supabase';

type Plant = Database['public']['Tables']['plants_catalog']['Row'];
type PlantInsert = Database['public']['Tables']['plants_catalog']['Insert'];
type PlantUpdate = Database['public']['Tables']['plants_catalog']['Update'];

type PlantWithImage = Plant & {
  imageUrl?: string;
};

export function usePlants() {
  const { supabase } = useSupabase()
  const [plants, setPlants] = useState<PlantWithImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const cacheExpiryTimeMs = 60000;
  

  const imageUrlCache = useRef(new Map<string, string>());

  const getImageUrl = useCallback((filename: string | null): string | undefined => {
    if (!filename) return undefined;
    

    if (imageUrlCache.current.has(filename)) {
      return imageUrlCache.current.get(filename);
    }

    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!baseUrl) {
        throw new Error("NEXT_PUBLIC_SUPABASE_URL is not defined");
    }
    const imageUrl = `${baseUrl}/storage/v1/object/public/plant_images/${filename}?width=300&height=225`;

    imageUrlCache.current.set(filename, imageUrl);
    return imageUrl;
  }, []);

  const fetchPlants = useCallback(async (forceRefresh = false) => {

    if (isFetchingRef.current) {
      console.log("Skipping duplicate fetchPlants call - already in progress");
      return;
    }

    const now = Date.now();
    if (!forceRefresh && 
        plants.length > 0 && 
        now - lastFetchTimeRef.current < cacheExpiryTimeMs) {
      console.log("Using cached plants data");
      return;
    }
    
    console.log("Fetching plants from Supabase");
    isFetchingRef.current = true;
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('plants_catalog')
        .select('*')
        .order('name');

      if (error) {
          console.error("Supabase error:", error);
          throw error;
      }

      const plantsWithImageUrls = data.map((plant) => ({
        ...plant,
        imageUrl: getImageUrl(plant.image_filename),
      }));
      
      setPlants(plantsWithImageUrls);
      lastFetchTimeRef.current = now;
    } catch (err) {
      console.error('Error in fetchPlants:', err);
      setError((err instanceof Error) ? err.message : 'Error fetching plants');
      setPlants([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [supabase, getImageUrl, plants.length]);

  const createPlant = useCallback(async (plant: PlantInsert) => {
    try {
      const { data, error } = await supabase
          .from('plants_catalog')
          .insert(plant)
          .select()
          .single();

      if (error) throw error;

      const newPlantWithImage = { 
        ...data, 
        imageUrl: getImageUrl(data.image_filename) 
      };
      
      lastFetchTimeRef.current = Date.now();
      
      setPlants(prevPlants => [...prevPlants, newPlantWithImage]);
      return data;
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, [supabase, getImageUrl]);

  const updatePlant = useCallback(async (id: string, updates: PlantUpdate) => {
    try {
      const { data, error } = await supabase
          .from('plants_catalog')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

      if (error) throw error;

      if (updates.image_filename) {
        imageUrlCache.current.delete(updates.image_filename);
      }

      lastFetchTimeRef.current = Date.now();
      
      setPlants(prevPlants =>
          prevPlants.map(plant =>
              plant.id === id ? { 
                ...plant, 
                ...data, 
                imageUrl: getImageUrl(data.image_filename) 
              } : plant
          )
      );
      return data;
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, [supabase, getImageUrl]);


  const deletePlant = useCallback(async (id: string) => {
    try {
      const plantToDelete = plants.find(p => p.id === id);
      
      const { error } = await supabase
          .from('plants_catalog')
          .delete()
          .eq('id', id);

      if (error) throw error;

      if (plantToDelete?.image_filename) {
        imageUrlCache.current.delete(plantToDelete.image_filename);
      }

      lastFetchTimeRef.current = Date.now();
      
      setPlants(prevPlants => prevPlants.filter(plant => plant.id !== id));
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, [supabase, plants]);
  
  useEffect(() => {
    fetchPlants();
  }, []);

  return {
    plants,
    loading,
    error,
    createPlant,
    updatePlant,
    deletePlant,
    refreshPlants: (force = true) => fetchPlants(force),
    getImageUrl,
  }
}