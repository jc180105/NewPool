import { useState, useEffect } from 'react';
import { Plus, Edit, Trash, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { fetchTemplates, createTemplate, updateTemplate, deleteTemplate, fetchClients } from '../services/api';
import TemplateModal from '../components/TemplateModal';
import { toast } from 'sonner';

export default function TemplateList() {
    const [templates, setTemplates] = useState([]);
    const [clients, setClients] = useState({}); // Map id -> name
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [templatesData, clientsData] = await Promise.all([
                fetchTemplates(),
                fetchClients()
            ]);

            // Create client map
            const clientMap = {};
            clientsData.forEach(c => clientMap[c.id] = c.name);
            setClients(clientMap);

            setTemplates(templatesData);
        } catch (error) {
            toast.error('Erro ao carregar dados');
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSave(data) {
        try {
            if (editingTemplate) {
                await updateTemplate(editingTemplate.id, data);
                toast.success('Contrato atualizado!');
            } else {
                await createTemplate(data);
                toast.success('Contrato criado!');
            }
            setIsModalOpen(false);
            setEditingTemplate(null);
            loadData();
        } catch (error) {
            toast.error('Erro ao salvar contrato');
        }
    }

    async function handleDelete(id) {
        if (!confirm('Tem certeza que deseja excluir este contrato?')) return;
        try {
            await deleteTemplate(id);
            toast.success('Contrato excluído');
            loadData();
        } catch (error) {
            toast.error('Erro ao excluir contrato');
        }
    }

    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Contratos Recorrentes</h1>
                    <p className="text-slate-400">Gerencie a frequência de visitas (Templates)</p>
                </div>
                <button
                    onClick={() => { setEditingTemplate(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl font-medium shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    Novo Contrato
                </button>
            </div>

            {/* List */}
            {isLoading ? (
                <div className="text-center py-10 text-slate-500">Carregando...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map(template => (
                        <div key={template.id} className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-4 hover:bg-slate-800/50 transition-colors group relative">
                            {/* Status Indicator */}
                            <div className={`absolute top-4 right-4 ${template.is_active ? 'text-emerald-500' : 'text-slate-500'}`}>
                                {template.is_active ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                            </div>

                            <div className="mb-4">
                                <h3 className="font-semibold text-lg text-white pr-8">
                                    {clients[template.client_id] || 'Cliente Desconhecido'}
                                </h3>
                                <div className="flex items-center gap-2 mt-1 text-cyan-400">
                                    <Calendar className="w-4 h-4" />
                                    <span className="font-medium">{days[template.day_of_week]}</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-end">
                                <span className="text-sm px-2 py-1 rounded-md bg-slate-700/50 text-slate-300 border border-slate-600/50">
                                    {template.service_type}
                                </span>

                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => { setEditingTemplate(template); setIsModalOpen(true); }}
                                        className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(template.id)}
                                        className="p-2 hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-400"
                                    >
                                        <Trash className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <TemplateModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSave}
                initialData={editingTemplate}
            />
        </div>
    );
}
