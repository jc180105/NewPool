import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash, Phone, MapPin } from 'lucide-react';
import { fetchClients, createClient, updateClient, deleteClient } from '../services/api';
import ClientModal from '../components/ClientModal';
import { toast } from 'sonner';

export default function ClientList() {
    const [clients, setClients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadClients();
    }, []);

    async function loadClients() {
        try {
            const data = await fetchClients();
            setClients(data);
        } catch (error) {
            toast.error('Erro ao carregar clientes');
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSave(data) {
        try {
            if (editingClient) {
                await updateClient(editingClient.id, data);
                toast.success('Cliente atualizado!');
            } else {
                await createClient(data);
                toast.success('Cliente criado!');
            }
            setIsModalOpen(false);
            setEditingClient(null);
            loadClients();
        } catch (error) {
            toast.error('Erro ao salvar cliente');
        }
    }

    async function handleDelete(id) {
        if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
        try {
            await deleteClient(id);
            toast.success('Cliente excluído');
            loadClients();
        } catch (error) {
            toast.error('Erro ao excluir cliente');
        }
    }

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Clientes</h1>
                    <p className="text-slate-400">Gerencie sua carteira de clientes</p>
                </div>
                <button
                    onClick={() => { setEditingClient(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl font-medium shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    Novo Cliente
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Buscar por nome ou bairro..."
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* List */}
            {isLoading ? (
                <div className="text-center py-10 text-slate-500">Carregando...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredClients.map(client => (
                        <div key={client.id} className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-4 hover:bg-slate-800/50 transition-colors group">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-semibold text-lg text-white">{client.name}</h3>
                                    <p className="text-sm text-cyan-400 font-medium">
                                        R$ {Number(client.fixed_price).toFixed(2)}
                                    </p>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => { setEditingClient(client); setIsModalOpen(true); }}
                                        className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(client.id)}
                                        className="p-2 hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-400"
                                    >
                                        <Trash className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-slate-400">
                                {client.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-slate-500" />
                                        <span>{client.phone}</span>
                                    </div>
                                )}
                                {(client.address || client.neighborhood) && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-slate-500" />
                                        <span>{client.address} {client.neighborhood && ` - ${client.neighborhood}`}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ClientModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSave}
                initialData={editingClient}
            />
        </div>
    );
}
