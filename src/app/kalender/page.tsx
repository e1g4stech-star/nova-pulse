"use client";

import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  allDay: boolean;
  color: string;
  category: string;
  platform: string | null;
  isCompleted: boolean;
  createdAt: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  tags: string[];
  isPinned: boolean;
  createdAt: string;
}

const COLORS: Record<string, string> = {
  cyan: "from-cyan-500 to-blue-500",
  purple: "from-purple-500 to-pink-500",
  green: "from-green-500 to-emerald-500",
  yellow: "from-yellow-500 to-orange-500",
  red: "from-red-500 to-pink-500",
  pink: "from-pink-500 to-rose-500",
};

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const DAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export default function KalenderPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "list" | "notes">("month");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  // Event form
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [eventForm, setEventForm] = useState({
    id: "",    
    title: "",
    description: "",
    startDate: "",
    startTime: "09:00",
    endTime: "10:00",
    color: "cyan",
    category: "umum",
    platform: "",
  });

  // Note form
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteForm, setNoteForm] = useState({
    title: "",
    content: "",
    color: "cyan",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);

  const [dragOverDay, setDragOverDay] = useState<number | null>(null);

  // Fetch events
  async function fetchEvents() {
    try {
      const month = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
      const res = await fetch(`/api/calendar?month=${month}`);
      const json = await res.json();
      if (json.success) setEvents(json.data);
    } catch (err) {
      console.error(err);
    }
  }

  // Fetch notes
  async function fetchNotes() {
    try {
      const res = await fetch("/api/notes");
      const json = await res.json();
      if (json.success) setNotes(json.data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    Promise.all([fetchEvents(), fetchNotes()]).then(() => setLoading(false));
  }, [currentDate]);

  // Calendar calculations
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Monday = 0, Sunday = 6
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const days: (number | null)[] = [];

    // Empty cells before first day
    for (let i = 0; i < startDay; i++) days.push(null);

    // Days of month
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(i);

    // Fill remaining cells to complete weeks
    while (days.length % 7 !== 0) days.push(null);

    return days;
  }, [currentDate]);

  function getEventsForDay(day: number): CalendarEvent[] {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return events.filter((e) => {
      const d = new Date(e.startDate);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  }

  function isToday(day: number): boolean {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  }
  async function handleDropOnDay(targetDay: number) {
    if (!draggedEventId) return;

    const event = events.find((e) => e.id === draggedEventId);
    if (!event) return;

    const oldDate = new Date(event.startDate);
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      targetDay,
      oldDate.getHours(),
      oldDate.getMinutes(),
      oldDate.getSeconds()
    );

    const previousEvents = events;

    // Optimistic update
    setEvents((prev) =>
      prev.map((e) =>
        e.id === draggedEventId
          ? { ...e, startDate: newDate.toISOString() }
          : e
      )
    );

    const movedId = draggedEventId;
    setDraggedEventId(null);
    setDragOverDay(null);

    try {
      const res = await fetch(`/api/calendar/${movedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: newDate.toISOString() }),
      });
      if (!res.ok) throw new Error("Failed");
      setSuccess("Event dipindahkan");
      setTimeout(() => setSuccess(""), 2000);
    } catch {
      setEvents(previousEvents);
      setError("Gagal memindahkan event");
      setTimeout(() => setError(""), 3000);
    }
  }

    function openEventForm(day?: number, event?: any) {
    if (event) {
      const start = new Date(event.startDate);
      const end = event.endDate ? new Date(event.endDate) : null;
      const dateStr = start.toISOString().split("T")[0];
      const startTime = String(start.getHours()).padStart(2, "0") + ":" + String(start.getMinutes()).padStart(2, "0");
      const endTime = end
        ? String(end.getHours()).padStart(2, "0") + ":" + String(end.getMinutes()).padStart(2, "0")
        : "10:00";

      setSelectedDate(dateStr);
      setEventForm({
        id: event.id,
        title: event.title || "",
        description: event.description || "",
        startDate: dateStr,
        startTime,
        endTime,
        color: event.color || "cyan",
        category: event.category || "umum",
        platform: event.platform || "",
      });
      setShowEventForm(true);
      return;
    }

    const dateStr = day
      ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      : `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;

    setSelectedDate(dateStr);
    setEventForm({
      id: "",
      title: "",
      description: "",
      startDate: dateStr,
      startTime: "09:00",
      endTime: "10:00",
      color: "cyan",
      category: "umum",
      platform: "",
    });
    setShowEventForm(true);
  }

  async function handleEventSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const startDate = new Date(`${eventForm.startDate}T${eventForm.startTime}:00`);
      const endDate = new Date(`${eventForm.startDate}T${eventForm.endTime}:00`);

            const isEdit = Boolean(eventForm.id);
      const url = isEdit ? `/api/calendar/${eventForm.id}` : "/api/calendar";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: eventForm.title,
          description: eventForm.description,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          color: eventForm.color,
          category: eventForm.category,
          platform: eventForm.platform || null,
        }),
      });

      const json = await res.json();

      if (json.success || res.ok) {
        setSuccess(isEdit ? "Event berhasil diupdate!" : "Event berhasil ditambahkan!");
        setShowEventForm(false);
        fetchEvents();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(json.error || (isEdit ? "Gagal update event" : "Gagal tambah event"));
      }
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleNoteSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteForm),
      });

      const json = await res.json();

      if (json.success) {
        setSuccess("✅ Note berhasil ditambahkan!");
        setShowNoteForm(false);
        setNoteForm({ title: "", content: "", color: "cyan" });
        fetchNotes();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(json.error || "Gagal tambah note");
      }
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function deleteEvent(id: string) {
    if (!confirm("Hapus event ini?")) return;
    try {
      const res = await fetch(`/api/calendar/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setEvents(events.filter((e) => e.id !== id));
        setSuccess("✅ Event dihapus");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteNote(id: string) {
    if (!confirm("Hapus note ini?")) return;
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setNotes(notes.filter((n) => n.id !== id));
        setSuccess("✅ Note dihapus");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function togglePin(note: Note) {
    try {
      const res = await fetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !note.isPinned }),
      });
      const json = await res.json();
      if (json.success) fetchNotes();
    } catch (err) {
      console.error(err);
    }
  }

  function changeMonth(delta: number) {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  }

  // Get events for list view (sorted)
  const sortedEvents = useMemo(() => {
    return [...events].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  }, [events]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex flex-wrap justify-between items-start gap-4">
            <div>
              <p className="text-cyan-400 text-sm font-bold tracking-widest mb-2">
                KALENDER
              </p>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                Jadwal & Catatan
              </h1>
              <p className="text-slate-400">
                Kelola jadwal postingan, event, dan catatan dalam satu tempat.
              </p>
            </div>
            <button
              onClick={() => openEventForm()}
              className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition"
            >
              + Tambah Event
            </button>
          </div>

          {/* View Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {[
              { id: "month", label: "Month View", icon: "📅" },
              { id: "list", label: "List View", icon: "📋" },
              { id: "notes", label: "Notes", icon: "📝" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setView(tab.id as any)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
                  view === tab.id
                    ? "bg-cyan-500 text-white"
                    : "bg-slate-800/60 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Alerts */}
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-xl mb-6">
              ❌ {error}
            </div>
          )}
          {success && (
            <div className="bg-green-500/20 border border-green-500 text-green-300 p-4 rounded-xl mb-6">
              {success}
            </div>
          )}

          {/* MONTH VIEW */}
          {view === "month" && (
            <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-cyan-500/20">
              {/* Month Header */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => changeMonth(-1)}
                  className="bg-slate-700 hover:bg-slate-600 text-white w-10 h-10 rounded-lg transition"
                >
                  ←
                </button>
                <h2 className="text-2xl font-bold text-white">
                  {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <button
                  onClick={() => changeMonth(1)}
                  className="bg-slate-700 hover:bg-slate-600 text-white w-10 h-10 rounded-lg transition"
                >
                  →
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className="text-center text-cyan-400 text-xs font-bold py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, idx) => {
                  const dayEvents = day ? getEventsForDay(day) : [];
                  const today = day ? isToday(day) : false;

                  return (
                    <div
                      key={idx}
                      onDragOver={(e) => { if (day && draggedEventId) { e.preventDefault(); setDragOverDay(day); } }}
                      onDragLeave={() => setDragOverDay(null)}
                      onDrop={(e) => { e.preventDefault(); if (day) handleDropOnDay(day); }}
                      onClick={() => day && !draggedEventId && openEventForm(day)}
                      className={`min-h-[100px] rounded-lg p-2 cursor-pointer transition border ${
                        day
                          ? today
                            ? "bg-cyan-500/20 border-cyan-500/50 hover:bg-cyan-500/30"
                            : "bg-slate-900/50 border-slate-700 hover:bg-slate-900/80 hover:border-cyan-500/30"
                          : "bg-transparent border-transparent cursor-default"
                      }`}
                    >
                      {day && (
                        <>
                          <div
                            className={`text-sm font-bold mb-1 ${
                              today ? "text-cyan-300" : "text-slate-300"
                            }`}
                          >
                            {day}
                          </div>
                          <div className="space-y-1">
                            {dayEvents.slice(0, 3).map((event) => (
  <div
    key={event.id}
    draggable
    onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", event.id); setDraggedEventId(event.id); }}
    onDragEnd={() => { setDraggedEventId(null); setDragOverDay(null); }}
    onClick={(e) => {
      e.stopPropagation();
      openEventForm(undefined, event);
    }}
    className={`text-[10px] px-1.5 py-0.5 rounded bg-gradient-to-r ${
      COLORS[event.color] || COLORS.cyan
    } text-white truncate flex justify-between items-center gap-1 group cursor-pointer hover:opacity-90`}
  >
    <span className="truncate">{event.title}</span>
    <button
      onClick={(e) => {
        e.stopPropagation();
        deleteEvent(event.id);
      }}
      className="opacity-0 group-hover:opacity-100 text-white/80 hover:text-white"
    >
      ×
    </button>
  </div>
))}
                            {dayEvents.length > 3 && (
                              <div className="text-[10px] text-slate-400">
                                +{dayEvents.length - 3} lagi
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* LIST VIEW */}
          {view === "list" && (
            <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-cyan-500/20">
              <h2 className="text-xl font-bold text-white mb-4">
                Agenda Bulan Ini
              </h2>

              {sortedEvents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-slate-400 mb-4">Belum ada event bulan ini</p>
                  <button
                    onClick={() => openEventForm()}
                    className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold px-6 py-2 rounded-xl hover:opacity-90 transition"
                  >
                    + Tambah Event
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedEvents.map((event) => {
                    const start = new Date(event.startDate);
                    const end = event.endDate ? new Date(event.endDate) : null;

                    return (
                      <div
                        key={event.id}
                        className="flex items-start gap-4 bg-slate-900/50 rounded-xl p-4 hover:bg-slate-900/70 transition group"
                      >
                        <div
                          className={`w-1 h-full min-h-[60px] rounded-full bg-gradient-to-b ${
                            COLORS[event.color] || COLORS.cyan
                          }`}
                        />
                        <div className="flex-1 cursor-pointer hover:opacity-80 transition" onClick={() => openEventForm(undefined, event)}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-cyan-400 font-bold">
                              {start.toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </span>
                            <span className="text-xs text-slate-500">
                              {start.toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {end &&
                                ` - ${end.toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}`}
                            </span>
                          </div>
                          <h3 className="text-white font-bold">{event.title}</h3>
                          {event.description && (
                            <p className="text-slate-400 text-sm mt-1">
                              {event.description}
                            </p>
                          )}
                          <div className="flex gap-2 mt-2">
                            <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                              {event.category}
                            </span>
                            {event.platform && (
                              <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                                {event.platform}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteEvent(event.id)}
                          className="text-red-400 hover:text-red-300 text-sm opacity-0 group-hover:opacity-100 transition"
                        >
                          Hapus
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* NOTES VIEW */}
          {view === "notes" && (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setShowNoteForm(true)}
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold px-6 py-2 rounded-xl hover:opacity-90 transition"
                >
                  + Tambah Note
                </button>
              </div>

              {notes.length === 0 ? (
                <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-12 text-center border border-cyan-500/20">
                  <div className="text-6xl mb-4">📝</div>
                  <p className="text-slate-400 mb-4">Belum ada catatan</p>
                  <button
                    onClick={() => setShowNoteForm(true)}
                    className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold px-6 py-2 rounded-xl hover:opacity-90 transition"
                  >
                    Buat Note Pertama
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className={`bg-gradient-to-br ${
                        COLORS[note.color] || COLORS.cyan
                      } p-[1px] rounded-2xl transition`}
                    >
                      <div className="bg-slate-900/95 rounded-2xl p-5 h-full">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-white font-bold flex-1 pr-2">
                            {note.title}
                          </h3>
                          <button
                            onClick={() => togglePin(note)}
                            className={`text-lg ${
                              note.isPinned ? "text-yellow-400" : "text-slate-600 hover:text-yellow-400"
                            } transition`}
                          >
                            📌
                          </button>
                        </div>
                        <p className="text-slate-300 text-sm whitespace-pre-wrap mb-3">
                          {note.content}
                        </p>
                        {note.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {note.tags.map((tag, i) => (
                              <span
                                key={i}
                                className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-3 border-t border-slate-700">
                          <span className="text-xs text-slate-500">
                            {new Date(note.createdAt).toLocaleDateString("id-ID")}
                          </span>
                          <button
                            onClick={() => deleteNote(note.id)}
                            className="text-red-400 hover:text-red-300 text-xs"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* EVENT FORM MODAL */}
        {showEventForm && (
          <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowEventForm(false)}
          >
            <div
              className="bg-slate-900 rounded-2xl p-6 max-w-lg w-full border border-cyan-500/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Tambah Event</h3>
                <button
                  onClick={() => setShowEventForm(false)}
                  className="text-slate-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleEventSubmit} className="space-y-4">
                <div>
                  <label className="block text-cyan-300 mb-2 font-semibold text-sm">
                    Judul *
                  </label>
                  <input
                    type="text"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    required
                    placeholder="Post TikTok skincare"
                    className="w-full bg-slate-800 text-white rounded-xl p-3 border border-slate-700 focus:border-cyan-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-cyan-300 mb-2 font-semibold text-sm">
                    Deskripsi
                  </label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    rows={2}
                    placeholder="Detail event..."
                    className="w-full bg-slate-800 text-white rounded-xl p-3 border border-slate-700 focus:border-cyan-500 outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-cyan-300 mb-2 font-semibold text-sm">
                      Tanggal
                    </label>
                    <input
                      type="date"
                      value={eventForm.startDate}
                      onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                      required
                      className="w-full bg-slate-800 text-white rounded-xl p-3 border border-slate-700 focus:border-cyan-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-cyan-300 mb-2 font-semibold text-sm">
                      Mulai
                    </label>
                    <input
                      type="time"
                      value={eventForm.startTime}
                      onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                      className="w-full bg-slate-800 text-white rounded-xl p-3 border border-slate-700 focus:border-cyan-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-cyan-300 mb-2 font-semibold text-sm">
                      Selesai
                    </label>
                    <input
                      type="time"
                      value={eventForm.endTime}
                      onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                      className="w-full bg-slate-800 text-white rounded-xl p-3 border border-slate-700 focus:border-cyan-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-cyan-300 mb-2 font-semibold text-sm">
                      Kategori
                    </label>
                    <select
                      value={eventForm.category}
                      onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                      className="w-full bg-slate-800 text-white rounded-xl p-3 border border-slate-700 focus:border-cyan-500 outline-none"
                    >
                      <option value="umum">Umum</option>
                      <option value="posting">Posting</option>
                      <option value="meeting">Meeting</option>
                      <option value="deadline">Deadline</option>
                      <option value="personal">Personal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-cyan-300 mb-2 font-semibold text-sm">
                      Platform
                    </label>
                    <select
                      value={eventForm.platform}
                      onChange={(e) => setEventForm({ ...eventForm, platform: e.target.value })}
                      className="w-full bg-slate-800 text-white rounded-xl p-3 border border-slate-700 focus:border-cyan-500 outline-none"
                    >
                      <option value="">- Tidak ada -</option>
                      <option value="instagram">Instagram</option>
                      <option value="tiktok">TikTok</option>
                      <option value="youtube">YouTube</option>
                      <option value="facebook">Facebook</option>
                      <option value="pinterest">Pinterest</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-cyan-300 mb-2 font-semibold text-sm">
                    Warna
                  </label>
                  <div className="flex gap-2">
                    {Object.keys(COLORS).map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setEventForm({ ...eventForm, color })}
                        className={`w-10 h-10 rounded-lg bg-gradient-to-r ${COLORS[color]} ${
                          eventForm.color === color
                            ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900"
                            : "opacity-60"
                        } transition`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEventForm(false)}
                    className="flex-1 bg-slate-700 text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-600 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold py-3 rounded-xl hover:opacity-90 transition"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* NOTE FORM MODAL */}
        {showNoteForm && (
          <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowNoteForm(false)}
          >
            <div
              className="bg-slate-900 rounded-2xl p-6 max-w-lg w-full border border-cyan-500/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Tambah Note</h3>
                <button
                  onClick={() => setShowNoteForm(false)}
                  className="text-slate-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleNoteSubmit} className="space-y-4">
                <div>
                  <label className="block text-cyan-300 mb-2 font-semibold text-sm">
                    Judul *
                  </label>
                  <input
                    type="text"
                    value={noteForm.title}
                    onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                    required
                    placeholder="Ide konten besok"
                    className="w-full bg-slate-800 text-white rounded-xl p-3 border border-slate-700 focus:border-cyan-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-cyan-300 mb-2 font-semibold text-sm">
                    Konten *
                  </label>
                  <textarea
                    value={noteForm.content}
                    onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                    required
                    rows={6}
                    placeholder="Tulis catatan di sini..."
                    className="w-full bg-slate-800 text-white rounded-xl p-3 border border-slate-700 focus:border-cyan-500 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-cyan-300 mb-2 font-semibold text-sm">
                    Warna
                  </label>
                  <div className="flex gap-2">
                    {Object.keys(COLORS).map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNoteForm({ ...noteForm, color })}
                        className={`w-10 h-10 rounded-lg bg-gradient-to-r ${COLORS[color]} ${
                          noteForm.color === color
                            ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900"
                            : "opacity-60"
                        } transition`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNoteForm(false)}
                    className="flex-1 bg-slate-700 text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-600 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold py-3 rounded-xl hover:opacity-90 transition"
                  >
                    Simpan Note
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  );
}