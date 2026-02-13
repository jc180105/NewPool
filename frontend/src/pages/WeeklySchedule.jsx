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
    DragOverlay,
    useDroppable
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
import { ChevronLeft, ChevronRight, Calculator, RefreshCw, Calendar as CalendarIcon, MapPin, Search, User, Plus, Trash2, Archive, Check, Edit, ExternalLink } from 'lucide-react';

// ... (imports remain)

// ...

/* DELETED SORTABLEITEM DUPLICATE START */

/* DUPLICATE BODY REMOVED */
/* DUPLICATE REMOVED COMPLETELY */
import { fetchInstances, updateInstance, generateWeek, fetchClients, createInstance, deleteInstance, fetchExpenses } from '../services/api';
import { toast } from 'sonner';
import CreateServiceModal from '../components/CreateServiceModal';
import EditServiceModal from '../components/EditServiceModal';

// --- Components ---

function DraggableClient({ client, onAddService }) {
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
            className="group/card bg-slate-800 p-3 rounded-xl border border-slate-700 hover:border-cyan-500/50 cursor-grab active:cursor-grabbing mb-2 shadow-sm relative"
        >
            <div className="flex items-center gap-2">
                <div className="bg-cyan-500/10 p-1.5 rounded-lg text-cyan-500">
                    <User className="w-4 h-4" />
                </div>
                <div>
                    <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-white line-clamp-1">{client.name}</p>
                        {client.active === false && (
                            <span className="text-[8px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1 rounded uppercase font-bold tracking-tighter">
                                Avulso
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{client.address || 'Sem endereço'}</p>
                </div>
            </div>

            {/* Add Service Button - Visible on Hover */}
            <button
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-cyan-600 hover:bg-cyan-500 text-white p-1.5 rounded-lg opacity-0 group-hover/card:opacity-100 transition-opacity shadow-lg"
                onPointerDown={(e) => {
                    e.stopPropagation(); // Prevent drag start
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    onAddService(client);
                }}
                title="Criar Serviço"
            >
                <Plus className="w-4 h-4" />
            </button>
        </div>
    );
}

function SortableItem({ id, instance, onDelete, onEdit }) {
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
        opacity: isDragging ? 0.5 : (instance.isDimmed ? 0.3 : 1),
        filter: instance.isDimmed ? 'grayscale(100%)' : 'none',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="bg-slate-800 p-3 rounded-xl border border-slate-700 shadow-sm hover:shadow-md hover:border-cyan-500/50 transition-all group mb-2"
            onClick={() => onEdit(instance)}
        >
            <div className="flex justify-between items-start mb-2">
                <span className="font-semibold text-slate-200 text-sm break-words leading-tight">{instance.client_name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border shrink-0 ml-1 ${instance.status === 'Completed'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                    {instance.status === 'Completed' ? 'Ok' : 'P'}
                </span>
            </div>

            <div className="space-y-1 mb-3">
                {(instance.address) && (
                    <div className="flex items-start gap-1.5 text-slate-400 text-xs">
                        <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                        <span className="break-words leading-tight line-clamp-2">{instance.address}</span>
                    </div>
                )}
                <div className="flex items-center gap-1.5 text-slate-500 text-[10px]">
                    <span className="bg-slate-900/50 px-2 py-0.5 rounded text-slate-400 border border-slate-700/50">
                        {instance.service_type || 'Manutenção'}
                    </span>
                </div>
            </div>

            {/* Action Footer (Icons) */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-700/50 mt-auto px-1">
                {/* Left: Status/Map */}
                <div className="flex items-center gap-2">
                    <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Quick status toggle? For now just placeholder logic or toast
                            toast.success('Em breve: Concluir rápido');
                        }}
                        className="text-slate-500 hover:text-emerald-400 transition-colors"
                        title="Concluir"
                    >
                        <Check className="w-4 h-4" />
                    </button>
                    <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (instance.address) {
                                window.open(`https://waze.com/ul?q=${encodeURIComponent(instance.address)}&navigate=yes`, '_blank');
                            }
                        }}
                        className="text-slate-500 hover:text-cyan-400 transition-colors"
                        title="Abrir Waze"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </button>
                </div>

                {/* Right: Edit/Delete */}
                <div className="flex items-center gap-2">
                    <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(instance);
                        }}
                        className="text-slate-500 hover:text-amber-400 transition-colors"
                        title="Editar"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Tem certeza que deseja excluir?')) {
                                onDelete(instance.id);
                            }
                        }}
                        className="text-slate-500 hover:text-rose-400 transition-colors"
                        title="Excluir"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function DroppableColumn({ id, children, className, isToday, isRecommended }) {
    const { setNodeRef, isOver } = useDroppable({
        id: id,
        data: {
            type: 'CONTAINER',
            date: id
        }
    });

    const highlightClass = isOver ? 'ring-2 ring-cyan-500 bg-slate-800/80 z-20' : '';

    return (
        <div ref={setNodeRef} className={`${className} ${highlightClass}`}>
            {children}
        </div>
    );
}

