'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { DeviceWithDetails } from '@/hooks/useDevices';
import { useDevicesContext } from '@/providers/devices-provider';
import { Database } from '@/lib/types/supabase';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	SelectGroup,
	SelectLabel,
} from '@/components/ui/select';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Label } from '../ui/label';
import { toast } from "@/components/ui/use-toast"


interface DeviceFormProps {
	onClose: () => void;
	onSuccess: () => void;
	open: boolean;
	initialDevice?: DeviceWithDetails | null;  // Keep this for editing
	users: Database['public']['Tables']['users']['Row'][] | null; // Allow null
	isAdmin: boolean; // Admin kontrolü
	currentUser: Database['public']['Tables']['users']['Row'] | null;
}

export default function DeviceForm({
	onClose,
	onSuccess,
	open,
	initialDevice,
	users,
	isAdmin,
	currentUser
}: DeviceFormProps) {
	const { createDevice, updateDevice } = useDevicesContext();
	const [name, setName] = useState('');
	const [serialNumber, setSerialNumber] = useState('');
	const [modelId, setModelId] = useState('');
	const [firmwareVersion, setFirmwareVersion] = useState('');
	const [userId, setUserId] = useState<string | null>(null); // Seçilen kullanıcı ID'si
	const [newUserName, setNewUserName] = useState(''); // Yeni kullanıcı adı
	const [newUserSurname, setNewUserSurname] = useState(''); // Yeni kullanıcı soyadı
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [availableModels, setAvailableModels] = useState<
		Database['public']['Tables']['device_models']['Row'][]
	>([]);
	const [modelsLoaded, setModelsLoaded] = useState(false);

	const supabaseRef = useRef(createClientComponentClient<Database>());
	const supabase = supabaseRef.current;

	useEffect(() => {
		const fetchModels = async () => {
			if (modelsLoaded || !open) {
				return;
			}

			try {
				const { data, error } = await supabase.from('device_models').select('*');

				if (error) {
					console.error('Error fetching device models:', error);
					setError('Failed to load device models.');
					return;
				}

				setAvailableModels(data || []);
				setModelsLoaded(true);
			} catch (err) {
				console.error('Exception when fetching models:', err);
				setError('An unexpected error occurred loading device models.');
			}
		};

		fetchModels();
	}, [supabase, open, modelsLoaded]);

	useEffect(() => {
		if (!open) return;

		// --- IMPORTANT: This section handles the form's behavior ---
		if (initialDevice) {
			// Editing an existing device (admin or user editing their own)
			setName(initialDevice.name);
			setSerialNumber(initialDevice.serial_number);
			setModelId(initialDevice.model_id);
			setFirmwareVersion(initialDevice.firmware_version || '');
			setUserId(initialDevice.user_devices && initialDevice.user_devices[0] ? initialDevice.user_devices[0].user_id : null);
		} else if (!isAdmin) {
			// Adding a new device (non-admin user only) - clear other fields
			setName('');
			setModelId('');
			setFirmwareVersion('');
			setUserId(null); // No user selection for non-admins
			setNewUserName('');
			setNewUserSurname('');
		} // No else case needed:  If !initialDevice && isAdmin, the form shouldn't even open.

		setError(null);
	}, [initialDevice, open, isAdmin]);  // Depend on isAdmin


	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError(null);

		// Validation: Serial Number is ALWAYS required
		if (!serialNumber) {
			setError('Serial Number is required.');
			setIsSubmitting(false);
			return;
		}
		// Admin-specific validation (when editing)
        if (isAdmin && initialDevice && (!modelId || !name)) {
            setError('Model ID and Name are required for admins.');
            setIsSubmitting(false);
            return;
        }

		try {
			let deviceData: any = {
				serial_number: serialNumber,
			};

			// Admin-specific fields (only when editing):
			if (isAdmin && initialDevice) {
				deviceData = {
					...deviceData,
					name,
					model_id: modelId,
					firmware_version: firmwareVersion,
				};
			}

			let deviceId: string;

			if (initialDevice) {
                //Updating device
				await updateDevice(initialDevice.id, deviceData);
				deviceId = initialDevice.id;
			} else {
                //Adding device.
				const { data, error: createError } = await createDevice(deviceData);
				if (createError) {
					toast({
						variant: "destructive",
						title: "Uh oh! Something went wrong.",
						description: (createError as Error).message,
					});
					throw createError;
				}
				deviceId = data.id;
			}

			// User assignment (admin only when editing):
            if (isAdmin && initialDevice) {
                if (userId) {
                    // Reassign to a different user
                    // First, delete the existing association
                    const { error: deleteError } = await supabase
                        .from('user_devices')
                        .delete()
                        .eq('device_id', deviceId);
                    if (deleteError) throw deleteError;

                    // Then, create the new association
                    const { error: insertError } = await supabase
                        .from('user_devices')
                        .insert({ user_id: userId, device_id: deviceId });
                    if (insertError) throw insertError;

                } else if (newUserName && newUserSurname) {

                     // First, delete the existing association
                    const { error: deleteError } = await supabase
                        .from('user_devices')
                        .delete()
                        .eq('device_id', deviceId);
                    if (deleteError) throw deleteError;

                    //Create the new user and assign
                    const { error: createUserError } = await supabase
                        .from('users')
                        .insert({ first_name: newUserName, last_name: newUserSurname }); //Correct insert
                    if (createUserError) throw createUserError;

                    const { data: newUserData, error: selectError } = await supabase
                        .from('users')
                        .select('id')
                        .eq('first_name', newUserName) // Use a unique identifier from your insert
                        .eq('last_name', newUserSurname)
                        .single(); // Use .single()

                    if(selectError) throw selectError;
                    if(!newUserData) throw new Error("New user data could not found");

                    const newUserId = newUserData.id;

                    const { error: assignError } = await supabase
                        .from('user_devices')
                        .insert({ user_id: newUserId, device_id: deviceId });
                    if (assignError) throw assignError;
                }
            }
            else if (!isAdmin)
            {
                //Assign the device to current user.
                if (!currentUser || !currentUser.id) {
                    setError("Current user is not set");
                    return;
                }
                const { error } = await supabase
                    .from('user_devices')
                    .insert({ user_id: currentUser.id, device_id: deviceId });
                if (error) throw error;
            }

			onSuccess();
			onClose();
		} catch (error: any) {
			console.error('Error saving device:', error);
			setError(error.message || 'An error occurred');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>{initialDevice ? 'Edit Device' : 'Add New Device'}</DialogTitle>
					<DialogDescription>
						{initialDevice
							? 'Modify the device details.'
							: 'Enter the serial number of the device.'}  {/* Simplified description */}
					</DialogDescription>
				</DialogHeader>

				{error && <div className="text-red-500 mb-4">{error}</div>}

				<form onSubmit={handleSubmit} id="deviceForm" className="grid gap-4 py-4">
					{/* Serial Number (Always shown) */}
					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="serialNumber" className="text-right">
							Serial Number
						</Label>
						<Input
							id="serialNumber"
							value={serialNumber}
							onChange={(e) => setSerialNumber(e.target.value)}
							required
							className="col-span-3"
							disabled={isSubmitting}
						/>
					</div>

					{/* Admin-only fields (ONLY when editing) */}
					{isAdmin && initialDevice && (
						<>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="name" className="text-right">
									Name
								</Label>
								<Input
									id="name"
									value={name}
									onChange={(e) => setName(e.target.value)}
									className="col-span-3"
									disabled={isSubmitting}
								/>
							</div>

							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="modelId" className="text-right">
									Model
								</Label>
								<Select
									value={modelId}
									onValueChange={setModelId}
									disabled={isSubmitting || !modelsLoaded}
								>
									<SelectTrigger id="modelId" className="col-span-3">
										<SelectValue placeholder={modelsLoaded ? 'Select a device model' : 'Loading models...'} />
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											<SelectLabel>Models</SelectLabel>
											{availableModels.map((model) => (
												<SelectItem key={model.id} value={model.id}>
													{model.name}
												</SelectItem>
											))}
										</SelectGroup>
									</SelectContent>
								</Select>
							</div>

							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="firmwareVersion" className="text-right">
									Firmware Version
								</Label>
								<Input
									id="firmwareVersion"
									value={firmwareVersion}
									onChange={(e) => setFirmwareVersion(e.target.value)}
									className="col-span-3"
									disabled={isSubmitting}
								/>
							</div>

							{/* User Selection (Existing Users) */}
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="userId" className="text-right">
									Assign User
								</Label>
								<Select
									value={userId || ''}
									onValueChange={(value) => setUserId(value === '' ? null : value)}
									disabled={isSubmitting}
								>
									<SelectTrigger id="userId" className="col-span-3">
										<SelectValue placeholder="Select an existing user" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="">
											<em>None</em>
										</SelectItem>
										{users && users.map((user) => (
											<SelectItem key={user.id} value={user.id}>
												{user.first_name} {user.last_name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{/* Create New User */}
							<div className="grid grid-cols-4 items-center gap-4">
								<Label className="text-right">
									Or Create User
								</Label>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="newUserName" className="text-right">
									First Name
								</Label>
								<Input
									id="newUserName"
									value={newUserName}
									onChange={(e) => setNewUserName(e.target.value)}
									className="col-span-3"
									disabled={isSubmitting}
								/>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="newUserSurname" className="text-right">
									Last Name
								</Label>
								<Input
									id="newUserSurname"
									value={newUserSurname}
									onChange={(e) => setNewUserSurname(e.target.value)}
									className="col-span-3"
									disabled={isSubmitting}
								/>
							</div>
						</>
					)}
				</form>

				<DialogFooter>
					<Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
						Cancel
					</Button>
					<Button type="submit" disabled={isSubmitting} variant="default" form="deviceForm">
						{/* Simpler button text */}
						{initialDevice ? 'Save Changes' : 'Add Device'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}