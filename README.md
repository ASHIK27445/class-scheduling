# EduSchedule — Teacher–Student Slot Booking System

A full-stack scheduling application where a teacher can create and manage 15-minute consultation slots, and students can view and book those slots in real time.

---

## What I Implemented

### Teacher Dashboard (`TeacherView.jsx`)
- Displays teacher name (Prof. Smith) and three live summary cards: **Total Slots**, **Available**, and **Booked**
- A form to generate 15-minute slot blocks by specifying a date, start time, end time, and location
- An **hour-grouped visual grid** showing all slots for each date, colour-coded by status (available = blue dashed, booked = strikethrough hatched)
- A **list table** below the grid with date, time, location, student name, status badge, and per-slot actions (Delete or Cancel booking)
- A **Clear All** button (with confirmation) that uses `?force=true` to bypass the booked-slot guard on the backend

### Student Booking View (`StudentBookingView.jsx`)
- Shows only future available slots, grouped by date
- Clicking a time chip selects it (highlighted in primary blue)
- Student enters their name and clicks **Book Now**, which sends a `PATCH /api/slots/:id/book` request
- On success, the slot disappears from the list immediately via a context refresh

### Shared Infrastructure
| File | Purpose |
|---|---|
| `SlotContext.jsx` | Creates the React context object |
| `SlotProvider.jsx` | Fetches all slots on mount, provides `slots`, `loading`, `refreshSlots` to the tree |
| `slotHelpers.js` | Pure utility functions (`parseDateTime`, `formatTimeOnly`, `formatDate`, `isPastSlot`, `getTomorrow`) and the design-token colour map `C` |
| `Sidebar.jsx` | Navigation with `react-router` `NavLink` (active-state border highlight) |
| `TaskMain.jsx` | Root layout — sidebar + `<Outlet />` + `<Toaster />` for toast notifications |

---

## How Slot Conflicts Are Handled

Conflict detection happens **on the server** inside the `/api/slots/generate` endpoint (`index.js`).

### Algorithm

```
parseDateTime(dateStr, timeStr) → JS Date
slotsOverlap(slot1, slot2)      → boolean
```

`slotsOverlap` checks whether two slots share the same date **and** their time intervals intersect using the standard half-open interval test:

```
start1 < end2  &&  start2 < end1
```

When generating blocks, the backend:
1. Fetches all **existing** slots on the requested date from MongoDB
2. Iterates through 15-minute windows between `start` and `end`
3. For every candidate window, checks it against existing slots **plus any already-queued new slots in the same batch** (the `[...existingOnDate, ...newSlots]` merge)
4. Skips overlapping windows (`skippedOverlap++`) and past windows (`skippedPast++`)
5. Returns counts of added vs. skipped so the UI can display a meaningful message

This means:
- Re-generating the same range is safe — duplicates are silently skipped
- Partial overlaps (e.g. a 30-min block overlapping a 15-min block) are caught correctly
- The check is atomic within the request (no race window between fetch and insert for the same request)

### Past-slot guard (double-checked)
- **Frontend**: `isPastSlot(date, startTime)` filters the slot list before rendering and shows a form error before even sending the request
- **Backend**: each candidate window is compared against `new Date()` server-side, so a clock-skewed client cannot insert past slots

### Booking guard
The `PATCH /api/slots/:id/book` endpoint re-reads the slot from MongoDB before writing and rejects if:
- `status === 'booked'` (already taken)
- slot start time is in the past

---

## Project Structure

```
project-root/
├── backend/
│   └── index.js               # Express server, MongoDB routes
│
└── frontend/
    └── src/
        └── components/
            └── task/
                ├── TaskMain.jsx           # Root layout (sidebar + outlet)
                ├── Sidebar.jsx            # Navigation
                ├── SlotContext.jsx        # React context definition
                ├── SlotProvider.jsx       # Data fetching + context provider
                ├── slotHelpers.js         # Utility functions + colour tokens
                ├── TeacherView.jsx        # Teacher dashboard page
                └── StudentBookingView.jsx # Student booking page
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Tailwind CSS, react-router, react-hot-toast |
| Backend | Node.js, Express |
| Database | MongoDB Atlas (via official Node.js driver) |
| Fonts / Icons | Google Fonts (Public Sans, Lexend), Material Symbols Outlined |

---

## How to Run the Project

### Prerequisites
- Node.js 18+
- A MongoDB Atlas cluster (or local MongoDB)
- A `.env` file in the backend directory

### 1 — Backend

```bash
cd backend
npm install
```

Create a `.env` file:

```env
PORT=5000
DB_USER=your_mongo_username
DB_SEC=your_mongo_password
```

Start the server:

```bash
node index.js
```

The API will be available at `http://localhost:5000`.

### 2 — Frontend

```bash
cd frontend
npm install
```

Create a `.env` file:

```env
VITE_API_BASE_LINK=http://localhost:5000/api
```

Start the dev server:

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### 3 — Routing

The app uses `react-router`. Ensure your router is set up with at least these routes:

```jsx
export const router = createBrowserRouter([
    {
        path: '/', Component: TaskMain,
        children: [
            {index: true, Component: TeacherView},
            {path:'student', Component: StudentView},
            {path:'teacher', Component: TeacherView },
            {path:'my-slots', Component: MySlots}
        ]
    }
])
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/slots` | Fetch all slots (sorted by date, time) |
| `POST` | `/api/slots/generate` | Generate 15-min blocks for a date range |
| `PATCH` | `/api/slots/:id/book` | Book a slot (requires `{ studentName }`) |
| `PATCH` | `/api/slots/:id/cancel` | Cancel a booking |
| `DELETE` | `/api/slots/:id` | Delete a single available slot |
| `DELETE` | `/api/slots/clear/all?force=true` | Delete all slots |

### `POST /api/slots/generate` body

```json
{
  "date": "2025-06-10",
  "start": "09:00",
  "end": "11:00",
  "location": "Room 402"
}
```

Response includes `{ message, skippedOverlap, skippedPast, slots[] }`.

---

## Slot Data Model (MongoDB)

```json
{
  "_id": "ObjectId",
  "date": "2025-06-10",
  "startTime": "09:00",
  "endTime": "09:15",
  "status": "available | booked",
  "studentName": null,
  "location": "Room 402"
}
```

---

## Design Decisions

- **15-minute granularity is enforced server-side** — the generate endpoint snaps the cursor to the nearest 15-minute boundary and advances in 15-minute steps regardless of what `start` the client sends.
- **Stateless frontend** — all slot state lives in `SlotProvider`. Any mutation (book, cancel, delete, generate) ends with `refreshSlots()`, which re-fetches from the server. This keeps the UI always in sync with the database.
- **No authentication** — the system assumes a single teacher and any student by name. Adding auth would be the natural next step.
- **Colour tokens in `slotHelpers.js`** — the `C` object holds all design colours so they can be changed in one place and all views stay consistent.