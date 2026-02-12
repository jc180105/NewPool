import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function ClientModal({ isOpen, onClose, onSubmit, initialData }) {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        neighborhood: '',
        fixed_price: '',
        payment_due_day: '',
        last_sand_change: '' // YYYY-MM-DD
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                last_sand_change: initialData.last_sand_change ? initialData.last_sand_change.split('T')[0] : ''
            });
        } else {
            setFormData({
                name: '',
                phone: '',
                address: '',
                neighborhood: '',
                fixed_price: '',
                payment_due_day: '',
                last_sand_change: ''
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <h2 className="text-lg font-semibold text-white">
                        {initialData ? 'Editar Cliente' : 'Novo Cliente'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Nome</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Telefone</label>
                            <input
                                type="text"
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Bairro</label>
                            <input
                                type="text"
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                value={formData.neighborhood}
                                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Endereço</label>
                        <input
                            type="text"
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Mensalidade (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                value={formData.fixed_price}
                                onChange={(e) => setFormData({ ...formData, fixed_price: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Dia Vencimento</label>
                            <input
                                type="number"
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                value={formData.payment_due_day}
                                onChange={(e) => setFormData({ ...formData, payment_due_day: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Última Troca de Areia</label>
                        <input
                            type="date"
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 [color-scheme:dark]"
                            value={formData.last_sand_change}
                            onChange={(e) => setFormData({ ...formData, last_sand_change: e.target.value })}
                        />
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
