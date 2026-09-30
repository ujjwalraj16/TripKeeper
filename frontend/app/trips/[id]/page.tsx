"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import api from "@/lib/api";
import { getToken } from "@/lib/auth";

const TripMap = dynamic(() => import("@/components/map/TripMap"), { ssr: false });

// ── Types ─────────────────────────────────────────────────────────────────────

interface Place {
  id: number;
  name: string;
  category?: string | null;
  lat: number;
  lon: number;
}

interface ItineraryItem {
  id: number;
  day_number: number;
  order: number;
  place: Place;
}

interface Trip {
  id: number;
  title: string;
  start_date: string | null;
  end_date: string | null;
  share_token: string | null;
  items: ItineraryItem[];
}

// ── Sortable Item Component ───────────────────────────────────────────────────

function SortableItem({ item, onRemove }: { item: ItineraryItem; onRemove?: (id: number) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { type: "Item", item },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 bg-gray-900 border border-gray-800 rounded-xl flex items-start gap-3 group relative
                  ${isDragging ? "opacity-30 border-indigo-500 shadow-xl" : "hover:border-gray-600"}`}
      {...attributes}
      {...listeners}
    >
      <div className="mt-1 cursor-grab active:cursor-grabbing text-gray-500 hover:text-white">
        ⠿
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{item.place.name}</p>
        <p className="text-xs text-gray-500 capitalize">{item.place.category ?? "Place"}</p>
      </div>
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
          className="p-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ✕
        </button>
      )}
    </div>
  );
}

// ── Main Page Component ───────────────────────────────────────────────────────

export default function TripDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [trip, setTrip] = useState<Trip | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [days, setDays] = useState<number[]>([1, 2, 3]); // Default 3 days
  
  // DND State
  const [activeItem, setActiveItem] = useState<ItineraryItem | null>(null);
  const [optimisticItems, setOptimisticItems] = useState<ItineraryItem[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    fetchTrip();
    fetchPlaces();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchTrip = async () => {
    try {
      const { data } = await api.get<Trip>(`/trips/${id}`);
      setTrip(data);
      setOptimisticItems(data.items);
      // Auto-expand days if items exist beyond day 3
      const maxDay = Math.max(3, ...data.items.map((i) => i.day_number));
      setDays(Array.from({ length: maxDay }, (_, i) => i + 1));
    } catch {
      router.push("/trips");
    }
  };

  const fetchPlaces = async () => {
    try {
      const { data } = await api.get<Place[]>("/places");
      setPlaces(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddPlace = async (placeId: number, dayNumber: number) => {
    try {
      const order = optimisticItems.filter(i => i.day_number === dayNumber).length;
      const { data } = await api.post<ItineraryItem>(`/trips/${id}/items`, {
        place_id: placeId,
        day_number: dayNumber,
        order,
      });
      setOptimisticItems([...optimisticItems, data]);
    } catch (e) {
      alert("Failed to add place");
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      await api.delete(`/trips/${id}/items/${itemId}`);
      setOptimisticItems(optimisticItems.filter(i => i.id !== itemId));
    } catch {
      alert("Failed to remove item");
    }
  };

  // ── DND Handlers ────────────────────────────────────────────────────────────

  const onDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const item = optimisticItems.find((i) => i.id === active.id);
    if (item) setActiveItem(item);
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Is dragging over a column?
    const isOverColumn = String(overId).startsWith("day-");
    
    setOptimisticItems((items) => {
      const activeIndex = items.findIndex((i) => i.id === activeId);
      const activeItem = items[activeIndex];
      
      if (isOverColumn) {
        const overDay = parseInt(String(overId).replace("day-", ""));
        if (activeItem.day_number !== overDay) {
          return [
            ...items.slice(0, activeIndex),
            { ...activeItem, day_number: overDay },
            ...items.slice(activeIndex + 1),
          ];
        }
        return items;
      }

      // Is dragging over another item?
      const overIndex = items.findIndex((i) => i.id === overId);
      if (overIndex >= 0 && activeItem.day_number !== items[overIndex].day_number) {
        return [
          ...items.slice(0, activeIndex),
          { ...activeItem, day_number: items[overIndex].day_number },
          ...items.slice(activeIndex + 1),
        ];
      }
      
      return items;
    });
  };

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as number;
    const overId = over.id;

    let newItems = [...optimisticItems];
    const activeIndex = newItems.findIndex((i) => i.id === activeId);
    
    // Sort items if dropped over another item in the same column
    if (!String(overId).startsWith("day-")) {
      const overIndex = newItems.findIndex((i) => i.id === overId);
      if (activeIndex !== overIndex) {
        newItems = arrayMove(newItems, activeIndex, overIndex);
      }
    }

    // Re-calculate orders
    const updates: { id: number; day_number: number; order: number }[] = [];
    
    days.forEach(day => {
      const dayItems = newItems.filter(i => i.day_number === day);
      dayItems.forEach((item, index) => {
        item.order = index;
        updates.push({ id: item.id, day_number: day, order: index });
      });
    });

    setOptimisticItems(newItems);

    // Sync to backend
    try {
      await api.patch(`/trips/${id}/items/reorder`, { items: updates });
    } catch {
      alert("Failed to sync reorder");
      fetchTrip(); // Revert
    }
  };

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white overflow-hidden">
      <nav className="flex-none border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/trips" className="text-sm text-gray-400 hover:text-white transition-colors">
            ← Back to Trips
          </a>
          <h1 className="text-xl font-bold">{trip.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowShareModal(true)}
            className="text-sm px-4 py-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-lg hover:bg-indigo-600/30 transition-colors"
          >
            Share
          </button>
          <button 
            onClick={() => setDays([...days, days.length + 1])}
            className="text-sm px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
          >
            + Add Day
          </button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Kanban Board */}
        <div className="flex-1 overflow-x-auto p-6 flex gap-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
          >
            {days.map((day) => {
              const dayItems = optimisticItems
                .filter((i) => i.day_number === day)
                .sort((a, b) => a.order - b.order);

              return (
                <div key={day} className="flex-none w-[320px] flex flex-col bg-gray-900/50 rounded-2xl border border-gray-800 overflow-hidden">
                  <div className="p-4 border-b border-gray-800 bg-gray-900">
                    <h2 className="font-bold">Day {day}</h2>
                  </div>
                  
                  <div className="p-3 flex-1 overflow-y-auto">
                    <SortableContext
                      id={`day-${day}`}
                      items={dayItems.map(i => i.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="flex flex-col gap-3 min-h-[100px]">
                        {dayItems.map((item) => (
                          <SortableItem key={item.id} item={item} onRemove={handleRemoveItem} />
                        ))}
                      </div>
                    </SortableContext>
                    
                    {/* Add Place Dropdown */}
                    <div className="mt-4">
                      <select
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-400 hover:border-gray-600 transition-colors cursor-pointer outline-none"
                        onChange={(e) => {
                          if(e.target.value) {
                            handleAddPlace(parseInt(e.target.value), day);
                            e.target.value = "";
                          }
                        }}
                        defaultValue=""
                      >
                        <option value="" disabled>+ Add a saved place...</option>
                        {places.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}

            <DragOverlay>
              {activeItem ? <SortableItem item={activeItem} /> : null}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Map */}
        <div className="w-[400px] border-l border-gray-800 p-4 bg-gray-950 hidden xl:block z-0 relative">
          <TripMap items={optimisticItems} />
        </div>
      </div>

      {showShareModal && trip && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-2">Share this trip</h2>
            <p className="text-sm text-gray-400 mb-6">Anyone with this link can view your itinerary.</p>
            
            <div className="flex items-center gap-2 mb-6">
              <input 
                type="text" 
                readOnly 
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/shared/${trip.share_token}`}
                className="flex-1 bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none"
              />
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/shared/${trip.share_token}`);
                  alert("Copied to clipboard!");
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
              >
                Copy
              </button>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 rounded-lg font-medium text-gray-400 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
