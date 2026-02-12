import { useState, useEffect } from 'react';
import { Plus, DollarSign, Trash, Calendar } from 'lucide-react';
import { fetchExpenses, createExpense, deleteExpense } from '../services/api';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function Expenses() {
    const [expenses, setExpenses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);

    // New Expense Form State
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        category: 'Material'
    });

    useEffect(() => {
        loadExpenses();
    }, []);

    async function loadExpenses() {
        try {
            const data = await fetchExpenses();
            setExpenses(data);
        } catch (error) {
            toast.error('Erro ao carregar despesas');
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            await createExpense({
                ...formData,
                service_instance_id: null // Global expense for now
            });
            toast.success('Despesa registrada');
            setIsFormOpen(false);
            setFormData({
                description: '',
                amount: '',
                expense_date: new Date().toISOString().split('T')[0],
                category: 'Material'
            });
            loadExpenses();
        } catch (error) {
            toast.error('Erro ao salvar despesa');
        }
    }

    async function handleDelete(id) {
        if (!confirm('Excluir esta despesa?')) return;
        try {
            await deleteExpense(id);
            toast.success('Despesa excluída');
            loadExpenses();
        } catch (error) {
            toast.error('Erro ao excluir');
        }
    }

    const totalExpenses = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Financeiro</h1>
                    <p className="text-slate-400">Controle de despesas e custos</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700/50">
                    <div className="text-right">
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total Acumulado</p>
                        <p className="text-xl font-bold text-emerald-400">R$ {totalExpenses.toFixed(2)}</p>
                    </div>
                </div>
            </div>

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
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in">
                        <div className="md:col-span-2">
                            <input
                                type="text"
                                placeholder="Descrição (ex: Cloro)"
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
                                className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-cyan-500/20 transition-all"
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
                                <td className="p-4 text-sm">
                                    {format(new Date(expense.expense_date), 'dd/MM/yyyy')}
                                </td>
                                <td className="p-4 font-medium text-white">{expense.description}</td>
                                <td className="p-4 text-sm">
                                    <span className="bg-slate-700/50 px-2 py-1 rounded text-xs border border-slate-600/50">
                                        {expense.category}
                                    </span>
                                </td>
                                <td className="p-4 text-emerald-400 font-medium text-right">
                                    R$ {Number(expense.amount).toFixed(2)}
                                </td>
                                <td className="p-4 text-right">
                                    <button
                                        onClick={() => handleDelete(expense.id)}
                                        className="text-slate-500 hover:text-rose-400 p-1"
                                    >
                                        <Trash className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {expenses.length === 0 && !isLoading && (
                    <div className="p-8 text-center text-slate-500">
                        Nenhuma despesa registrada.
                    </div>
                )}
            </div>
        </div>
    );
}
