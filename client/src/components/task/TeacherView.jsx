import { use, useState } from "react";
import { SlotContext } from "./SlotContext";
import toast from "react-hot-toast";
import {
  formatTimeOnly,
  formatDate,
  getAmPm,
  getHourFromTime,
  isPastSlot, C, getTomorrow,
  parseDateTime
} from "./slotHelpers";


const TeacherView = () =>{
  const {slots, setSlots, refreshSlots, loading} = use(SlotContext)
  const [form, setForm] = useState({
    date: getTomorrow(),
    start: "09:00",
    end: "11:00",
    location: "Room 402",
  });
  const [formError, setFormError] = useState("");

  const API_BASE = "http://localhost:5000/api";


  const isAvailableSlot = (s) =>
  s.status === "available" && !isPastSlot(s.date, s.startTime);
  
  const counts = {
    total: slots.length,
    available: slots.filter(isAvailableSlot).length,
    booked: slots.filter((s) => s.status === "booked").length,
  };


  async function handleGenerate(e) {
    e.preventDefault();
    setFormError("");
    if (!form.date || !form.start || !form.end) {
      setFormError("Please fill in all required fields.");
      return;
    }
    if (parseDateTime(form.date, form.end) <= parseDateTime(form.date, form.start)) {
      setFormError("End time must be after start time.");
      return;
    }
    if (parseDateTime(form.date, form.end) < new Date()) {
      setFormError("Cannot add slots entirely in the past.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/slots/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: form.date,
          start: form.start,
          end: form.end,
          location: form.location,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Generation failed");
      toast.success(data.message || "Slots generated", "success");
      if (data.skippedOverlap || data.skippedPast) {
        if (data.slots.length === 0) setFormError("No slots added. Check overlaps/past times.");
      }
      refreshSlots();
    } catch (err) {
      toast.error(err.message, "error");
    }
  }

  async function handleDeleteSlot(slotId) {
    if (!window.confirm("Delete this available slot?")) return;
    try {
      const res = await fetch(`${API_BASE}/slots/${slotId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Delete failed");
      toast.success(data.message, "success");
      refreshSlots();
    } catch (err) {
      toast.error(err.message, "error");
    }
  }

  async function handleCancelBooking(slotId) {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      const res = await fetch(`${API_BASE}/slots/${slotId}/cancel`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Cancel failed");
      toast.success("Booking cancelled", "success");
      refreshSlots();
    } catch (err) {
      toast.error(err.message, "error");
    }
  }

  async function handleClearAll() {
    const booked = slots.filter(s => s.status === 'booked').length;
    const confirmed = window.confirm(
      booked > 0
        ? `There are ${booked} booked slots. Clear all?`
        : "Remove all slots?"
    );
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_BASE}/slots/clear/all?force=true`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Clear failed");
      toast.success(data.message, "success");
      refreshSlots();
    } catch (err) {
      toast.error(err.message, "error");
    }
  }

  // Build grid data (unchanged from previous)
  const dates = [...new Set(slots.map((s) => s.date))].sort();

  return (
    <div className="flex flex-col gap-8">

      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-widest font-medium" style={{ color: C.secondary, fontFamily: "'Public Sans', sans-serif" }}>Faculty Overview</span>
          <h1 className="text-3xl font-bold" style={{ color: C.primary, fontFamily: "'Public Sans', sans-serif" }}>Good day, Prof. Smith</h1>
          <p className="text-base text-slate-500 max-w-xl" style={{ fontFamily: "'Lexend', sans-serif" }}>
            Manage your office hours and consultation slots. Generate 15-minute blocks for student bookings.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 w-full md:w-auto">
          {[
            { label: "Total Slots", value: counts.total, icon: "functions", color: C.primary },
            { label: "Available", value: counts.available, icon: "event_available", color: C.onBackground },
            { label: "Booked", value: counts.booked, icon: "event_busy", color: C.onBackground, span: true },
          ].map(({ label, value, icon, color, span }) => (
            <div key={label} className={`bg-white border border-slate-200 p-4 flex flex-col gap-2 rounded-lg shadow-sm${span ? " col-span-2 md:col-span-1" : ""}`}>
              <div className="flex items-center justify-between" style={{ color: C.secondary }}>
                <span className="text-xs font-medium tracking-wide" style={{ fontFamily: "'Public Sans', sans-serif" }}>{label}</span>
                <span className="material-symbols-outlined text-sm">{icon}</span>
              </div>
              <span className="text-2xl font-semibold" style={{ color, fontFamily: "'Public Sans', sans-serif" }}>{value}</span>
            </div>
          ))}
        </div>
      </section>


      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Leftside: Add Slot*/}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-6 sticky top-24 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: C.primaryFixed }}>
              <span className="material-symbols-outlined text-base" style={{ color: C.primary }}>add_circle</span>
            </div>
            <h2 className="text-xl font-semibold" style={{ color: C.primary, fontFamily: "'Public Sans', sans-serif" }}>Add New Slots</h2>
          </div>

          <form onSubmit={handleGenerate} className="flex flex-col gap-4" autoComplete="off">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium tracking-wide" style={{ color: C.onSurfaceVariant, fontFamily: "'Public Sans', sans-serif" }}>Select Date</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">calendar_month</span>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium tracking-wide" style={{ color: C.onSurfaceVariant, fontFamily: "'Public Sans', sans-serif" }}>Start</label>
                <input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} required className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium tracking-wide" style={{ color: C.onSurfaceVariant, fontFamily: "'Public Sans', sans-serif" }}>End</label>
                <input type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} required className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none" />
              </div>
            </div>

            <div className="p-3 rounded border border-slate-200 flex items-start gap-2" style={{ backgroundColor: C.surfaceContainer }}>
              <span className="material-symbols-outlined text-sm mt-0.5" style={{ color: C.secondary }}>info</span>
              <p className="text-xs leading-relaxed" style={{ color: C.secondary, fontFamily: "'Public Sans', sans-serif" }}>
                System automatically divides the time range into standard <strong>15-minute</strong> consultation blocks. Overlapping or past slots will be skipped.
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium tracking-wide" style={{ color: C.onSurfaceVariant, fontFamily: "'Public Sans', sans-serif" }}>Location / Link</label>
              <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Room 402 or Zoom Link" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none" />
            </div>

            <button type="submit" className="mt-2 text-white rounded text-sm font-medium py-3 px-4 shadow-sm flex justify-center items-center gap-2 active:scale-[0.98] transition-all hover:opacity-90" style={{ backgroundColor: C.primary, fontFamily: "'Public Sans', sans-serif" }}>
              Generate Slots
            </button>
          </form>

          {formError && <p className="text-xs text-center" style={{ color: C.error, fontFamily: "'Public Sans', sans-serif" }}>{formError}</p>}
        </div>

        {/* Rightside: Table and Avaiable Time*/}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="grid grid-cols-12 gap-0 border-b border-slate-200" style={{ backgroundColor: C.surfaceContainerLow }}>
              <div className="col-span-3 lg:col-span-2 p-3 border-r border-slate-200 text-right text-xs font-medium tracking-wide" style={{ color: C.secondary, fontFamily: "'Public Sans', sans-serif" }}>Time</div>
              <div className="col-span-9 lg:col-span-10 p-3 pl-6 text-xs font-medium tracking-wide" style={{ color: C.primary, fontFamily: "'Public Sans', sans-serif" }}>Consultation Blocks (15-min intervals)</div>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <span className="material-symbols-outlined text-2xl animate-spin">sync</span>
              </div>
            ) : dates.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-5xl" style={{ color: C.outlineVariant }}>event_busy</span>
                <p className="text-base" style={{ color: C.onSurfaceVariant, fontFamily: "'Lexend', sans-serif" }}>No slots created yet.</p>
                <p className="text-xs" style={{ color: C.outline, fontFamily: "'Public Sans', sans-serif" }}>Use the form to generate 15-minute consultation blocks.</p>
              </div>
            ) : (
              /* hour grid*/
              <div className="flex flex-col">
                {dates.map(dateStr => {
                  const dateSlots = slots.filter(s => s.date === dateStr);
                  const hourGroups = {};
                  dateSlots.forEach(s => {
                    const h = getHourFromTime(s.startTime);
                    if (!hourGroups[h]) hourGroups[h] = [];
                    hourGroups[h].push(s);
                  });
                  const sortedHours = Object.keys(hourGroups).map(Number).sort((a,b)=>a-b);

                  return (
                    <div key={dateStr}>
                      <div className="grid grid-cols-12 gap-0 border-b border-slate-200 bg-white">
                        <div className="col-span-12 p-3 pl-4 flex items-center gap-2 text-xs font-medium tracking-wide" style={{ color: C.primary, fontFamily: "'Public Sans', sans-serif" }}>
                          <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                          {formatDate(dateStr)}
                        </div>
                      </div>
                      {sortedHours.map(hour => {
                        const hourSlots = hourGroups[hour].sort((a,b) => a.startTime.localeCompare(b.startTime));
                        const amPm = getAmPm(hour);
                        const displayHour = hour % 12 === 0 ? 12 : hour % 12;
                        const hourLabel = String(displayHour).padStart(2,'0')+":00";
                        return (
                          <div key={hour} className="grid grid-cols-12 gap-0 border-b border-slate-100 group">
                            <div className="col-span-3 lg:col-span-2 p-4 border-r border-slate-200 flex flex-col justify-start items-end bg-slate-50 group-hover:bg-slate-100 transition-colors">
                              <span className="text-lg font-semibold" style={{ color: C.onSurfaceVariant }}>{hourLabel}</span>
                              <span className="text-xs" style={{ color: C.outline }}>{amPm}</span>
                            </div>
                            <div className="col-span-9 lg:col-span-10 p-4 pl-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white">
                              {hourSlots.map(s =>
                                s.status === "booked" ? (
                                  <div key={s._id} className="rounded p-3 flex flex-col opacity-80 cursor-not-allowed" style={{ backgroundColor: C.surfaceVariant, border: `1px solid ${C.outlineVariant}`, backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.06) 4px, rgba(0,0,0,0.06) 8px)" }}>
                                    <span className="text-xs font-medium line-through mb-1" style={{ color: C.onSurfaceVariant }}>{formatTimeOnly(s.startTime)} – {formatTimeOnly(s.endTime)}</span>
                                    <div className="px-2 py-0.5 rounded border text-center bg-white">
                                      <span className="text-xs line-through" style={{ color: C.outline }}>{s.studentName || "Booked"}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div key={s._id} onClick={() => handleDeleteSlot(s._id)} className="rounded p-3 flex flex-col cursor-pointer relative group/slot" style={{ backgroundColor: "#e8f4fc", border: `1px dashed ${C.primary}` }}>
                                    {console.log(s._id)}
                                    <span className="text-xs font-medium mb-1" style={{ color: C.primary }}>{formatTimeOnly(s.startTime)} – {formatTimeOnly(s.endTime)}</span>
                                    <span className="text-xs" style={{ color: C.secondary }}>Available</span>
                                    <span className="material-symbols-outlined text-[14px] absolute top-1 right-1.5 opacity-0 group-hover/slot:opacity-100" style={{ color: C.outline }}>close</span>
                                  </div>
                                )
                              )}
                              {Array.from({ length: 4 - hourSlots.length }).map((_,i) => (
                                <div key={i} className="rounded p-3 flex items-center justify-center" style={{ border: `1px dashed ${C.outlineVariant}`, backgroundColor: "#fafbfc", opacity: 0.5 }}>
                                  <span className="text-xs" style={{ color: C.outline }}>—</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Table*/}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xl font-semibold" style={{ color: C.primary, fontFamily: "'Public Sans', sans-serif" }}>All Slots (List View)</h3>
              <button onClick={handleClearAll} title="Clear all slots" className="transition-colors hover:text-red-600" style={{ color: C.secondary }}>
                <span className="material-symbols-outlined">delete_sweep</span>
              </button>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="border-b" style={{ backgroundColor: C.surfaceContainerLow }}>
                  <tr>
                    {["Date & Time","Location","Student","Status","Action"].map(h => (
                      <th key={h} className="p-3 text-xs font-medium tracking-wide" style={{ color: C.secondary, fontFamily: "'Public Sans', sans-serif" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="p-8 text-center">Loading...</td></tr>
                  ) : slots.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-500">No slots yet.</td></tr>
                  ) : (
                    [...slots].sort((a,b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)).map(s => {
                      const isBooked = s.status === "booked";
                      return (
                        <tr key={s._id || s.id} className="border-b hover:bg-slate-50">
                          <td className="p-3 text-sm">{formatDate(s.date)} · {formatTimeOnly(s.startTime)} - {formatTimeOnly(s.endTime)}</td>
                          <td className="p-3 text-sm text-slate-500">{s.location || '—'}</td>
                          <td className="p-3 text-sm">{isBooked ? s.studentName : <span className="italic text-slate-400">—</span>}</td>
                          <td className="p-3 text-right">
                            {isBooked ? (
                              <span className="inline-block rounded-full px-2.5 py-0.5 text-xs opacity-80 line-through bg-slate-100 text-slate-500">Booked</span>
                            ) : 
                            
                            (
                              <span className="inline-block rounded-full px-2.5 py-0.5 text-xs" style={{ backgroundColor: C.tertiaryContainer, color: C.onTertiaryContainer, animation:'pulse 2s infinite' }}>Available</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <button onClick={() => isBooked ? handleCancelBooking(s._id || s.id) : handleDeleteSlot(s._id || s.id)} className="text-xs hover:text-red-600 text-slate-400">
                              {isBooked ? "Cancel" : "Delete"}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
export default TeacherView
