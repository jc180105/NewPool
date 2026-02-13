import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, Clock, DollarSign, FileText, Save } from 'lucide-react';
import { updateInstance, createExpense, fetchExpenses, deleteExpense } from '../services/api';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function EditServiceModal({ instance, onClose, onSuccess }) {
    // Instance form state
    const [visitStart, setVisitStart] = useState(instance.visit_start ? instance.visit_start.split('T')[1].substring(0, 5) : '08:00');
    const [price, setPrice] = useState(instance.price || '');
    const [status, setStatus] = useState(instance.status || 'Pending');

    // Expenses state
    const [expenses, setExpenses] = useState([]);
    const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);

    // New expense input
    const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: 'Material' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadExpenses();
    }, [instance.id]);

    async function loadExpenses() {
        setIsLoadingExpenses(true);
        try {
            // Fetch expenses for the same day (Backend doesn't support filter by instance yet, so we filter/find)
            // Ideally backend adds filter. For now, we assume we can fetch by date range of that day.
            const dateStr = instance.scheduled_date.split('T')[0];
            const allExpenses = await fetchExpenses(dateStr, dateStr); // Verify api.js supports this

            // Filter by instance_id
            const relevant = allExpenses.filter(e => e.service_instance_id === instance.id);
            setExpenses(relevant);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar despesas');
        } finally {
            setIsLoadingExpenses(false);
        }
    }

    const handleUpdateInstance = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Reconstruct full ISO for visit_start if needed, or backend handles partial
            // Backend updateInstance: visit_start = COALESCE($3, visit_start)
            // We need to send full timestamp? 
            // "2026-02-12T10:00:00"
            const dateStr = instance.scheduled_date.split('T')[0];
            const fullVisitStart = `${dateStr}T${visitStart}:00`;

            await updateInstance(instance.id, {
                visit_start: fullVisitStart,
                price: price || null,
                status: status
            });
            toast.success('Serviço atualizado!');
            onSuccess(); // Refresh parent
            // Don't close immediately? Or close? User might want to edit expenses.
        } catch (error) {
            toast.error('Erro ao atualizar serviço: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        if (!newExpense.description || !newExpense.amount) return;

        try {
            const dateStr = instance.scheduled_date.split('T')[0];
            await createExpense({
                service_instance_id: instance.id,
                description: newExpense.description,
                amount: parseFloat(newExpense.amount),
                expense_date: dateStr,
                category: newExpense.category
            });

            toast.success('Despesa adicionada');
            setNewExpense({ description: '', amount: '', category: 'Material' });
            loadExpenses(); // Reload list
        } catch (error) {
            toast.error('Erro ao adicionar despesa: ' + error.message);
        }
    };

    const handleDeleteExpense = async (id) => {
        if (!confirm('Excluir despesa?')) return;
        try {
            await deleteExpense(id);
            toast.success('Despesa removida');
            loadExpenses();
        } catch (error) {
            toast.error('Erro ao remover despesa');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-2xl">
                    <div>
                        <h2 className="text-xl font-semibold text-white">{instance.client_name}</h2>
                        <p className="text-sm text-slate-400">
                            {format(new Date(instance.scheduled_date), 'dd/MM/yyyy')} - {instance.service_type || 'Manutenção'}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">

                    {/* Instance Details Form */}
                    <section>
                        <h3 className="text-sm font-bold text-cyan-500 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Detalhes do Agendamento</h3>
                        <form onSubmit={handleUpdateInstance} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm text-slate-300">
                                    <Clock className="w-4 h-4 text-cyan-500" />
                                    Início
                                </label>
                                <input
                                    type="time"
                                    value={visitStart}
                                    onChange={(e) => setVisitStart(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm text-slate-300">
                                    <DollarSign className="w-4 h-4 text-emerald-500" />
                                    Valor (R$)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm text-slate-300">Status</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                >
                                    <option value="Pending">Pendente</option>
                                    <option value="Completed">Concluído</option>
                                    <option value="Cancelled">Cancelado</option>
                                </select>
                            </div>
                            <div className="md:col-span-3 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    Salvar Alterações
                                </button>
                            </div>
                        </form>
                    </section>

                    {/* Expenses Section */}
                    <section>
                        <h3 className="text-sm font-bold text-cyan-500 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Despesas e Produtos</h3>

                        {/* List */}
                        <div className="mb-4 space-y-2">
                            {isLoadingExpenses ? (
                                <p className="text-slate-500 text-sm">Carregando despesas...</p>
                            ) : expenses.length === 0 ? (
                                <p className="text-slate-600 italic text-sm">Nenhuma despesa registrada.</p>
                            ) : (
                                expenses.map(exp => (
                                    <div key={exp.id} className="flex justify-between items-center bg-slate-800 p-3 rounded-lg border border-slate-700">
                                        <div>
                                            <p className="text-white font-medium">{exp.description}</p>
                                            <p className="text-xs text-slate-400">{exp.category}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-emerald-400 font-mono">R$ {parseFloat(exp.amount).toFixed(2)}</span>
                                            <button
                                                onClick={() => handleDeleteExpense(exp.id)}
                                                className="text-slate-500 hover:text-rose-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Add New */}
                        <form onSubmit={handleAddExpense} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                            <h4 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
                                <Plus className="w-4 h-4 text-cyan-500" />
                                Adicionar Nova Despesa
                            </h4>
                            <div className="flex flex-col md:flex-row gap-2">
                                <input
                                    type="text"
                                    placeholder="Descrição (ex: Cloro)"
                                    value={newExpense.description}
                                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                                    className="flex-[2] bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                    required
                                />
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Valor"
                                    value={newExpense.amount}
                                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                    required
                                />
                                <select
                                    value={newExpense.category}
                                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                >
                                    <option value="Material">Material</option>
                                    <option value="Combustível">Combustível</option>
                                    <option value="Alimentação">Alimentação</option>
                                </select>
                                <button
                                    type="submit"
                                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Adicionar
                                </button>
                            </div>
                        </form>
                    </section>

                </div>
            </div>
        </div>
    );
}
