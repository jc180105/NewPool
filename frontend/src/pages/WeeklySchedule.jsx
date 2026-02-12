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
import { CSS } from '@dnd-kit/utilities';
import { ChevronLeft, ChevronRight, Calculator, RefreshCw, Calendar as CalendarIcon, MapPin } from 'lucide-react';
import { fetchInstances, updateInstance, generateWeek } from '../services/api';
import { toast } from 'sonner';

// --- Components ---

function SortableItem({ id, instance }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

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
    const [activeId, setActiveId] = useState(null);
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
        loadWeek();
    }, [currentDate]);

    async function loadWeek() {
        setIsLoading(true);
        try {
            const startStr = format(weekStart, 'yyyy-MM-dd');
            const endStr = format(weekEnd, 'yyyy-MM-dd');
            const data = await fetchInstances(startStr, endStr);
            setInstances(data);
        } catch (error) {
            toast.error('Erro ao carregar agenda');
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
            loadWeek();
        } catch (error) {
            toast.error('Erro ao gerar agenda');
        }
    }

    function handleDragStart(event) {
        setActiveId(event.active.id);
    }

    async function handleDragEnd(event) {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeInstance = instances.find(i => i.id === active.id);
        const overDateStr = over.id; // The drop zone ID is the date string (YYYY-MM-DD)

        if (activeInstance && activeInstance.scheduled_date !== overDateStr) {
            // Optimistic Update
            setInstances(instances.map(i => {
                if (i.id === active.id) {
                    return { ...i, scheduled_date: overDateStr };
                }
                return i;
            }));

            try {
                await updateInstance(active.id, { scheduled_date: overDateStr });
                toast.success('Agendamento atualizado');
            } catch (error) {
                toast.error('Erro ao mover agendamento');
                loadWeek(); // Revert
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
                    <button onClick={loadWeek} className="p-2 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl border border-slate-700/50 transition-colors">
                        <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={handleGenerate}
                        className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-4 py-2 rounded-xl font-medium shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
                    >
                        <Calculator className="w-5 h-5" />
                        <span className="hidden sm:inline">Gerar Linkagem</span>
                        <span className="sm:hidden">Gerar</span>
                    </button>
                </div>
            </div>

            {/* Kanban Board */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
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
                                        id={dateStr} // Important: Container ID = Date
                                        items={dayInstances.map(i => i.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="flex-1 p-2 overflow-y-auto custom-scrollbar">
                                            {dayInstances.map(instance => (
                                                <SortableItem key={instance.id} id={instance.id} instance={instance} />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <DragOverlay>
                    {activeId ? (
                        <div className="bg-slate-800/90 p-3 rounded-xl border border-cyan-500/50 shadow-xl cursor-grabbing rotate-2 w-[200px]">
                            {(() => {
                                const instance = instances.find(i => i.id === activeId);
                                if (!instance) return null;
                                return (
                                    <>
                                        <div className="flex justify-between items-start">
                                            <span className="font-medium text-slate-200 text-sm line-clamp-1">{instance.client_name}</span>
                                        </div>
                                    </>
                                )
                            })()}
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
