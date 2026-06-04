/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AttendeeCheckout } from "./pages/AttendeeCheckout";
import { EventPage } from "./pages/EventPage";
import { TicketSuccess } from "./pages/TicketSuccess";
import { OrganizerDashboard } from "./pages/OrganizerDashboard";
import { VolunteerScanner } from "./pages/VolunteerScanner";
import { AdminPanel } from "./pages/AdminPanel";
import { AdminLogin } from "./pages/AdminLogin";
import { AdminRegister } from "./pages/AdminRegister";

// A simple protected route wrapper
function AdminRoute({ children }: { children: JSX.Element }) {
  const isAuthenticated = localStorage.getItem("adminToken") === "authenticated";
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(localStorage.getItem("adminToken") === "authenticated");
  }, [location]);

  return (
    <header className="h-16 px-8 flex items-center justify-between border-b border-black/5 bg-white/50 backdrop-blur-md sticky top-0 z-10 transition-all">
      <div className="flex items-center gap-8">
        <Link to="/" className="text-xl font-bold tracking-tighter font-serif uppercase">Ticketeer</Link>
        {isAuthenticated && (
          <nav className="hidden md:flex gap-6 text-[11px] uppercase tracking-widest font-semibold opacity-60">
            <Link to="/" className="hover:opacity-100 transition-opacity">Explore</Link>
            <Link to="/organizer" className="hover:opacity-100 transition-opacity">Organizer Portal</Link>
            <Link to="/volunteer" className="hover:opacity-100 transition-opacity">Gate Scanner</Link>
          </nav>
        )}
      </div>
      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            <Link to="/admin/create" className="hidden md:block text-[11px] uppercase tracking-widest font-semibold opacity-40 hover:opacity-100 transition-opacity">Launch Event</Link>
            <Link to="/admin/create">
              <button className="px-4 py-2 bg-black hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-[0.2em] rounded-full transition-colors h-auto">Host</button>
            </Link>
            <button 
              onClick={() => { localStorage.removeItem("adminToken"); localStorage.removeItem("adminAccount"); navigate('/admin/login'); }}
              className="hidden md:block text-[11px] uppercase tracking-widest font-bold opacity-60 hover:opacity-100 transition-opacity text-red-600"
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link to="/admin/login" className="hidden md:block text-[11px] uppercase tracking-widest font-semibold opacity-40 hover:opacity-100 transition-opacity">Login</Link>
            <Link to="/admin/register">
              <button className="px-4 py-2 bg-black hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-[0.2em] rounded-full transition-colors h-auto">Sign Up</button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen font-sans flex flex-col">
        <Navigation />
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/register" element={<AdminRegister />} />
            
            <Route path="/" element={<EventPage />} />
            <Route path="/checkout/:eventId/:ticketId" element={<AttendeeCheckout />} />
            <Route path="/ticket/:regId" element={<TicketSuccess />} />
            <Route path="/organizer" element={<AdminRoute><OrganizerDashboard /></AdminRoute>} />
            <Route path="/admin/create" element={<AdminRoute><AdminPanel /></AdminRoute>} />
            <Route path="/volunteer" element={<AdminRoute><VolunteerScanner /></AdminRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Toaster />
      </div>
    </Router>
  );
}