// Helper for Financial KPIs
function FinancialSummary({ instances, expenses = [] }) {
    const total = instances.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
    const realized = instances
        .filter(i => i.status === 'Completed')
        .reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);

    // Calculate total expenses for the displayed week (passed in filtered or we filter here? 
    // Plan was to pass all expenses and filter, OR pass filtered. 
    // Let's assume we pass ALL and filter here if we have date range, OR pass filtered total.
    // Actually, simpler to pass all expenses and filter by the instances' date range?
    // No, instances might be empty.
    // Let's just accept `expensesTotal` or `expenses` list if we want to calculate.
    // The previous plan in replacement content was passing `expenses` (filtered) or calculating it.
    // Let's stick to the previous attempt's logic: receive `expenses` (list) and sum it.
    // We will ensure to pass FILTERED expenses from the parent.
    const totalExpenses = expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    return (
        <div className="flex bg-slate-800/50 rounded-xl p-1 border border-slate-700/50 text-xs mr-4 hidden md:flex">
            <div className="px-3 py-1 border-r border-slate-700/50">
                <span className="text-slate-400 mr-2">Previsto</span>
                <span className="text-white font-medium">R$ {total.toFixed(2)}</span>
            </div>
            <div className="px-3 py-1 border-r border-slate-700/50">
                <span className="text-slate-400 mr-2">Realizado</span>
                <span className="text-emerald-400 font-medium">R$ {realized.toFixed(2)}</span>
            </div>
            <div className="px-3 py-1">
                <span className="text-slate-400 mr-2">Despesa</span>
                <span className="text-rose-400 font-medium">R$ {totalExpenses.toFixed(2)}</span>
            </div>
        </div>
    );
}

// --- Main Page ---

