import { useState, useEffect } from 'react';
import { X, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function ServiceModal({ isOpen, onClose, onSubmit, initialData, client, date }) {
    const [formData, setFormData] = useState({
        price: '',
        status: 'Pending',
        visit_start: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                price: initialData.price || '',
                status: initialData.status || 'Pending',
                visit_start: initialData.visit_start || ''
            });
        } else if (client) {
            // New Service: Default to client's fixed price if available
            setFormData({
                price: client.fixed_price || '',
                status: 'Pending',
                visit_start: ''
            });
        }
    }, [initialData, client, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            client_id: client?.id,
            scheduled_date: date
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <h2 className="text-lg font-semibold text-white">
                        {initialData ? 'Editar Serviço' : 'Novo Serviço'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                        <p className="text-xs text-slate-400 mb-1">Cliente</p>
                        <p className="text-white font-medium">{client?.name || initialData?.client_name}</p>
                        <p className="text-xs text-slate-500">{date}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Preço do Serviço (R$)</label>
                        <div className="relative">
                            <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="number"
                                step="0.01"
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
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
