import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { fetchClients } from '../services/api';

export default function TemplateModal({ isOpen, onClose, onSubmit, initialData }) {
    const [clients, setClients] = useState([]);
    const [formData, setFormData] = useState({
        client_id: '',
        day_of_week: '1', // Default Monday
        service_type: 'Manutenção',
        is_active: true
    });

    useEffect(() => {
        loadClients();
        if (initialData) {
            setFormData({
                client_id: initialData.client_id,
                day_of_week: String(initialData.day_of_week),
                service_type: initialData.service_type,
                is_active: initialData.is_active
            });
        } else {
            setFormData({
                client_id: '',
                day_of_week: '1',
                service_type: 'Manutenção',
                is_active: true
            });
        }
    }, [initialData, isOpen]);

    async function loadClients() {
        try {
            const data = await fetchClients();
            setClients(data);
        } catch (error) {
            console.error('Failed to load clients', error);
        }
    }

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            day_of_week: parseInt(formData.day_of_week),
            client_id: parseInt(formData.client_id)
        });
    };

    const days = [
        { value: '0', label: 'Domingo' },
        { value: '1', label: 'Segunda-feira' },
        { value: '2', label: 'Terça-feira' },
        { value: '3', label: 'Quarta-feira' },
        { value: '4', label: 'Quinta-feira' },
        { value: '5', label: 'Sexta-feira' },
        { value: '6', label: 'Sábado' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <h2 className="text-lg font-semibold text-white">
                        {initialData ? 'Editar Contrato' : 'Novo Contrato'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Cliente</label>
                        <select
                            required
                            disabled={!!initialData} // Lock client on edit
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                            value={formData.client_id}
                            onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                        >
                            <option value="">Selecione um cliente...</option>
                            {clients.map(client => (
                                <option key={client.id} value={client.id}>{client.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Dia da Semana</label>
                        <select
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                            value={formData.day_of_week}
                            onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                        >
                            {days.map(day => (
                                <option key={day.value} value={day.value}>{day.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Tipo de Serviço</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                            value={formData.service_type}
                            onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-800/50 text-cyan-600 focus:ring-cyan-500/50"
                        />
                        <label className="text-sm font-medium text-slate-400">Contrato Ativo</label>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-lg shadow-cyan-500/20 transition-all"
                        >
                            Salvar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
