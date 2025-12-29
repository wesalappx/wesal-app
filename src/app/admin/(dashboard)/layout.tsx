import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAdminSession } from '@/lib/admin/auth';
import AdminSidebar from '@/components/admin/AdminSidebar';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
    const session = await getAdminSession();

    if (!session) {
        redirect('/admin/login');
    }

    return (
        <div className="min-h-screen bg-slate-950 flex font-sans selection:bg-primary-500/30" dir="ltr">
            {/* Background Gradients */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[100px] animate-pulse-slow" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent-500/10 rounded-full blur-[100px] animate-pulse-slow delay-700" />
            </div>

            {/* Sidebar */}
            <AdminSidebar userEmail={session.email} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative z-10">
                {/* Top bar */}
                <header className="h-20 flex items-center px-8 border-b border-white/5">
                    <div className="flex-1" />
                    <Link
                        href="/dashboard"
                        className="group flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/50 border border-white/10 hover:border-primary-500/50 hover:bg-primary-500/10 transition-all duration-300"
                    >
                        <span className="text-sm font-medium text-slate-400 group-hover:text-primary-300 transition-colors">
                            ← Back to App
                        </span>
                    </Link>
                </header>

                {/* Page content */}
                <main className="flex-1 p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

