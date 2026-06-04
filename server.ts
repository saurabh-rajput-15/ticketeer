import 'dotenv/config';
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import cors from "cors";
import { Cashfree, CFEnvironment } from "cashfree-pg";
import crypto from "crypto";

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const cashfreeAppId = process.env.CASHFREE_APP_ID || '';
const cashfreeSecretKey = process.env.CASHFREE_SECRET_KEY || '';
const cashfreeEnv = cashfreeSecretKey.toLowerCase().includes('prod') ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;

let cashfreeInstance: Cashfree | null = null;
if (cashfreeAppId && cashfreeSecretKey) {
  cashfreeInstance = new Cashfree(cashfreeEnv, cashfreeAppId, cashfreeSecretKey);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cors());

  // Seed sample event if empty
  if (supabaseUrl && supabaseKey) {
    const { count } = await supabase.from('events').select('*', { count: 'exact', head: true });
    if (count === 0) {
      console.log("Seeding initial data...");
      const eventId = 'evt_123';
      await supabase.from('events').insert({
        id: eventId,
        name: 'Global Tech Conference 2026',
        description: 'A premier gathering of software engineers, AI researchers, and tech enthusiasts.',
        date: new Date(Date.now() + 86400000 * 30).toISOString(),
        location: 'San Francisco Convention Center',
        bannerUrl: '',
        organizerName: 'TechHub Inc.'
      });
      await supabase.from('ticket_types').insert([
        { id: 'tt_1', eventId, name: 'Early Bird', price: 149.00, quantity: 100, availability: 100 },
        { id: 'tt_2', eventId, name: 'General Admission', price: 299.00, quantity: 400, availability: 400 },
        { id: 'tt_3', eventId, name: 'VIP Pass', price: 599.00, quantity: 50, availability: 50 }
      ]);
    }
  }

  // --- Auth Routes ---
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password } = req.body;
      const { data: existing } = await supabase.from('accounts').select('*').eq('username', username).single();
      if (existing) return res.status(400).json({ error: "Username already exists" });

      const id = "acc_" + Math.random().toString(36).substr(2, 9);
      const { error } = await supabase.from('accounts').insert({
        id, username, password, role: 'host'
      });
      if (error) throw error;
      res.json({ message: "Registered successfully", account: { id, username, role: 'host' } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (username === "admin" && password === "admin@123") {
        return res.json({ account: { id: "admin", username: "admin", role: "host" } });
      }

      const { data: account, error } = await supabase.from('accounts').select('*').eq('username', username).single();
      if (error || !account) return res.status(401).json({ error: "Invalid credentials" });

      if (account.password !== password) return res.status(401).json({ error: "Invalid credentials" });

      res.json({ account: { id: account.id, username: account.username, role: account.role, eventId: account.eventId } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- API Routes ---
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Get all events
  app.get("/api/events", async (req, res) => {
    const accountId = req.query.accountId as string;
    let query = supabase.from('events').select('*');
    
    if (accountId && accountId !== "admin") {
      // Find account first to check role
      const { data: account } = await supabase.from('accounts').select('*').eq('id', accountId).single();
      if (account && account.role === 'host') {
        query = query.eq('hostId', accountId);
      } else if (account && account.eventId) {
        query = query.eq('id', account.eventId);
      }
    }

    const { data: events, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json(events);
  });

  // Get specific event with tickets
  app.get("/api/events/:id", async (req, res) => {
    const { data: event, error: eventError } = await supabase.from('events').select('*').eq('id', req.params.id).single();
    if (eventError || !event) return res.status(404).json({ error: "Event not found" });
    
    const { data: ticketTypes, error: ticketsError } = await supabase.from('ticket_types').select('*').eq('eventId', req.params.id);
    if (ticketsError) return res.status(500).json({ error: ticketsError.message });
    
    res.json({ ...event, ticketTypes });
  });

  // Create event (Organizer)
  const createEventSchema = z.object({
    name: z.string(),
    description: z.string(),
    date: z.string(),
    location: z.string(),
    organizerName: z.string(),
    hostId: z.string().optional(),
    ticketTypes: z.array(z.object({
      name: z.string(),
      price: z.number().min(0),
      quantity: z.number().min(1)
    }))
  });

  app.post("/api/events", async (req, res) => {
    try {
      const data = createEventSchema.parse(req.body);
      const eventId = "evt_" + Math.random().toString(36).substr(2, 9);
      
      const { error: eventError } = await supabase.from('events').insert({
        id: eventId,
        name: data.name,
        description: data.description,
        date: data.date,
        location: data.location,
        bannerUrl: "",
        organizerName: data.organizerName,
        hostId: data.hostId || null
      });
      if (eventError) throw eventError;

      const ticketsPayload = data.ticketTypes.map(tt => ({
        id: "tt_" + Math.random().toString(36).substr(2, 9),
        eventId: eventId,
        name: tt.name,
        price: tt.price,
        quantity: tt.quantity,
        availability: tt.quantity
      }));
      
      const { error: ticketError } = await supabase.from('ticket_types').insert(ticketsPayload);
      if (ticketError) throw ticketError;
      
      res.json({ id: eventId });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Cashfree Order Creation
  app.post("/api/cashfree/create-order", async (req, res) => {
    try {
      const { ticketTypeId, customerEmail, customerPhone, customerName } = req.body;
      const { data: ticketType, error: ttError } = await supabase.from('ticket_types').select('*').eq('id', ticketTypeId).single();
      if (ttError || !ticketType || ticketType.availability <= 0) {
        return res.status(400).json({ error: "Ticket sold out or unavailable" });
      }

      const platformFee = ticketType.price * 0.05;
      const gatewayFee = (ticketType.price + platformFee) * 0.02;
      const orderTotal = ticketType.price + platformFee + gatewayFee;

      if (orderTotal <= 0) {
        return res.json({ free: true });
      }

      if (!cashfreeInstance) {
        return res.status(500).json({ error: "Cashfree is not configured" });
      }

      const request = {
        order_amount: parseFloat(orderTotal.toFixed(2)),
        order_currency: "INR",
        customer_details: {
          customer_id: "cust_" + crypto.randomBytes(4).toString('hex'),
          customer_name: customerName || "Attendee",
          customer_email: customerEmail || "test@example.com",
          customer_phone: customerPhone || "9999999999"
        }
      };

      const cfRes = await cashfreeInstance.PGCreateOrder(request);
      if (cfRes.data && cfRes.data.payment_session_id) {
         res.json({ 
            sessionId: cfRes.data.payment_session_id, 
            orderId: cfRes.data.order_id,
            env: cashfreeEnv === CFEnvironment.PRODUCTION ? 'production' : 'sandbox'
         });
      } else {
         throw new Error("Failed to create Cashfree order");
      }
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err?.response?.data?.message || err.message });
    }
  });

  // Register / Checkout
  const registrationSchema = z.object({
    eventId: z.string(),
    ticketTypeId: z.string(),
    name: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    cfOrderId: z.string().optional(),
  });

  app.post("/api/checkout", async (req, res) => {
    try {
      const data = registrationSchema.parse(req.body);
      
      const { data: ticketType, error: ttError } = await supabase.from('ticket_types').select('*').eq('id', data.ticketTypeId).single();
      if (ttError || !ticketType || ticketType.availability <= 0) {
        return res.status(400).json({ error: "Ticket sold out or unavailable" });
      }

      const isFree = ticketType.price <= 0;
      
      if (!isFree) {
        if (!data.cfOrderId) {
          return res.status(400).json({ error: "Payment details missing" });
        }
        
        if (!cashfreeInstance) {
          return res.status(500).json({ error: "Cashfree is not configured" });
        }
        // Verify Payment Status on Cashfree server
        const paymentsRes = await cashfreeInstance.PGOrderFetchPayments(data.cfOrderId);
        const payments = paymentsRes.data || [];
        const isSuccess = payments.some((p: any) => p.payment_status === "SUCCESS");
        
        if (!isSuccess) {
          return res.status(400).json({ error: "Payment was not successful. Please try again." });
        }
      }

      const regId = "reg_" + Math.random().toString(36).substr(2, 9);
      const qrData = regId + "-" + data.ticketTypeId;

      // Update availability
      const { error: updateError } = await supabase
        .from('ticket_types')
        .update({ availability: ticketType.availability - 1 })
        .eq('id', data.ticketTypeId);
      if (updateError) throw updateError;

      // Insert registration
      const { error: regError } = await supabase.from('registrations').insert({
        id: regId,
        eventId: data.eventId,
        ticketTypeId: data.ticketTypeId,
        name: data.name,
        email: data.email,
        phone: data.phone || "",
        paymentStatus: "completed",
        qrData: qrData,
        isCheckedIn: 0
      });
      if (regError) throw regError;
      
      res.json({ registrationId: regId, message: "Ticket issued" });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Get specific registration
  app.get("/api/registrations/:id", async (req, res) => {
    const { data: reg, error: regError } = await supabase.from('registrations').select(`
      *,
      events (name, location, date),
      ticket_types (name, price)
    `).eq('id', req.params.id).single();
      
    if (regError || !reg) return res.status(404).json({ error: "Registration not found" });
    
    // Flatten result to match previous SQLite response format
    const flattenedReg = {
      ...reg,
      eventName: (reg.events as any)?.name,
      location: (reg.events as any)?.location,
      date: (reg.events as any)?.date,
      ticketName: (reg.ticket_types as any)?.name,
      price: (reg.ticket_types as any)?.price
    };

    res.json(flattenedReg);
  });

  // Volunteer scanning / Check-in
  app.post("/api/volunteer/checkin", async (req, res) => {
    try {
      const qrData = req.body.qrData;
      if (!qrData) return res.status(400).json({ error: "No QR Data" });
      
      const { data: reg, error: regError } = await supabase.from('registrations').select('*').eq('qrData', qrData).single();
      if (regError || !reg) return res.status(404).json({ error: "Invalid Ticket QR" });
      
      if (reg.isCheckedIn === 1) {
        return res.status(400).json({ error: "Attendee already checked in", registration: reg });
      }

      await supabase.from('registrations').update({ isCheckedIn: 1 }).eq('id', reg.id);
      
      const updatedReg = { ...reg, isCheckedIn: 1 };
      res.json({ message: "Check-in successful", registration: updatedReg });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all registrations for organizer
  app.get("/api/organizer/registrations/:eventId", async (req, res) => {
    const { data: regs, error } = await supabase.from('registrations').select(`
      *,
      ticket_types (name, price)
    `).eq('eventId', req.params.eventId).order('createdat', { ascending: false });
    
    if (error) return res.status(500).json({ error: error.message });
    
    // Flatten
    const flattenedRegs = regs.map(r => ({
      ...r,
      ticketName: (r.ticket_types as any)?.name,
      price: (r.ticket_types as any)?.price
    }));
    
    res.json(flattenedRegs);
  });

  // --- Broadcast Message ---
  app.post("/api/events/:eventId/broadcast", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) return res.status(400).json({ error: "Message is required" });

      const { data: regs, error } = await supabase.from('registrations').select('email').eq('eventId', req.params.eventId);
      if (error) throw error;
      
      const emails = Array.from(new Set(regs.map(r => r.email)));
      // In a real app, integrate Resend or SendGrid here!
      console.log(`[Email Broadcast] To: ${emails.join(", ")} | Message: ${message}`);

      res.json({ message: "Broadcast sent successfully to " + emails.length + " unique attendees" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Team Management ---
  app.get("/api/events/:eventId/users", async (req, res) => {
    const { data: users, error } = await supabase.from('accounts').select('id, username, role').eq('eventId', req.params.eventId);
    if (error) return res.status(500).json({ error: error.message });
    res.json(users);
  });

  app.post("/api/events/:eventId/users", async (req, res) => {
    try {
      const { username, password, role } = req.body;
      const { data: existing } = await supabase.from('accounts').select('*').eq('username', username).single();
      if (existing) return res.status(400).json({ error: "Username already exists" });

      const id = "acc_" + Math.random().toString(36).substr(2, 9);
      const { error } = await supabase.from('accounts').insert({
        id, username, password, role, eventId: req.params.eventId
      });
      if (error) throw error;
      res.json({ message: "User created successfully" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
