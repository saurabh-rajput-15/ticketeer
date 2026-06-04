import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EventType } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Clock } from "lucide-react";

export function EventPage() {
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setEvents(data);
        } else {
          console.error("Failed to load events:", data);
          setEvents([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setEvents([]);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading events...</div>;

  // For this prototype, we'll just show the first event if available, 
  // or a list if multiple. Let's just create an index listing of events.

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-12">
      <div className="text-[11px] uppercase tracking-[0.2em] font-bold text-orange-600 mb-3">Live Registration</div>
      <h1 className="text-4xl md:text-6xl font-light tracking-tight leading-[0.9] font-serif mb-12 italic">Upcoming Events</h1>
      <div className="grid gap-12 md:grid-cols-2">
        {events.map(event => (
          <div key={event.id} className="group relative border border-black/5 bg-white p-8 hover:shadow-xl transition-shadow flex flex-col">
            {event.bannerUrl && (
              <img src={event.bannerUrl} alt={event.name} className="w-full h-48 object-cover mb-6 border border-black/5" />
            )}
            <div className="flex-1">
              <h2 className="text-3xl font-light tracking-tight font-serif italic mb-3 leading-[1.1]">{event.name}</h2>
              <p className="text-sm opacity-70 mb-6 line-clamp-3 leading-relaxed">{event.description}</p>
              
              <div className="space-y-2 text-[11px] uppercase tracking-widest font-semibold opacity-60 mb-8 border-l-2 border-orange-600 pl-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4" />
                  {new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4" />
                  {new Date(event.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <MapPin className="w-4 h-4" />
                  {event.location}
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-black/10">
              <EventTicketSelector eventId={event.id} />
            </div>
          </div>
        ))}
      </div>
      {events.length === 0 && <div className="text-[11px] uppercase tracking-widest opacity-40 text-center py-24">No events found.</div>}
    </div>
  );
}

function EventTicketSelector({ eventId }: { eventId: string }) {
  const [eventDetails, setEventDetails] = useState<EventType | null>(null);

  useEffect(() => {
    fetch(`/api/events/${eventId}`)
      .then(res => res.json())
      .then(data => setEventDetails(data));
  }, [eventId]);

  if (!eventDetails || !eventDetails.ticketTypes) return <div className="text-[11px] uppercase tracking-widest opacity-40">Loading tickets...</div>;

  return (
    <div className="w-full flex flex-col gap-4">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 pb-2 border-b border-black/10 mb-2">Available Tickets</h3>
      {eventDetails.ticketTypes.map(tt => (
        <div key={tt.id} className="flex justify-between items-center group/ticket">
          <div>
            <div className="text-sm font-bold">{tt.name}</div>
            <div className="text-[11px] uppercase tracking-widest opacity-60 mt-1">₹{(tt.price).toFixed(2)} &middot; {tt.availability > 0 ? `${tt.availability} left` : 'Sold Out'}</div>
          </div>
          <Link to={tt.availability > 0 ? `/checkout/${eventId}/${tt.id}` : "#"}>
            <button disabled={tt.availability <= 0} className={`px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full transition-colors ${tt.availability <= 0 ? "opacity-30 cursor-not-allowed bg-black/5" : "bg-black text-white hover:bg-zinc-800"}`}>
              {tt.availability > 0 ? "Select" : "Sold Out"}
            </button>
          </Link>
        </div>
      ))}
    </div>
  );
}