export default function WeeklySchedule() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [instances, setInstances] = useState([]);
    const [unscheduledInstances, setUnscheduledInstances] = useState([]); // Drafts (1970-01-01)
    const [clients, setClients] = useState([]);
    const [expenses, setExpenses] = useState([]); // All expenses
    const [searchTerm, setSearchTerm] = useState('');
    const [activeDragItem, setActiveDragItem] = useState(null); // { type: 'CLIENT' | 'INSTANCE', data: ... }
    const [isLoading, setIsLoading] = useState(false);
    const [selectedClientForService, setSelectedClientForService] = useState(null); // If null but modal open, likely creating new
    const [selectedInstanceForEdit, setSelectedInstanceForEdit] = useState(null); // For editing existing instance
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

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

            // Fetch instances for the week, unscheduled drafts, clients, AND ALL EXPENSES
            // Note: fetchExpenses currently fetches ALL expenses.
            // Ideally we should filter by date range on the backend, but for now we fetch all and filter client side.
            const [instData, unscheduledData, cliData, expData] = await Promise.all([
                fetchInstances(startStr, endStr),
                fetchInstances('1970-01-01', '1970-01-01'),
                fetchClients(),
                fetchExpenses()
            ]);

            setInstances(instData);
            setUnscheduledInstances(unscheduledData);
            setClients(cliData);
            setExpenses(expData);
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

        let targetDate = over.id;

        // If dropped over a SortableItem, use its container ID (which is the date or 'unscheduled-container')
        if (over.data.current?.sortable?.containerId) {
            targetDate = over.data.current.sortable.containerId;
        }

        if (targetDate === 'unscheduled-container') targetDate = '1970-01-01';

        const isTargetUnscheduled = targetDate === '1970-01-01';

        // CASE 1: Moving an INSTANCE
        if (active.data.current?.type === 'INSTANCE') {
            const activeInstance = active.data.current.instance;
            // Check if date changed (compare YYYY-MM-DD parts)
            const currentScheduled = activeInstance.scheduled_date ? activeInstance.scheduled_date.split('T')[0] : '';

            // Conflict Detection
            const hasConflict = instances.some(i =>
                i.client_id === activeInstance.client_id &&
                i.scheduled_date &&
                i.scheduled_date.startsWith(targetDate) &&
                i.id !== activeInstance.id && // Don't conflict with self
                i.status !== 'Cancelled'
            );

            if (hasConflict && !isTargetUnscheduled) {
                if (!confirm('Este cliente já possui um agendamento neste dia. Deseja agendar mesmo assim?')) {
                    return;
                }
            }

            if (activeInstance && currentScheduled !== targetDate) {
                const isSourceUnscheduled = currentScheduled === '1970-01-01';

                // Optimistic Updates
                if (isSourceUnscheduled && !isTargetUnscheduled) {
                    // Unscheduled -> Scheduled
                    setUnscheduledInstances(prev => prev.filter(i => i.id !== activeInstance.id));
                    setInstances(prev => [...prev, { ...activeInstance, scheduled_date: targetDate }]);
                } else if (!isSourceUnscheduled && isTargetUnscheduled) {
                    // Scheduled -> Unscheduled
                    setInstances(prev => prev.filter(i => i.id !== activeInstance.id));
                    setUnscheduledInstances(prev => [...prev, { ...activeInstance, scheduled_date: targetDate }]);
                } else if (!isSourceUnscheduled && !isTargetUnscheduled) {
                    // Scheduled -> Scheduled (Date change)
                    setInstances(prev => prev.map(i => i.id === activeInstance.id ? { ...i, scheduled_date: targetDate } : i));
                }

                try {
                    await updateInstance(activeInstance.id, { scheduled_date: targetDate });
                    toast.success(isTargetUnscheduled ? 'Movido para A Agendar' : 'Agendamento atualizado');
                } catch (error) {
                    toast.error('Erro ao mover: ' + error.message);
                    loadData(); // Revert
                }
            }
        }
        // CASE 2: Dropping a CLIENT
        else if (active.data.current?.type === 'CLIENT') {
            const client = active.data.current.client;

            const hasConflict = instances.some(i =>
                i.client_id === client.id &&
                i.scheduled_date &&
                i.scheduled_date.startsWith(targetDate) &&
                i.status !== 'Cancelled'
            );

            if (hasConflict && !isTargetUnscheduled) {
                if (!confirm('Este cliente já possui um agendamento neste dia. Deseja agendar mesmo assim?')) {
                    return;
                }
            }

            // Create a temporary ID
            const tempId = `temp-${Date.now()}`;
            const optimisticInstance = {
                id: tempId,
                client_id: client.id,
                client_name: client.name,
                address: client.address,
                scheduled_date: targetDate,
                status: 'Pending',
                service_type: 'Manual',
                price: client.fixed_price || null
            };

            if (isTargetUnscheduled) {
                setUnscheduledInstances(prev => [...prev, optimisticInstance]);
            } else {
                setInstances(prev => [...prev, optimisticInstance]);
            }

            try {
                const newInstance = await createInstance({
                    client_id: client.id,
                    scheduled_date: targetDate,
                    template_id: null,
                    status: 'Pending',
                    price: client.fixed_price || null
                });

                // Update temp ID with real one
                const updateFunc = isTargetUnscheduled ? setUnscheduledInstances : setInstances;
                updateFunc(prev => prev.map(i =>
                    i.id === tempId ? { ...newInstance, client_name: client.name, address: client.address, service_type: 'Manual' } : i
                ));

                toast.success(isTargetUnscheduled ? 'Salvo em A Agendar' : 'Agendamento criado!');
                loadData();

            } catch (error) {
                toast.error('Erro ao criar: ' + error.message);
                const updateFunc = isTargetUnscheduled ? setUnscheduledInstances : setInstances;
                updateFunc(prev => prev.filter(i => i.id !== tempId));
            }
        }
    }

    async function handleDelete(id) {
        // Optimistic Update
        const oldInstances = [...instances];
        setInstances(instances.filter(i => i.id !== id));

        try {
            await deleteInstance(id);
            toast.success('Agendamento excluído');
        } catch (error) {
            toast.error('Erro ao excluir: ' + error.message);
            setInstances(oldInstances); // Revert
        }
    }

    // Group instances by date
    const instancesByDate = {};
    weekDays.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        instancesByDate[dateStr] = instances.filter(i =>
            i.scheduled_date && String(i.scheduled_date).startsWith(dateStr)
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

                <div className="flex gap-2 self-end items-center">
                    <FinancialSummary
                        instances={instances}
                        expenses={expenses.filter(e => {
                            if (!e.expense_date) return false;
                            const d = e.expense_date.split('T')[0];
                            const start = format(weekStart, 'yyyy-MM-dd');
                            const end = format(weekEnd, 'yyyy-MM-dd');
                            return d >= start && d <= end;
                        })}
                    />

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
                <div className="flex flex-col h-full gap-4 overflow-hidden">

                    {/* TOP: Kanban Board */}
                    <div className="flex-1 w-full h-full pb-2 overflow-x-auto custom-scrollbar">
                        <div className="flex gap-2 w-full h-full">
                            {weekDays.map(day => {
                                const dateStr = format(day, 'yyyy-MM-dd');
                                const dayInstances = instancesByDate[dateStr] || [];
                                const isToday = isSameDay(day, new Date());

                                const isRecommended = activeDragItem && dayInstances.length < (instances.length / 7) - 1; // Simple logic: less than average - 1

                                return (
                                    <DroppableColumn
                                        key={dateStr}
                                        id={dateStr}
                                        isToday={isToday}
                                        isRecommended={isRecommended}
                                        className={`flex-1 min-w-[160px] flex flex-col rounded-2xl border transition-all duration-300 ease-in-out hover:flex-[1.25] hover:bg-slate-800/60 hover:shadow-2xl hover:z-10 ${isToday
                                            ? 'bg-slate-800/40 border-cyan-500/30'
                                            : isRecommended
                                                ? 'bg-emerald-500/10 border-emerald-500/30' // Highlight recommended
                                                : 'bg-slate-800/20 border-slate-800'
                                            }`}>
                                        {/* Column Header */}
                                        <div className={`p-3 border-b flex flex-col items-center justify-center gap-1 ${isToday ? 'border-cyan-500/20 bg-cyan-500/5' : 'border-slate-800'}`}>
                                            <span className={`text-[10px] font-bold tracking-wider uppercase ${isToday ? 'text-cyan-400' : 'text-slate-500'} `}>
                                                {format(day, 'EEE', { locale: ptBR })}
                                            </span>
                                            <span className={`text-xl font-bold ${isToday ? 'text-white' : 'text-slate-400'}`}>
                                                {format(day, 'd')}
                                            </span>
                                        </div>

                                        {/* Drop Zone */}
                                        <SortableContext
                                            id={dateStr}
                                            items={dayInstances.map(i => i.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            <div className="flex-1 p-2 overflow-y-auto custom-scrollbar flex flex-col gap-2">
                                                {dayInstances.map(instance => (
                                                    <SortableItem
                                                        key={instance.id}
                                                        id={instance.id}
                                                        instance={{
                                                            ...instance,
                                                            isDimmed: searchTerm && !instance.client_name.toLowerCase().includes(searchTerm.toLowerCase()) && !(instance.address && instance.address.toLowerCase().includes(searchTerm.toLowerCase()))
                                                        }}
                                                        onDelete={handleDelete}
                                                        onEdit={setSelectedInstanceForEdit}
                                                    />
                                                ))}
                                                {/* Empty space visual cue - Only show when dragging */}
                                                {dayInstances.length === 0 && activeDragItem && (
                                                    <div className="h-full min-h-[4rem] flex items-center justify-center text-slate-600 text-xs border-2 border-dashed border-slate-700/50 rounded-xl bg-slate-800/30 animate-pulse m-1">
                                                        Solte aqui
                                                    </div>
                                                )}
                                            </div>
                                        </SortableContext>
                                    </DroppableColumn>
                                );
                            })}
                        </div>
                    </div>

                    {/* BOTTOM: Clients Pool */}
                    <div className="shrink-0 h-48 flex gap-4">
                        <div className="flex-1 bg-slate-900/80 rounded-t-2xl border-t border-x border-slate-700/50 flex flex-col shadow-[0_-4px_20px_rgba(0,0,0,0.3)] z-10">
                            <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-2xl">
                                <h3 className="text-white font-medium flex items-center gap-2">
                                    <User className="w-4 h-4 text-cyan-500" />
                                    Clientes
                                </h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            setSelectedClientForService(null);
                                            setIsServiceModalOpen(true);
                                        }}
                                        className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Novo
                                    </button>
                                    <div className="relative w-40">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            type="text"
                                            placeholder="Buscar..."
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 overflow-x-auto p-4 custom-scrollbar bg-slate-900/50">
                                <div className="flex flex-col gap-6">
                                    {/* Fixed Clients Section */}
                                    {filteredClients.filter(c => c.active !== false).length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-3 px-1">
                                                <div className="h-px flex-1 bg-slate-800"></div>
                                                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-2">Clientes Fixos</span>
                                                <div className="h-px flex-1 bg-slate-800"></div>
                                            </div>
                                            <div className="flex gap-3">
                                                {filteredClients.filter(c => c.active !== false).map(client => (
                                                    <div key={client.id} className="w-52 shrink-0">
                                                        <DraggableClient
                                                            client={client}
                                                            onAddService={(c) => {
                                                                setSelectedClientForService(c);
                                                                setIsServiceModalOpen(true);
                                                            }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Ad-hoc Clients Section */}
                                    {filteredClients.filter(c => c.active === false).length > 0 && (
                                        <div className="pb-2">
                                            <div className="flex items-center gap-2 mb-3 px-1">
                                                <div className="h-px flex-1 bg-amber-900/30"></div>
                                                <span className="text-[10px] uppercase font-bold text-amber-500/60 tracking-widest px-2">Serviços Avulsos</span>
                                                <div className="h-px flex-1 bg-amber-900/30"></div>
                                            </div>
                                            <div className="flex gap-3">
                                                {filteredClients.filter(c => c.active === false).map(client => (
                                                    <div key={client.id} className="w-52 shrink-0">
                                                        <DraggableClient
                                                            client={client}
                                                            onAddService={(c) => {
                                                                setSelectedClientForService(c);
                                                                setIsServiceModalOpen(true);
                                                            }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {filteredClients.length === 0 && (
                                        <div className="flex items-center justify-center py-4 text-slate-600 text-sm italic">
                                            Nenhum cliente encontrado
                                        </div>
                                    )}
                                </div>
                            </div>
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
            </DndContext >

            {
                isServiceModalOpen && (
                    <CreateServiceModal
                        client={selectedClientForService}
                        weekStart={weekStart} // Pass the start of the visible week
                        onClose={() => {
                            setIsServiceModalOpen(false);
                            setSelectedClientForService(null);
                        }}
                        onSuccess={() => {
                            loadData();
                            setIsServiceModalOpen(false);
                            setSelectedClientForService(null);
                        }}
                    />
                )
            }

            {
                selectedInstanceForEdit && (
                    <EditServiceModal
                        instance={selectedInstanceForEdit}
                        onClose={() => setSelectedInstanceForEdit(null)}
                        onSuccess={() => {
                            loadData();
                            // Optional: Keep open? User probably wants to close after main save.
                            // Expenses add/remove don't trigger onSuccess, they reload internal list.
                            setSelectedInstanceForEdit(null);
                        }}
                    />
                )
            }
        </div >
    );
}
