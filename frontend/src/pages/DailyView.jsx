import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, Circle, MapPin, DollarSign, Clock, Plus } from 'lucide-react';
import { fetchInstances, updateInstance, createExpense } from '../services/api';
import ExpenseModal from '../components/ExpenseModal';
import { toast } from 'sonner';

export default function DailyView() {
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const today = new Date(); // Browser's today, ideally matches server if configured correctly

    useEffect(() => {
        loadToday();
    }, []);

    async function loadToday() {
        try {
            const dateStr = format(today, 'yyyy-MM-dd');
            const data = await fetchInstances(dateStr, dateStr);
            setTasks(data);
        } catch (error) {
            toast.error('Erro ao carregar tarefas de hoje');
        } finally {
            setIsLoading(false);
        }
    }

    async function toggleStatus(task) {
        const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
        try {
            await updateInstance(task.id, { status: newStatus });
            setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
            if (newStatus === 'Completed') toast.success('Serviço concluído!');
        } catch (error) {
            toast.error('Erro ao atualizar status');
        }
    }

    async function handleSaveExpense(expenseData) {
        try {
            await createExpense({
                ...expenseData,
                service_instance_id: null
            });
            toast.success('Despesa registrada com sucesso!');
            setIsExpenseModalOpen(false);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar despesa');
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Visão Diária</h1>
                    <p className="text-slate-400 capitalize">
                        {format(today, 'EEEE, d de MMMM', { locale: ptBR })}
                    </p>
                </div>
                <button
                    onClick={() => setIsExpenseModalOpen(true)}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl font-medium border border-slate-700 transition-all text-sm"
                >
                    <Plus className="w-4 h-4 text-emerald-500" />
                    Lançar Despesa
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-10 text-slate-500">Carregando dia...</div>
            ) : tasks.length === 0 ? (
                <div className="text-center py-10 bg-slate-800/20 rounded-2xl border border-slate-700/50">
                    <p className="text-slate-400">Nenhum serviço agendado para hoje.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {tasks.map(task => (
                        <div key={task.id} className={`p-4 rounded-2xl border transition-all ${task.status === 'Completed'
                            ? 'bg-emerald-900/10 border-emerald-500/20'
                            : 'bg-slate-800/40 border-slate-700/50 hover:border-cyan-500/30'
                            }`}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <h3 className={`font-semibold text-lg ${task.status === 'Completed' ? 'text-emerald-400 line-through' : 'text-white'
                                        }`}>
                                        {task.client_name}
                                    </h3>

                                    <div className="mt-2 text-sm text-slate-400 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-slate-700/50 px-2 py-0.5 rounded text-xs text-slate-300 border border-slate-600/50">
                                                {task.service_type || 'Manutenção'}
                                            </span>
                                        </div>
                                        {task.address && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-slate-500" />
                                                <span>{task.address}</span>
                                            </div>
                                        )}
                                        {task.visit_start && (
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-slate-500" />
                                                <span>{format(new Date(task.visit_start), 'HH:mm')}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={() => toggleStatus(task)}
                                    className={`p-3 rounded-xl transition-all ${task.status === 'Completed'
                                        ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                        : 'bg-slate-700/50 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10'
                                        }`}
                                >
                                    {task.status === 'Completed' ? (
                                        <CheckCircle className="w-8 h-8" />
                                    ) : (
                                        <Circle className="w-8 h-8" />
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ExpenseModal
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                onSubmit={handleSaveExpense}
                date={format(today, 'yyyy-MM-dd')}
            />
        </div>
    );
}
