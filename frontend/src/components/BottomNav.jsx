import { Home, Users, FileText, Calendar, DollarSign } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function BottomNav() {
    const location = useLocation();
    const pathname = location.pathname;

    const tabs = [
        { id: 'inicio', path: '/', icon: Home, label: 'Início', matchExact: true },
        { id: 'clientes', path: '/clients', icon: Users, label: 'Clientes' },
        { id: 'templates', path: '/templates', icon: FileText, label: 'Contratos' },
        { id: 'agenda', path: '/schedule', icon: Calendar, label: 'Agenda' },
        { id: 'financeiro', path: '/expenses', icon: DollarSign, label: 'Finanças' },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 pb-safe-area-bottom z-50">
            <nav className="flex items-center justify-around px-2 py-3">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = tab.matchExact
                        ? pathname === tab.path
                        : pathname.startsWith(tab.path);

                    return (
                        <Link
                            key={tab.id}
                            to={tab.path}
                            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            <div className={`p-1 rounded-lg transition-all ${isActive ? 'bg-cyan-500/10' : ''
                                }`}>
                                <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
                            </div>
                            <span className="text-[10px] font-medium">{tab.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
