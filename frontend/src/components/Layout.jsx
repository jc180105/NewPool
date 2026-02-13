import { Outlet } from 'react-router-dom';
import { Home } from 'lucide-react';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';
import { Toaster } from 'sonner';

export default function Layout() {
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col font-sans antialiased text-slate-100 selection:bg-cyan-500/30">
            <Toaster richColors position="top-center" theme="dark" />

            {/* Desktop Sidebar */}
            <Sidebar />

            {/* Mobile Header */}
            <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-lg border-b border-slate-800 shrink-0 md:pl-64 transition-all duration-300">
                <div className="px-5 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
                    <div className="flex items-center gap-3 md:hidden">
                        <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/20">
                            <Home className="w-5 h-5 text-white" aria-hidden="true" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-white leading-none">PoolService</h1>
                            <span className="text-[10px] text-slate-400 font-medium tracking-wide">Gerenciamento</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 w-full sm:px-4 md:pl-64 transition-all duration-300">
                <div className="p-4 md:p-6 pb-24 md:pb-6">
                    <Outlet />
                </div>
            </main>

            {/* Bottom Navigation */}
            <BottomNav />
        </div>
    );
}
