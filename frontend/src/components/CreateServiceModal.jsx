import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, Clock, DollarSign, FileText, Archive, UserPlus } from 'lucide-react';
import { createInstance, createExpense, fetchClients, createClient } from '../services/api';
import { toast } from 'sonner';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CreateServiceModal({ client: initialClient, weekStart, onClose, onSuccess }) {
    const [client, setClient] = useState(initialClient); // Can be null
    const [clientsList, setClientsList] = useState([]); // For dropdown
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreatingClient, setIsCreatingClient] = useState(false);

    // New Client Form
    const [newClientName, setNewClientName] = useState('');
    const [newClientAddress, setNewClientAddress] = useState('');
    const [newClientPhone, setNewClientPhone] = useState('');

    const [date, setDate] = useState(weekStart ? format(weekStart, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
    const [time, setTime] = useState('08:00');
    const [serviceType, setServiceType] = useState('Manutenção');
    const [price, setPrice] = useState('');
    const [expenses, setExpenses] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!initialClient) {
            loadClients();
        } else {
            setPrice(initialClient.fixed_price || '');
        }
    }, [initialClient]);

    async function loadClients() {
        try {
            const data = await fetchClients();
            setClientsList(data);
        } catch (error) {
            toast.error('Erro ao carregar clientes');
        }
    }

    const handleCreateClient = async () => {
        if (!newClientName.trim()) {
            toast.error('Nome é obrigatório');
            return;
        }
        setIsSubmitting(true);
        try {
            const newClient = await createClient({
                name: newClientName,
                address: newClientAddress,
                phone: newClientPhone,
                active: true
            });
            setClient(newClient);
            setIsCreatingClient(false);
            toast.success('Cliente criado!');
            // Refresh list
            setClientsList(prev => [...prev, newClient]);
        } catch (error) {
            toast.error('Erro ao criar cliente');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ... expense handlers ...
    const addExpense = () => {
        setExpenses([...expenses, { description: '', amount: '', category: 'Material' }]);
    };

    const removeExpense = (index) => {
        setExpenses(expenses.filter((_, i) => i !== index));
    };

    const updateExpense = (index, field, value) => {
        const newExpenses = [...expenses];
        newExpenses[index][field] = value;
        setExpenses(newExpenses);
    };

    const createService = async (dateOverride = null) => {
        let finalClient = client;

        // If in "Serviço Avulso" mode, we need to create the client first if not already set
        if (isCreatingClient) {
            if (!newClientName.trim()) {
                toast.error('Nome do cliente é obrigatório para serviço avulso');
                return;
            }
            setIsSubmitting(true);
            try {
                finalClient = await createClient({
                    name: newClientName,
                    address: newClientAddress,
                    phone: newClientPhone,
                    active: false // Mark as inactive/adhoc if possible, or just default true
                });
                setClient(finalClient);
                // We don't setIsCreatingClient(false) here because we're finishing everything
            } catch (error) {
                toast.error('Erro ao criar registro do cliente');
                setIsSubmitting(false);
                return;
            }
        }

        if (!finalClient) {
            toast.error('Selecione um cliente ou preencha os dados do serviço avulso');
            return;
        }

        setIsSubmitting(true);
        const finalDate = dateOverride || date;

        try {
            // 1. Create the Service Instance
            const instanceData = {
                client_id: finalClient.id,
                scheduled_date: finalDate,
                status: 'Pending',
                visit_start: finalDate + 'T' + time + ':00',
                price: price || null,
                service_type: serviceType
            };

            const newInstance = await createInstance(instanceData);

            // 2. Create Expenses if any
            if (expenses.length > 0 && newInstance.id) {
                await Promise.all(expenses.map(exp =>
                    createExpense({
                        service_instance_id: newInstance.id,
                        description: exp.description,
                        amount: parseFloat(exp.amount),
                        expense_date: finalDate,
                        category: exp.category
                    })
                ));
            }

            toast.success(dateOverride === '1970-01-01' ? 'Salvo em rascunho!' : 'Serviço criado com sucesso!');
            onSuccess();
            onClose();

        } catch (error) {
            console.error(error);
            toast.error('Erro ao criar serviço');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        createService();
    };

    const handleSaveDraft = () => {
        createService('1970-01-01');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-white">Novo Serviço</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    <form id="create-service-form" onSubmit={handleSubmit} className="space-y-6">

                        {/* Client Info or Selection */}
                        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">

                            {!initialClient && (
                                <div className="flex gap-2 mb-4 bg-slate-900/50 p-1 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreatingClient(false)}
                                        className={`flex-1 py-1.5 text-xs font-medium text-center rounded-md transition-all ${!isCreatingClient
                                            ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/20'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                            }`}
                                    >
                                        Cliente Fixo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsCreatingClient(true)}
                                        className={`flex-1 py-1.5 text-xs font-medium text-center rounded-md transition-all ${isCreatingClient
                                            ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/20'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                            }`}
                                    >
                                        Serviço Avulso
                                    </button>
                                </div>
                            )}

                            {initialClient ? (
                                <>
                                    <p className="text-lg text-white font-medium">{initialClient.name}</p>
                                    <p className="text-sm text-slate-400">{initialClient.address}</p>
                                </>
                            ) : isCreatingClient ? (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                    <div>
                                        <label className="text-xs text-slate-500 block mb-1">Nome do Cliente</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                                            placeholder="Nome Completo"
                                            value={newClientName}
                                            onChange={(e) => setNewClientName(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 block mb-1">Endereço</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                                            placeholder="Endereço Completo"
                                            value={newClientAddress}
                                            onChange={(e) => setNewClientAddress(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 block mb-1">Telefone (Opcional)</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                                            placeholder="Telefone / WhatsApp"
                                            value={newClientPhone}
                                            onChange={(e) => setNewClientPhone(e.target.value)}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="animate-in fade-in">
                                    <label className="text-xs text-slate-500 uppercase font-bold tracking-wider block mb-1">Selecione o Cliente</label>
                                    <select
                                        value={client ? client.id : ''}
                                        onChange={(e) => {
                                            const selected = clientsList.find(c => c.id === parseInt(e.target.value));
                                            setClient(selected);
                                            if (selected && selected.fixed_price) {
                                                setPrice(selected.fixed_price);
                                            } else {
                                                setPrice('');
                                            }
                                        }}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                        required
                                    >
                                        <option value="">Selecione um cliente...</option>
                                        {clientsList.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} {c.address ? ` - ${c.address}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Date & Time */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <label className="flex items-center gap-2 text-sm text-slate-300">
                                    <Calendar className="w-4 h-4 text-cyan-500" />
                                    Data do Serviço
                                </label>

                                {/* Quick Week Select */}
                                {weekStart && (
                                    <div className="flex gap-2 mb-2 overflow-x-auto pb-2 custom-scrollbar">
                                        {Array.from({ length: 7 }).map((_, i) => {
                                            const day = addDays(weekStart, i);
                                            const dateStr = format(day, 'yyyy-MM-dd');
                                            const isSelected = date === dateStr;
                                            return (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => setDate(dateStr)}
                                                    className={`flex flex-col items-center justify-center p-2 rounded-lg border min-w-[60px] transition-all ${isSelected
                                                        ? 'bg-cyan-600/20 border-cyan-500 text-cyan-400'
                                                        : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600 hover:bg-slate-700/50'
                                                        }`}
                                                >
                                                    <span className="text-[10px] uppercase font-bold">
                                                        {format(day, 'EEE', { locale: ptBR })}
                                                    </span>
                                                    <span className="text-lg font-bold">
                                                        {format(day, 'd')}
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}

                                <input
                                    type="date"
                                    required
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm text-slate-300">
                                    <Clock className="w-4 h-4 text-cyan-500" />
                                    Horário
                                </label>
                                <input
                                    type="time"
                                    required
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                />
                            </div>
                        </div>

                        {/* Service Type & Price */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm text-slate-300">
                                    <FileText className="w-4 h-4 text-cyan-500" />
                                    Tipo (Opcional)
                                </label>
                                <select
                                    value={serviceType}
                                    onChange={(e) => setServiceType(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                >
                                    <option value="Manutenção">Manutenção</option>
                                    <option value="Reparo">Reparo</option>
                                    <option value="Instalação">Instalação</option>
                                    <option value="Outro">Outro</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm text-slate-300">
                                    <DollarSign className="w-4 h-4 text-emerald-500" />
                                    Valor (R$)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                />
                            </div>
                        </div>

                        {/* Expenses Section */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center border-t border-slate-800 pt-4">
                                <label className="text-sm font-medium text-slate-300">Despesas / Produtos</label>
                                <button
                                    type="button"
                                    onClick={addExpense}
                                    className="text-xs flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 px-2 py-1 rounded border border-slate-700 transition-colors"
                                >
                                    <Plus className="w-3 h-3" />
                                    Adicionar
                                </button>
                            </div>

                            {expenses.length === 0 && (
                                <p className="text-xs text-slate-600 italic text-center py-2">Nenhuma despesa adicionada.</p>
                            )}

                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                {expenses.map((expense, index) => (
                                    <div key={index} className="flex gap-2 items-start bg-slate-800/30 p-2 rounded-lg">
                                        <div className="flex-1 space-y-1">
                                            <input
                                                type="text"
                                                placeholder="Descrição (ex: Cloro)"
                                                value={expense.description}
                                                onChange={(e) => updateExpense(index, 'description', e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
                                                required
                                            />
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    placeholder="Valor"
                                                    value={expense.amount}
                                                    onChange={(e) => updateExpense(index, 'amount', e.target.value)}
                                                    className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
                                                    required
                                                />
                                                <select
                                                    value={expense.category}
                                                    onChange={(e) => updateExpense(index, 'category', e.target.value)}
                                                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                                                >
                                                    <option value="Material">Material</option>
                                                    <option value="Combustível">Combustível</option>
                                                    <option value="Alimentação">Alimentação</option>
                                                </select>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeExpense(index)}
                                            className="p-1 text-rose-500 hover:bg-rose-500/10 rounded"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 flex justify-end gap-3 bg-slate-900/50 rounded-b-2xl">
                    <button
                        type="button"
                        onClick={handleSaveDraft}
                        className="self-center mr-auto text-slate-400 hover:text-white flex items-center gap-2 text-sm px-4 py-2"
                        title="Salvar sem agendar data"
                    >
                        <Archive className="w-4 h-4" />
                        Salvar para depois
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="create-service-form"
                        disabled={isSubmitting}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-xl text-sm font-medium shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Criando...' : 'Criar Serviço'}
                    </button>
                </div>

            </div>
        </div>
    );
}
