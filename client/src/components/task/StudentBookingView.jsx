import { use, useState } from "react";
import { SlotContext } from "./SlotContext";
import toast from "react-hot-toast";
import {
  formatTimeOnly,
  formatDate,
  getAmPm,
  getHourFromTime,
  isPastSlot, C
} from "./slotHelpers";

const StudentView = () => {
  const {slots, refreshSlots, loading} = use(SlotContext)
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [studentName, setStudentName] = useState("");
  const [bookingError, setBookingError] = useState("");

  const API_BASE = import.meta.env.VITE_API_BASE_LINK

  const availableSlots = slots.filter(s => s.status === "available" && !isPastSlot(s.date, s.startTime));
  const dates = [...new Set(availableSlots.map(s => s.date))].sort();

  const selectedSlot = slots.find(s => (s._id || s.id) === selectedSlotId);
  const selectedDisplay = selectedSlot
    ? `${formatDate(selectedSlot.date)}, ${formatTimeOnly(selectedSlot.startTime)}`
    : "None";

  async function handleBook() {
    setBookingError("");
    if (!selectedSlotId) { setBookingError("Please select a slot first."); return; }
    if (!studentName.trim() || studentName.trim().length < 2) {
      setBookingError("Name must be at least 2 characters.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/slots/${selectedSlotId}/book`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentName: studentName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Booking failed");
      toast.success(`Booked for ${studentName.trim()}!`, "success");
      setSelectedSlotId(null);
      setStudentName("");
      refreshSlots();
    } catch (err) {
      toast.error(err.message, "hoisere, error");
      console.log(err)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: C.onBackground, fontFamily: "'Public Sans', sans-serif" }}>Book a Time Slot</h1>
        <p className="text-base mt-2 max-w-2xl" style={{ color: C.onSurfaceVariant, fontFamily: "'Lexend', sans-serif" }}>
          Select an available 15‑minute window with <strong>Prof. Smith</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-20 -z-0" style={{ backgroundColor: C.primaryFixed }}></div>
            <div className="relative z-10 flex items-center gap-6 mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center border-2 shrink-0" style={{ backgroundColor: C.primaryFixed, borderColor: C.primary }}>
                <span className="material-symbols-outlined text-3xl" style={{ color: C.primary }}>school</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold">Prof. Smith</h2>
                <p className="text-xs mt-1" style={{ color: C.secondary }}>Computer Science Dept.</p>
              </div>
            </div>
            <div className="space-y-3 pt-3 border-t border-slate-100">
              {[["video_camera_front","Virtual / In‑Person"],["timer","15 Minute Duration"]].map(([icon, text]) => (
                <div key={icon} className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px]" style={{ color: C.secondary }}>{icon}</span>
                  <span className="text-sm font-medium" style={{ color: C.onSurfaceVariant, fontFamily: "'Public Sans', sans-serif" }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="border border-slate-200 rounded-xl p-6 shadow-sm" style={{ backgroundColor: C.surfaceBright }}>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[20px] mt-1" style={{ color: C.primary }}>info</span>
              <div>
                <h4 className="text-sm font-medium mb-1">Preparation Needed</h4>
                <p className="text-xs leading-relaxed" style={{ color: C.onSurfaceVariant }}>Please have your project draft ready 24 hours before your slot.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Slot Selector */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-end mb-6 border-b border-slate-100 pb-3">
              <h2 className="text-2xl font-semibold">Available Slots</h2>
              <span className="text-xs px-3 py-1 bg-slate-100 rounded-full text-slate-500">Eastern Time (ET)</span>
            </div>

            {loading ? (
              <div className="p-10 text-center"><span className="material-symbols-outlined text-2xl animate-spin">sync</span></div>
            ) : availableSlots.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-5xl text-slate-300">sentiment_neutral</span>
                <p className="text-base text-slate-500">No available slots right now.</p>
              </div>
            ) : (
              dates.map(date => {
                const daySlots = availableSlots.filter(s => s.date === date).sort((a,b) => a.startTime.localeCompare(b.startTime));
                return (
                  <div key={date} className="mb-8">
                    <h3 className="text-xs uppercase tracking-wider font-medium mb-6 flex items-center gap-2" style={{ color: C.primary, fontFamily: "'Public Sans', sans-serif" }}>
                      <span className="material-symbols-outlined text-lg">calendar_month</span> {formatDate(date)}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {daySlots.map(s => {
                        const slotId = s._id || s.id;
                        const isSelected = selectedSlotId === slotId;
                        const timeOnly = formatTimeOnly(s.startTime);
                        const amPm = getAmPm(getHourFromTime(s.startTime));
                        return (
                          <button key={slotId} onClick={() => setSelectedSlotId(slotId)}
                            className="flex flex-col items-center justify-center p-4 rounded-lg border border-dashed transition-all"
                            style={isSelected ? {
                              backgroundColor: C.primary, borderColor: C.primary, color: C.onPrimary,
                              boxShadow: `0 0 0 2px ${C.primary}, 0 4px 12px rgba(0,52,111,0.3)`
                            } : {
                              backgroundColor: C.surfaceBright, borderColor: C.primary, color: C.primary
                            }}
                          >
                            <span className="text-xl font-semibold">{timeOnly}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Booking Form*/}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
            <p className="text-base">
              Selected: <strong className="font-semibold" style={{ color: C.primary }}>{selectedDisplay}</strong>
            </p>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <input type="text" value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Your full name" className="flex-1 sm:w-48 px-3 py-2.5 bg-slate-50 border rounded text-sm" />
              <button onClick={handleBook} disabled={!selectedSlotId}
                className="w-full sm:w-auto px-6 py-2 text-white rounded-lg font-medium shadow-sm flex items-center gap-2 disabled:opacity-50 bg-[#00346f] text-sm hover:bg-[#1b6ecc]">
                Book Now
              </button>
            </div>
          </div>
          {bookingError && <p className="text-xs text-center text-red-600">{bookingError}</p>}
        </div>
      </div>
    </div>
  );
}
export default StudentView