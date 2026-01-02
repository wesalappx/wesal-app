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
        <div className="min-h-screen bg-slate-950 flex font-sans selection:bg-primary-500/30 text-white" dir="ltr">
            {/* Ultra Background Experience */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                {/* Deep atmospheric glow */}
                <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-primary-500/10 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
                <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px]" />

                {/* Noise Texture Overlay (Optional, if we had the asset, but let's stick to pure CSS via gradients) */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] contrast-150 brightness-100" />
            </div>

            {/* Sidebar */}
            <AdminSidebar userEmail={session.email} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative z-10 overflow-hidden">
                {/* Top bar */}
                <header className="h-20 flex items-center px-8 border-b border-white/5 bg-slate-900/20 backdrop-blur-md">
                    <div className="flex-1" />
                    <Link
                        href="/dashboard"
                        className="group flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-white/10 hover:border-primary-500/50 hover:bg-primary-500/10 transition-all duration-300"
                    >
                        <span className="text-sm font-medium text-slate-400 group-hover:text-primary-300 transition-colors">
                            ← Back to App
                        </span>
                    </Link>
                </header>

                {/* Scrollable Content */}
                <main className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    <div className="max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

