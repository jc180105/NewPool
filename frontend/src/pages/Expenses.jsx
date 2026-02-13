import { useState, useEffect } from 'react';
import {
    Plus, DollarSign, Trash, Calendar, TrendingUp, TrendingDown,
    PieChart, Users, AlertCircle, FileText, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { fetchExpenses, createExpense, deleteExpense, fetchInstances, fetchClients } from '../services/api';
import { format, startOfMonth, endOfMonth, subMonths, isAfter, isBefore, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    Cell
} from 'recharts';

// --- Sub-components ---

function MetricCard({ title, value, subtext, icon: Icon, trend, color }) {
    return (
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 relative overflow-hidden group hover:border-slate-600/50 transition-all">
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
                <Icon className="w-16 h-16" />
            </div>
            <div className="relative z-10">
                <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-white mb-2">{value}</h3>
                {subtext && (
                    <div className="flex items-center gap-2 text-xs">
                        <span className={`px-1.5 py-0.5 rounded ${trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : trend === 'down' ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-700 text-slate-400'}`}>
                            {trend === 'up' ? <ArrowUpRight className="w-3 h-3 inline" /> : trend === 'down' ? <ArrowDownRight className="w-3 h-3 inline" /> : null}
                            {subtext}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

function DuePaymentsList({ clients }) {
    const today = new Date();
    const currentDay = today.getDate();

    const dueClients = clients
        .filter(c => c.payment_due_day)
        .map(c => {
            const dueDay = c.payment_due_day;
            let status = 'upcoming';
            let daysDiff = dueDay - currentDay;

            if (daysDiff < 0) status = 'late';
            else if (daysDiff <= 7) status = 'soon';
            else return null; // Not relevant yet

            return { ...c, status, daysDiff };
        })
        .filter(Boolean)
        .sort((a, b) => a.daysDiff - b.daysDiff);

    return (
        <div className="bg-slate-800/30 rounded-2xl border border-slate-700/30 p-4 h-full">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Atenção / Vencimentos
            </h3>
            <div className="space-y-3 overflow-y-auto max-h-[300px] custom-scrollbar pr-2">
                {dueClients.length === 0 ? (
                    <p className="text-slate-500 text-sm italic">Nenhum vencimento próximo.</p>
                ) : (
                    dueClients.map(client => (
                        <div key={client.id} className="flex justify-between items-center p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                            <div>
                                <p className="text-white text-sm font-medium">{client.name}</p>
                                <p className="text-slate-500 text-xs">Dia {client.payment_due_day}</p>
                            </div>
                            <div className="text-right">
                                {client.status === 'late' ? (
                                    <span className="text-xs bg-rose-500/10 text-rose-400 px-2 py-1 rounded border border-rose-500/20">
                                        Atrasado ({Math.abs(client.daysDiff)}d)
                                    </span>
                                ) : (
                                    <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-1 rounded border border-amber-500/20">
                                        {client.daysDiff === 0 ? 'Hoje' : `${client.daysDiff} dias`}
                                    </span>
                                )}
                                <p className="text-slate-400 text-xs mt-1">
                                    R$ {Number(client.fixed_price || 0).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// --- Main Component ---

export default function FinancialDashboard() {
    const [activeTab, setActiveTab] = useState('overview'); // overview, expenses, reports
    const [isLoading, setIsLoading] = useState(true);

    // Data State
    const [expenses, setExpenses] = useState([]);
    const [metrics, setMetrics] = useState({
        revenue: 0,
        expenses: 0,
        profit: 0,
        occupancy: { active: 0, total: 0 }
    });
    const [chartData, setChartData] = useState([]);
    const [clients, setClients] = useState([]);

    // Expense Form State (Legacy)
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        category: 'Material'
    });

    useEffect(() => {
        loadDashboardData();
    }, []);

    async function loadDashboardData() {
        setIsLoading(true);
        try {
            const today = new Date();
            const startStr = format(startOfMonth(today), 'yyyy-MM-dd');
            const endStr = format(endOfMonth(today), 'yyyy-MM-dd');

            // Fetch Everything in parallel
            const [expData, instData, cliData] = await Promise.all([
                fetchExpenses(),
                fetchInstances(startStr, endStr), // Current Month Instances for Revenue
                fetchClients()
            ]);

            setExpenses(expData);
            setClients(cliData);

            // --- Calculate Metrics (Current Month) ---

            // 1. Revenue: Completed instances in current month
            // Ideally we should sum 'completed' instances. 
            // For 'Forecast', we sum all active instances.
            // Let's use 'Forecast' for the main big number, or 'Realized'?
            // Reference image shows "Receita Mês", usually implies total realized + expected or just realized.
            // Let's go with Projected Revenue for the month.
            const currentMonthRevenue = instData
                .filter(i => i.status !== 'Cancelled')
                .reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);

            // 2. Expenses: Expenses with date in current month
            const currentMonthExpenses = expData
                .filter(e => {
                    const d = new Date(e.expense_date);
                    return isAfter(d, subMonths(startOfMonth(today), 1)) && isBefore(d, addDays(endOfMonth(today), 1));
                    // Simple check: isSameMonth
                    // format(d, 'yyyy-MM') === format(today, 'yyyy-MM')
                })
                .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

            // 3. Occupancy
            const activeClients = cliData.length; // Simply count of clients for now
            // Maybe capacity is arbitrary, e.g., 50

            setMetrics({
                revenue: currentMonthRevenue,
                expenses: currentMonthExpenses,
                profit: currentMonthRevenue - currentMonthExpenses,
                occupancy: { active: activeClients, total: 30 } // Arbitrary goal
            });

            // --- Prepare Chart Data (Mock History for now based on current logic) ---
            // In a real app we'd fetch 6 months of data. 
            // For this MVP, let's create a static history + current month real data
            const history = [
                { name: 'Set', receita: 8500, despesa: 2100 },
                { name: 'Out', receita: 9200, despesa: 2400 },
                { name: 'Nov', receita: 8800, despesa: 1800 },
                { name: 'Dez', receita: 11500, despesa: 3200 },
                { name: 'Jan', receita: 10200, despesa: 2800 },
                {
                    name: format(today, 'MMM', { locale: ptBR }),
                    receita: currentMonthRevenue,
                    despesa: currentMonthExpenses
                },
            ];
            setChartData(history);

        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar dashboard');
        } finally {
            setIsLoading(false);
        }
    }

    // --- Actions ---

    async function handleAddExpense(e) {
        e.preventDefault();
        try {
            await createExpense({ ...formData, service_instance_id: null });
            toast.success('Despesa registrada');
            setIsFormOpen(false);
            setFormData({ description: '', amount: '', expense_date: new Date().toISOString().split('T')[0], category: 'Material' });
            loadDashboardData(); // Reload all
        } catch (error) {
            toast.error('Erro ao salvar despesa');
        }
    }

    async function handleDeleteExpense(id) {
        if (!confirm('Excluir esta despesa?')) return;
        try {
            await deleteExpense(id);
            toast.success('Despesa excluída');
            loadDashboardData();
        } catch (error) {
            toast.error('Erro ao excluir');
        }
    }

    if (isLoading) {
        return <div className="flex items-center justify-center h-full text-slate-500">Carregando finanças...</div>;
    }

    return (
        <div className="space-y-6 h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar pr-2">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-white">Finanças</h1>
                    <p className="text-slate-400">Controle financeiro do seu negócio</p>
                </div>
                <button onClick={loadDashboardData} className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-700/50">
                    <TrendingUp className="w-5 h-5" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl border border-slate-700/50 w-fit">
                {[
                    { id: 'overview', label: 'Visão Geral', icon: PieChart },
                    { id: 'expenses', label: 'Despesas', icon: DollarSign },
                    { id: 'reports', label: 'Relatórios', icon: FileText },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB CONTENT: Overview */}
            {activeTab === 'overview' && (
                <div className="space-y-6 animate-fade-in">
                    {/* Metric Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <MetricCard
                            title="Ocupação"
                            value={`${metrics.occupancy.active} Clientes`}
                            subtext="Ativos na base"
                            icon={Users} color="text-cyan-500" trend="neutral"
                        />
                        <MetricCard
                            title="Receita Mês"
                            value={`R$ ${metrics.revenue.toFixed(2)}`}
                            subtext="Faturamento estimado"
                            icon={DollarSign} color="text-emerald-500" trend="up"
                        />
                        <MetricCard
                            title="Despesas Mês"
                            value={`R$ ${metrics.expenses.toFixed(2)}`}
                            subtext="Total de gastos"
                            icon={TrendingDown} color="text-rose-500" trend="down"
                        />
                        <MetricCard
                            title="Lucro Líquido"
                            value={`R$ ${metrics.profit.toFixed(2)}`}
                            subtext="Resultado positivo"
                            icon={TrendingUp} color="text-violet-500" trend="up"
                        />
                    </div>

                    {/* Charts & Side Panel */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Chart */}
                        <div className="lg:col-span-2 bg-slate-800/30 rounded-2xl border border-slate-700/30 p-6">
                            <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                                Fluxo de Caixa (Semestral)
                            </h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value / 1000}k`} />
                                        <RechartsTooltip
                                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                                            itemStyle={{ color: '#fff' }}
                                            formatter={(value) => [`R$ ${value.toFixed(2)}`, '']}
                                        />
                                        <Bar dataKey="receita" name="Receita" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                        <Bar dataKey="despesa" name="Despesa" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Side Panel: Due Dates */}
                        <div>
                            <DuePaymentsList clients={clients} />
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: Expenses List (Legacy repurposed) */}
            {activeTab === 'expenses' && (
                <div className="space-y-4 animate-fade-in">
                    {/* Quick Add Form */}
                    <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-4">
                        <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setIsFormOpen(!isFormOpen)}>
                            <h3 className="font-semibold text-white flex items-center gap-2">
                                <Plus className="w-5 h-5 text-cyan-500" />
                                Nova Despesa
                            </h3>
                            <button className="text-sm text-slate-400 hover:text-white">
                                {isFormOpen ? 'Fechar' : 'Expandir'}
                            </button>
                        </div>
                        {isFormOpen && (
                            <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in">
                                <div className="md:col-span-2">
                                    <input
                                        type="text"
                                        placeholder="Descrição"
                                        required
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Valor (R$)"
                                        required
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <select
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="Material">Material</option>
                                        <option value="Combustivel">Combustível</option>
                                        <option value="Alimentacao">Alimentação</option>
                                        <option value="Outros">Outros</option>
                                    </select>
                                </div>
                                <div className="md:col-span-4 flex justify-end">
                                    <button
                                        type="submit"
                                        className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-lg font-medium"
                                    >
                                        Adicionar
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                    {/* List */}
                    <div className="bg-slate-800/20 rounded-2xl overflow-hidden border border-slate-700/30">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-800/50 text-slate-400 text-sm">
                                    <th className="p-4 font-medium">Data</th>
                                    <th className="p-4 font-medium">Descrição</th>
                                    <th className="p-4 font-medium">Categoria</th>
                                    <th className="p-4 font-medium text-right">Valor</th>
                                    <th className="p-4 font-medium w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/30 text-slate-300">
                                {expenses.map(expense => (
                                    <tr key={expense.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="p-4 text-sm">{format(new Date(expense.expense_date), 'dd/MM/yyyy')}</td>
                                        <td className="p-4 font-medium text-white">{expense.description}</td>
                                        <td className="p-4 text-sm">
                                            <span className="bg-slate-700/50 px-2 py-1 rounded text-xs border border-slate-600/50">{expense.category}</span>
                                        </td>
                                        <td className="p-4 text-emerald-400 font-medium text-right">R$ {Number(expense.amount).toFixed(2)}</td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => handleDeleteExpense(expense.id)} className="text-slate-500 hover:text-rose-400 p-1">
                                                <Trash className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {expenses.length === 0 && <div className="p-8 text-center text-slate-500">Nenhuma despesa registrada.</div>}
                    </div>
                </div>
            )}

            {activeTab === 'reports' && (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-slate-800/20 rounded-2xl border border-slate-700/30">
                    <FileText className="w-12 h-12 mb-4 opacity-50" />
                    <p>Relatórios detalhados em breve.</p>
                </div>
            )}
        </div>
    );
}
