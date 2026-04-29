# EduSchedule — Academic Slot Booking System

A full-stack web application where a **teacher** can create and manage 15-minute time slots, and **students** can view and book those slots in real time.

---

## What I Implemented

| Feature | Status |
|---|---|
| Teacher dashboard — create slots by date/time range | ✅ |
| Auto-generate 15-minute blocks from a range | ✅ |
| Slot conflict / overlap detection (server + client) | ✅ |
| Past slot prevention (add & book) | ✅ |
| Student booking view with slot grid | ✅ |
| Cancel a booking (teacher) | ✅ |
| Delete an available slot (teacher) | ✅ |
| Clear all slots | ✅ |
| Persistent storage via MongoDB Atlas | ✅ (Bonus) |
| Shared React context for real-time UI sync | ✅ |

---

## Project Structure

```
project-root/
├── server/
│   └── eduServer.js          # Express + MongoDB REST API
│
└── client/src/
    ├── context/
    │   ├── SlotContext.jsx    # React context definition
    │   └── SlotProvider.jsx   # Fetches slots, provides state globally
    │
    ├── helpers/
    │   └── slotHelpers.js     # Shared pure utility functions + color tokens
    │
    ├── pages/
    │   ├── Dashboard.jsx      # Layout shell (renders Sidebar)
    │   ├── TeacherView.jsx    # Teacher dashboard — slot creation & management
    │   ├── StudentBookingView.jsx  # Student view — browse & book slots
    │   └── MySlots.jsx        # Student's personal booked slots
    │
    └── components/
        └── Sidebar.jsx        # Navigation sidebar with NavLink highlighting
```

---

## How to Run the Project

### Prerequisites

- Node.js v18+
- A MongoDB Atlas cluster (or local MongoDB)

### 1. Clone and install

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure environment variables

Create a `.env` file inside the `server/` folder:

```env
PORT=5000
DB_USER=your_mongo_username
DB_SEC=your_mongo_password
```

### 3. Start the server

```bash
cd server
node eduServer.js
```

The API will be available at `http://localhost:5000`.

### 4. Start the client

```bash
cd client
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/slots` | Fetch all slots (sorted by date & time) |
| `POST` | `/api/slots/generate` | Generate 15-min blocks for a date/time range |
| `PATCH` | `/api/slots/:id/book` | Book a slot with a student name |
| `PATCH` | `/api/slots/:id/cancel` | Cancel a booking → set back to available |
| `DELETE` | `/api/slots/:id` | Delete a single available slot |
| `DELETE` | `/api/slots/clear/all` | Delete all slots (use `?force=true` to include booked) |

---

## How I Handled Slot Conflicts

Conflict detection runs at **two layers**:

### Server-side (authoritative)

In `eduServer.js`, the `slotsOverlap()` function compares two slots:

```js
function slotsOverlap(slot1, slot2) {
  if (slot1.date !== slot2.date) return false;
  const start1 = parseDateTime(slot1.date, slot1.startTime);
  const end1   = parseDateTime(slot1.date, slot1.endTime);
  const start2 = parseDateTime(slot2.date, slot2.startTime);
  const end2   = parseDateTime(slot2.date, slot2.endTime);
  return start1 < end2 && start2 < end1;  // standard interval overlap test
}
```

When generating slots, each candidate block is checked against:
1. **Existing slots in MongoDB** for the same date
2. **Slots already generated in this batch** (prevents intra-batch overlaps)

Slots that overlap are skipped and reported back (`skippedOverlap` count) rather than rejected with an error.

### Client-side (UX guard)

`isPastSlot()` in `slotHelpers.js` hides past slots immediately in the UI so students never see or click them — even if the server hasn't cleaned them yet:

```js
export function isPastSlot(dateStr, timeStr) {
  return parseDateTime(dateStr, timeStr) < new Date();
}
```

### Booking guard

Before a `PATCH /book` is applied, the server re-checks that the slot's start time is still in the future and its status is still `available` — preventing race conditions if two students try to book the same slot simultaneously.

---

## How the Code Is Structured

### State Management — `SlotProvider` + `SlotContext`

All slot data lives in a single React context. `SlotProvider` fetches from the API on mount and exposes `{ slots, loading, refreshSlots }` to the whole component tree. Both `TeacherView` and `StudentBookingView` call `refreshSlots()` after any mutation, keeping the UI automatically in sync.

### Shared Utilities — `slotHelpers.js`

Pure functions used by both views with no side effects:

- `parseDateTime` — converts `"2025-07-15"` + `"09:30"` into a JS `Date`
- `formatTimeOnly` / `formatDate` — locale-aware display formatting
- `isPastSlot` — boolean guard for past slots
- `getTomorrow` — default date for the slot generator form
- `C` — a single object of Material Design 3 color tokens used for all inline styles

### Teacher View — `TeacherView.jsx`

- Form to pick a date, start time, end time, and location
- Sends `POST /api/slots/generate` → server returns the created slots with skip counts
- Lists all slots grouped by date; each row shows status, time, student name (if booked), and action buttons (Cancel / Delete)

### Student View — `StudentBookingView.jsx`

- Filters slots to `status === "available"` and `!isPastSlot()`
- Groups them by date and renders a clickable grid
- Selected slot + name input → `PATCH /api/slots/:id/book`

---

## Technology Choices

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React + Vite | Fast dev server, JSX component model |
| Styling | Tailwind CSS | Utility-first, no context switching |
| Routing | React Router v7 | `NavLink` with active-state styling |
| Backend | Express.js | Minimal, easy REST API setup |
| Database | MongoDB Atlas | Schema-flexible, free tier, cloud-hosted |
| Notifications | react-hot-toast | Lightweight success/error toasts |

---

## Slot Rules Summary

- Every slot is exactly **15 minutes** long
- Slots in the **past cannot be added or booked**
- **Overlapping** slots on the same date are automatically skipped during generation
- A slot must be **cancelled before it can be deleted**
- Only **available** slots appear in the student booking view