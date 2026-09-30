"use client";
import { useEffect, useState, useRef } from "react";
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

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
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
      className={`p-4 bg-[#0f0f0f] border border-white/5 rounded-xl flex items-start gap-4 group relative
                  ${isDragging ? "opacity-30 border-[#e87a5d] shadow-xl" : "hover:border-white/20 transition-colors"}`}
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

  // Chat State
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  // Scroll chat to bottom
  useEffect(() => {
    if (showChat && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, showChat]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || chatLoading) return;

    const userMsg = chatMessage.trim();
    setChatMessage("");
    
    // Optimistic update
    const newHistory: ChatMessage[] = [...chatHistory, { role: "user", content: userMsg }];
    setChatHistory(newHistory);
    setChatLoading(true);

    try {
      const { data } = await api.post("/ai/agent/chat", {
        trip_id: parseInt(id as string),
        message: userMsg,
        history: chatHistory
      });

      setChatHistory([...newHistory, { role: "assistant", content: data.reply }]);
      // Refresh the trip in case the AI modified it
      fetchTrip();
    } catch (err) {
      setChatHistory([...newHistory, { role: "assistant", content: "Sorry, I encountered an error. Is Ollama running?" }]);
    } finally {
      setChatLoading(false);
    }
  };

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
    <div className="flex flex-col h-screen bg-[#0a0a0a] text-white overflow-hidden font-sans">
      <nav className="flex-none border-b border-white/10 px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <a href="/trips" className="text-sm text-gray-400 hover:text-white transition-colors uppercase tracking-widest font-medium">
            ← Trips
          </a>
          <h1 className="text-2xl font-serif font-medium tracking-wide">{trip.title}</h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowChat(!showChat)}
            className={`text-sm px-6 py-2.5 border rounded-full transition-all flex items-center gap-2 tracking-wide font-medium ${
              showChat 
                ? "bg-[#e87a5d] border-[#e87a5d] text-white" 
                : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
            }`}
          >
            AI Assistant
          </button>
          <button 
            onClick={() => setShowShareModal(true)}
            className="text-sm px-6 py-2.5 bg-white/5 text-gray-300 border border-white/10 rounded-full hover:bg-white/10 transition-all tracking-wide font-medium"
          >
            Share
          </button>
          <button 
            onClick={() => setDays([...days, days.length + 1])}
            className="text-sm px-6 py-2.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all tracking-wide font-medium"
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
                <div key={day} className="flex-none w-[340px] flex flex-col bg-[#0f0f0f] rounded-2xl border border-white/5 overflow-hidden">
                  <div className="p-5 border-b border-white/5 bg-[#141414]">
                    <h2 className="font-serif text-lg tracking-wide">Day {day}</h2>
                  </div>
                  
                  <div className="p-4 flex-1 overflow-y-auto">
                    <SortableContext
                      id={`day-${day}`}
                      items={dayItems.map(i => i.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="flex flex-col gap-4 min-h-[100px]">
                        {dayItems.map((item) => (
                          <SortableItem key={item.id} item={item} onRemove={handleRemoveItem} />
                        ))}
                      </div>
                    </SortableContext>
                    
                    {/* Add Place Dropdown */}
                    <div className="mt-6">
                      <select
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-400 hover:border-white/20 transition-colors cursor-pointer outline-none focus:border-[#e87a5d]"
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
        <div className="w-[450px] border-l border-white/5 p-0 bg-[#0a0a0a] hidden xl:block z-0 relative">
          <TripMap items={optimisticItems} />
        </div>
      </div>

      {/* Floating Chat Panel */}
      {showChat && (
        <div className="absolute bottom-8 right-8 xl:right-[480px] w-[400px] h-[550px] bg-[#0f0f0f] border border-white/10 rounded-3xl shadow-2xl flex flex-col z-40 overflow-hidden transform transition-all">
          <div className="bg-[#141414] p-5 border-b border-white/5 flex justify-between items-center">
            <div className="flex items-center gap-3 font-serif text-lg tracking-wide">
              Trip Assistant
            </div>
            <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-white transition-colors">✕</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatHistory.length === 0 && (
              <div className="text-center text-sm text-gray-500 mt-10">
                <p>Hi! I'm your AI Trip Assistant.</p>
                <p className="mt-2">Try asking me to:</p>
                <ul className="mt-2 space-y-1 text-gray-400">
                  <li>"Add the Louvre to Day 1"</li>
                  <li>"Remove item 3"</li>
                  <li>"Optimize my route"</li>
                  <li>"What's the weather in Paris?"</li>
                </ul>
              </div>
            )}
            
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm font-light leading-relaxed ${
                  msg.role === "user" 
                    ? "bg-[#e87a5d] text-white rounded-br-sm" 
                    : "bg-[#1a1a1a] text-gray-200 border border-white/5 rounded-bl-sm"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-[#1a1a1a] text-gray-400 border border-white/5 rounded-2xl rounded-bl-sm px-5 py-3 text-sm flex gap-1">
                  <span className="animate-bounce">.</span><span className="animate-bounce delay-75">.</span><span className="animate-bounce delay-150">.</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendChat} className="p-4 border-t border-white/5 bg-[#141414]">
            <div className="relative">
              <input 
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Ask the AI to edit your trip..."
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl pl-5 pr-12 py-3 text-sm text-white focus:outline-none focus:border-[#e87a5d] transition-colors"
              />
              <button 
                type="submit" 
                disabled={chatLoading || !chatMessage.trim()}
                className="absolute right-3 top-2.5 w-8 h-8 flex items-center justify-center bg-[#e87a5d] text-white rounded-lg hover:bg-[#d66b4f] disabled:opacity-50 transition-colors"
              >
                ↑
              </button>
            </div>
          </form>
        </div>
      )}

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
