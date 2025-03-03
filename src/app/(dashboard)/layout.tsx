// src/app/(dashboard)/layout.tsx
import Sidebar from '@/components/shared/sidebar'
import LogoutButton from '@/components/shared/logout';
import { DevicesProvider } from '@/providers/devices-provider';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <aside className="w-64 border-r">
                <Sidebar />
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col">
                {/* Header Bar */}
                <header className="bg-white border-b p-4 shadow-sm flex justify-end">
                    <LogoutButton />
                </header>

                {/* Main Content with DevicesProvider */}
                <div className="p-8 overflow-auto flex-grow">
                    <DevicesProvider>
                        {children}
                    </DevicesProvider>
                </div>
            </main>
        </div>
    );
}