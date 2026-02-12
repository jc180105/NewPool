import { Home, Users, FileText, Calendar, DollarSign, Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar() {
    const location = useLocation();
    const pathname = location.pathname;

    const tabs = [
        { id: 'inicio', path: '/', icon: Home, label: 'Início', matchExact: true },
        { id: 'clientes', path: '/clients', icon: Users, label: 'Clientes' },
        { id: 'templates', path: '/templates', icon: FileText, label: 'Contratos' },
        { id: 'agenda', path: '/schedule', icon: Calendar, label: 'Agenda Semanal' },
        { id: 'financeiro', path: '/expenses', icon: DollarSign, label: 'Financeiro' },
    ];

    return (
        <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-slate-900 border-r border-slate-800 flex-col z-40">
            {/* Logo Area */}
            <div className="p-6 flex items-center gap-3 border-b border-slate-800/50">
                <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/20">
                    <Home className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white leading-none">PoolService</h1>
                    <span className="text-xs text-slate-400 font-medium tracking-wide">Gerenciamento</span>
                </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = tab.matchExact
                        ? pathname === tab.path
                        : pathname.startsWith(tab.path);

                    return (
                        <Link
                            key={tab.id}
                            to={tab.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${isActive
                                ? 'bg-cyan-500/10 text-cyan-400'
                                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                }`}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-cyan-500 rounded-r-full shadow-[0_0_12px_rgba(6,182,212,0.5)]" />
                            )}

                            <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'
                                }`} />
                            <span className="font-medium">{tab.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile / Footer Area */}
            <div className="p-4 border-t border-slate-800/50">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-xs">
                        PS
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">Admin</p>
                        <p className="text-xs text-slate-500 truncate">admin@pool.com</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
