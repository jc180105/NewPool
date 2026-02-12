import { useState, useEffect } from 'react';
import {
    format, startOfWeek, endOfWeek, addDays, subDays,
    parseISO, isSameDay, addWeeks, subWeeks
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ChevronLeft, ChevronRight, Calculator, RefreshCw, Calendar as CalendarIcon, MapPin, Search, User } from 'lucide-react';
import { fetchInstances, updateInstance, generateWeek, fetchClients, createInstance } from '../services/api';
import { toast } from 'sonner';

// --- Components ---

function DraggableClient({ client }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `client-${client.id}`,
        data: {
            type: 'CLIENT',
            client: client
        }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className="bg-slate-800 p-3 rounded-xl border border-slate-700 hover:border-cyan-500/50 cursor-grab active:cursor-grabbing mb-2 shadow-sm"
        >
            <div className="flex items-center gap-2">
                <div className="bg-cyan-500/10 p-1.5 rounded-lg text-cyan-500">
                    <User className="w-4 h-4" />
                </div>
                <div>
                    <p className="text-sm font-medium text-white line-clamp-1">{client.name}</p>
                    <p className="text-xs text-slate-500 line-clamp-1">{client.address || 'Sem endereço'}</p>
                </div>
            </div>
        </div>
    );
}

function SortableItem({ id, instance }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id,
        data: {
            type: 'INSTANCE',
            instance: instance
        }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50 shadow-sm cursor-grab active:cursor-grabbing hover:border-cyan-500/30 transition-colors group mb-2"
        >
            <div className="flex justify-between items-start">
                <span className="font-medium text-slate-200 text-sm line-clamp-1">{instance.client_name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${instance.status === 'Completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                    {instance.status === 'Completed' ? 'Ok' : 'P'}
                </span>
            </div>
            {(instance.address) && (
                <div className="flex items-center gap-1 mt-1 text-slate-500 text-xs">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{instance.address}</span>
                </div>
            )}
            <div className="flex items-center gap-1 mt-2 text-slate-500 text-[10px]">
                <span className="bg-slate-900/50 px-1.5 py-0.5 rounded">{instance.service_type || 'Manutenção'}</span>
            </div>
        </div>
    );
}

// --- Main Page ---

export default function WeeklySchedule() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [instances, setInstances] = useState([]);
    const [clients, setClients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeDragItem, setActiveDragItem] = useState(null); // { type: 'CLIENT' | 'INSTANCE', data: ... }
    const [isLoading, setIsLoading] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Derived dates
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    useEffect(() => {
        loadData();
    }, [currentDate]);

    async function loadData() {
        setIsLoading(true);
        try {
            const startStr = format(weekStart, 'yyyy-MM-dd');
            const endStr = format(weekEnd, 'yyyy-MM-dd');

            const [instData, cliData] = await Promise.all([
                fetchInstances(startStr, endStr),
                fetchClients()
            ]);

            setInstances(instData);
            setClients(cliData);
        } catch (error) {
            toast.error('Erro ao carregar dados');
        } finally {
            setIsLoading(false);
        }
    }

    async function handleGenerate() {
        if (!confirm('Gerar agenda para esta semana baseada nos contratos?')) return;
        try {
            const startStr = format(weekStart, 'yyyy-MM-dd');
            await generateWeek(startStr);
            toast.success('Agenda gerada!');
            loadData(); // Reload instances
        } catch (error) {
            toast.error('Erro ao gerar agenda');
        }
    }

    function handleDragStart(event) {
        const { active } = event;
        setActiveDragItem(active.data.current);
    }

    async function handleDragEnd(event) {
        const { active, over } = event;
        setActiveDragItem(null);

        if (!over) return;

        const overDateStr = over.id; // Target Date (YYYY-MM-DD)

        // CASE 1: Moving an existing INSTANCE
        if (active.data.current?.type === 'INSTANCE') {
            const activeInstance = active.data.current.instance;

            if (activeInstance && activeInstance.scheduled_date !== overDateStr) {
                // Optimistic Update
                setInstances(instances.map(i => {
                    if (i.id === activeInstance.id) {
                        return { ...i, scheduled_date: overDateStr };
                    }
                    return i;
                }));

                try {
                    await updateInstance(activeInstance.id, { scheduled_date: overDateStr });
                    toast.success('Agendamento atualizado');
                } catch (error) {
                    toast.error('Erro ao mover agendamento');
                    loadData(); // Revert
                }
            }
        }
        // CASE 2: Dropping a CLIENT to create a new INSTANCE
        else if (active.data.current?.type === 'CLIENT') {
            const client = active.data.current.client;

            // Create a temporary ID for optimistic UI
            const tempId = `temp-${Date.now()}`;
            const optimisticInstance = {
                id: tempId, // Temporary ID
                client_id: client.id,
                client_name: client.name,
                address: client.address,
                scheduled_date: overDateStr,
                status: 'Pending',
                service_type: 'Manual'
            };

            setInstances([...instances, optimisticInstance]);

            try {
                await createInstance({
                    client_id: client.id,
                    scheduled_date: overDateStr,
                    template_id: null, // Manual creation
                    status: 'Pending'
                });
                toast.success('Agendamento criado!');
                // Reload to get real ID
                const startStr = format(weekStart, 'yyyy-MM-dd');
                const endStr = format(weekEnd, 'yyyy-MM-dd');
                const newData = await fetchInstances(startStr, endStr);
                setInstances(newData);

            } catch (error) {
                toast.error('Erro ao criar agendamento');
                setInstances(prev => prev.filter(i => i.id !== tempId));
            }
        }
    }

    // Group instances by date
    const instancesByDate = {};
    weekDays.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        instancesByDate[dateStr] = instances.filter(i =>
            i.scheduled_date && i.scheduled_date.startsWith(dateStr)
        );
    });

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.address && c.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="h-[calc(100vh-100px)] md:h-[calc(100vh-6rem)] flex flex-col space-y-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-4 bg-slate-800/50 p-2 rounded-2xl border border-slate-700/50 self-start">
                    <button onClick={() => setCurrentDate(subWeeks(currentDate, 1))} className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2 text-sm font-medium text-white px-2">
                        <CalendarIcon className="w-4 h-4 text-cyan-500" />
                        <span className="capitalize">
                            {format(weekStart, 'd MMM', { locale: ptBR })} - {format(weekEnd, 'd MMM, yyyy', { locale: ptBR })}
                        </span>
                    </div>
                    <button onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex gap-2 self-end">
                    <button onClick={loadData} className="p-2 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl border border-slate-700/50 transition-colors">
                        <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    {/* Kept "Generate" mainly for legacy reasons or if they still use templates silently */}
                    <button
                        onClick={handleGenerate}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl font-medium border border-slate-700 transition-all text-xs"
                    >
                        <Calculator className="w-4 h-4" />
                        Gerar (Templates)
                    </button>
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex-1 flex gap-4 overflow-hidden">
                    {/* Clients Sidebar */}
                    <div className="w-64 shrink-0 flex flex-col bg-slate-900/50 rounded-2xl border border-slate-800/50 hidden md:flex">
                        <div className="p-4 border-b border-slate-800">
                            <h3 className="text-white font-medium mb-2">Clientes</h3>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                            {filteredClients.map(client => (
                                <DraggableClient key={client.id} client={client} />
                            ))}
                        </div>
                    </div>

                    {/* Kanban Board */}
                    <div className="flex-1 overflow-x-auto pb-4">
                        <div className="flex gap-4 min-w-[1000px] h-full">
                            {weekDays.map(day => {
                                const dateStr = format(day, 'yyyy-MM-dd');
                                const dayInstances = instancesByDate[dateStr] || [];
                                const isToday = isSameDay(day, new Date());

                                return (
                                    <div key={dateStr} className={`flex-1 min-w-[200px] flex flex-col rounded-2xl border ${isToday ? 'bg-slate-800/40 border-cyan-500/30' : 'bg-slate-800/20 border-slate-800'}`}>
                                        {/* Column Header */}
                                        <div className={`p-3 border-b ${isToday ? 'border-cyan-500/20 bg-cyan-500/5' : 'border-slate-800'}`}>
                                            <p className={`text-sm font-medium ${isToday ? 'text-cyan-400' : 'text-slate-400'} capitalize`}>
                                                {format(day, 'EEEE', { locale: ptBR })}
                                            </p>
                                            <p className={`text-2xl font-bold ${isToday ? 'text-white' : 'text-slate-500'}`}>
                                                {format(day, 'd')}
                                            </p>
                                        </div>

                                        {/* Drop Zone */}
                                        <SortableContext
                                            id={dateStr}
                                            items={dayInstances.map(i => i.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            <div className="flex-1 p-2 overflow-y-auto custom-scrollbar">
                                                {dayInstances.map(instance => (
                                                    <SortableItem key={instance.id} id={instance.id} instance={instance} />
                                                ))}
                                                {/* Empty space for simpler dropping */}
                                                {dayInstances.length === 0 && (
                                                    <div className="h-full flex items-center justify-center text-slate-700 text-xs border-2 border-dashed border-slate-800 rounded-lg">
                                                        Arraste aqui
                                                    </div>
                                                )}
                                            </div>
                                        </SortableContext>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <DragOverlay>
                    {activeDragItem ? (
                        <div className={`p-3 rounded-xl border shadow-xl cursor-grabbing rotate-2 w-[200px] ${activeDragItem.type === 'CLIENT'
                                ? 'bg-slate-800 border-cyan-500/50'
                                : 'bg-slate-800/90 border-cyan-500/50'
                            }`}>
                            <div className="flex justify-between items-start">
                                <span className="font-medium text-slate-200 text-sm line-clamp-1">
                                    {activeDragItem.type === 'CLIENT' ? activeDragItem.client.name : activeDragItem.instance.client_name}
                                </span>
                            </div>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
