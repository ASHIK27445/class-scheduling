const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const port = process.env.PORT || 5000;

// ─── MongoDB Connection 
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_SEC}@cluster0.md2layq.mongodb.net/?appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


const app = express();
app.use(cors());
app.use(express.json());


const dbName = 'eduschedule';     
let slotsCollection;             


function parseDateTime(dateStr, timeStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

function slotsOverlap(slot1, slot2) {
  if (slot1.date !== slot2.date) return false;
  const start1 = parseDateTime(slot1.date, slot1.startTime);
  const end1 = parseDateTime(slot1.date, slot1.endTime);
  const start2 = parseDateTime(slot2.date, slot2.startTime);
  const end2 = parseDateTime(slot2.date, slot2.endTime);
  return start1 < end2 && start2 < end1;
}

// ─── Connect to MongoDB and start server 
async function run() {
  try {
    // await client.connect();
    const db = client.db(dbName);
    slotsCollection = db.collection('slots'); 

    console.log('Connected to MongoDB – using database:', dbName);


    // GET all slots
    app.get('/api/slots', async (req, res) => {
      try {
        const slots = await slotsCollection.find().sort({ date: 1, startTime: 1 }).toArray();
        res.json(slots);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });

    // POST – generate 15‑minute blocks
    app.post('/api/slots/generate', async (req, res) => {
      try {
        const { date, start, end, location } = req.body;
        if (!date || !start || !end) {
          return res.status(400).json({ message: 'Date, start, and end are required.' });
        }

        const startDate = parseDateTime(date, start);
        const endDate = parseDateTime(date, end);
        if (endDate <= startDate) {
          return res.status(400).json({ message: 'End time must be after start time.' });
        }
        if (endDate < new Date()) {
          return res.status(400).json({ message: 'Cannot add slots entirely in the past.' });
        }

        let cursor = new Date(startDate);
        cursor.setMinutes(Math.floor(cursor.getMinutes() / 15) * 15, 0, 0);


        const existingOnDate = await slotsCollection.find({ date }).toArray();

        const newSlots = [];
        let added = 0, skippedOverlap = 0, skippedPast = 0;

        while (cursor < endDate) {
          const slotStart = new Date(cursor);
          const slotEnd = new Date(cursor);
          slotEnd.setMinutes(slotEnd.getMinutes() + 15);
          if (slotEnd > endDate) break;

          const sTime = `${String(slotStart.getHours()).padStart(2, '0')}:${String(slotStart.getMinutes()).padStart(2, '0')}`;
          const eTime = `${String(slotEnd.getHours()).padStart(2, '0')}:${String(slotEnd.getMinutes()).padStart(2, '0')}`;

          const candidate = {
            date,
            startTime: sTime,
            endTime: eTime,
            status: 'available',
            studentName: null,
            location: location || 'Room 402',
          };

          if (parseDateTime(date, sTime) < new Date()) {
            skippedPast++;
            cursor = slotEnd;
            continue;
          }

          const allSlots = [...existingOnDate, ...newSlots];
          const overlaps = allSlots.some(s => slotsOverlap(candidate, s));
          if (overlaps) {
            skippedOverlap++;
            cursor = slotEnd;
            continue;
          }

          newSlots.push(candidate);
          added++;
          cursor = slotEnd;
        }

        if (newSlots.length > 0) {
          const result = await slotsCollection.insertMany(newSlots);
          const insertedIds = Object.values(result.insertedIds);
          const inserted = await slotsCollection.find({ _id: { $in: insertedIds } }).toArray();
          return res.status(201).json({
            message: `Generated ${added} slots.`,
            skippedOverlap,
            skippedPast,
            slots: inserted,
          });
        }

        res.status(200).json({
          message: 'No slots generated.',
          skippedOverlap,
          skippedPast,
          slots: [],
        });
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });

    // PATCH – book a slot
    app.patch('/api/slots/:id/book', async (req, res) => {
      try {
        const { studentName } = req.body;
        if (!studentName || studentName.trim().length < 2) {
          return res.status(400).json({ message: 'Student name required (min 2 chars).' });
        }

        const slot = await slotsCollection.findOne({ _id: new ObjectId(req.params.id) });
        if (!slot) return res.status(404).json({ message: 'Slot not found.' });
        if (slot.status === 'booked') return res.status(400).json({ message: 'Slot already booked.' });
        if (parseDateTime(slot.date, slot.startTime) < new Date()) {
          return res.status(400).json({ message: 'Cannot book past slot.' });
        }

        await slotsCollection.updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: { status: 'booked', studentName: studentName.trim() } }
        );

        const updated = await slotsCollection.findOne({ _id: new ObjectId(req.params.id) });
        res.json(updated);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });

    // PATCH – cancel a booking
    app.patch('/api/slots/:id/cancel', async (req, res) => {
      try {
        const slot = await slotsCollection.findOne({ _id: new ObjectId(req.params.id) });
        if (!slot) return res.status(404).json({ message: 'Slot not found.' });
        if (slot.status !== 'booked') return res.status(400).json({ message: 'Slot is not booked.' });

        await slotsCollection.updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: { status: 'available', studentName: null } }
        );

        const updated = await slotsCollection.findOne({ _id: new ObjectId(req.params.id) });
        res.json(updated);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });

    // DELETE – single slot
    app.delete('/api/slots/:id', async (req, res) => {
      try {
        const slot = await slotsCollection.findOne({ _id: new ObjectId(req.params.id) });
        if (!slot) return res.status(404).json({ message: 'Slot not found.' });
        if (slot.status === 'booked') {
          return res.status(400).json({ message: 'Cannot delete a booked slot. Cancel first.' });
        }
        await slotsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
        res.json({ message: 'Slot deleted.' });
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });

    // DELETE – clear all slots
    app.delete('/api/slots/clear/all', async (req, res) => {
      try {
        const { force } = req.query;
        if (force !== 'true') {
          const bookedCount = await slotsCollection.countDocuments({ status: 'booked' });
          if (bookedCount > 0) {
            return res.status(400).json({
              message: `There are ${bookedCount} booked slots. Use ?force=true to clear all.`,
            });
          }
        }
        await slotsCollection.deleteMany({});
        res.json({ message: 'All slots cleared.' });
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });

    // Ping to confirm connection
    // await client.db("admin").command({ ping: 1 });
    console.log("✅ Successfully connected to MongoDB Atlas!");

  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('EduSchedule API is running...');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});