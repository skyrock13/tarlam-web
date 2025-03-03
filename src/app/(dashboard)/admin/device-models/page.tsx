// src/app/(dashboard)/admin/device-models/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/providers/supabase-provider';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusIcon, Edit, Trash2 } from 'lucide-react';
import { LoadingSection } from '@/components/shared/loading';
import DeviceModelForm from '../device-model-form';
import DeviceModelList from '../device-model-list';

export default function DeviceModelsPage() {
    const { supabase, user } = useSupabase();
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [activeTab, setActiveTab] = useState('models');
    const [isFormOpen, setIsFormOpen] = useState(false);

    useEffect(() => {
        // Admin kontrolü
        if (user?.user_metadata?.is_admin || user?.user_metadata?.is_super_admin || user?.app_metadata?.admin === true) {
            setIsAdmin(true);
        } else {
            setIsAdmin(false);
        }
        setLoading(false);
    }, [user]);

    if (loading) {
        return <LoadingSection text="Loading..." />;
    }

    if (!isAdmin) {
        return (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-red-500">You don't have permission to access this page.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Device Models Management</h1>
                {activeTab === 'models' && (
                    <Button onClick={() => setIsFormOpen(true)}>
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Add New Model
                    </Button>
                )}
            </div>

            <DeviceModelList />

            <DeviceModelForm
                open={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSuccess={() => {
                    setIsFormOpen(false);                    
                }}
            />
        </div>
    );
}