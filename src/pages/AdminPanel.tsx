import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Save, Plus, X } from "lucide-react";

export function AdminPanel() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    date: "",
    location: "",
    organizerName: "",
  });
  const [ticketTiers, setTicketTiers] = useState([
    { id: crypto.randomUUID(), name: "General Admission", price: 0, quantity: 100 }
  ]);

  const addTicketTier = () => {
    setTicketTiers([...ticketTiers, { id: crypto.randomUUID(), name: "VIP Pass", price: 0, quantity: 50 }]);
  };

  const removeTicketTier = (id: string) => {
    if (ticketTiers.length === 1) return toast.error("You must have at least one ticket tier.");
    setTicketTiers(ticketTiers.filter(t => t.id !== id));
  };

  const updateTicketTier = (id: string, field: string, value: string | number) => {
    setTicketTiers(ticketTiers.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ticketTiers.length === 0) return toast.error("Please add at least one ticket tier.");
    setIsSubmitting(true);
    let hostId = null;
    try {
      const stored = localStorage.getItem("adminAccount");
      if (stored) {
        const acc = JSON.parse(stored);
        if (acc.id !== "admin") hostId = acc.id;
      }
    } catch (e) {}

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          date: new Date(formData.date).toISOString(),
          location: formData.location,
          organizerName: formData.organizerName,
          hostId,
          ticketTypes: ticketTiers.map(t => ({
            name: t.name,
            price: Number(t.price),
            quantity: Number(t.quantity)
          }))
        })
      });

      if (!res.ok) {
        throw new Error("Failed to create event");
      }

      toast.success("Event created successfully!");
      navigate("/organizer");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 md:p-16">
      <button 
        onClick={() => navigate("/organizer")}
        className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-50 hover:opacity-100 flex items-center gap-2 mb-12"
      >
        <ArrowLeft className="w-3 h-3" /> Back to Dashboard
      </button>

      <div className="mb-12 border-b border-black/10 pb-8">
        <div className="text-[11px] uppercase tracking-[0.2em] font-bold opacity-50 mb-3">Admin Panel</div>
        <h1 className="text-4xl md:text-5xl font-light font-serif italic tracking-tight leading-[1]">Create Event</h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold opacity-50 tracking-wider">Event Name</label>
            <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-transparent border-b border-black/20 pb-2 text-lg focus:outline-none focus:border-black placeholder:opacity-20 transition-colors rounded-none" placeholder="Summer Groove Festival" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold opacity-50 tracking-wider">Organizer Name</label>
            <input required value={formData.organizerName} onChange={e => setFormData({...formData, organizerName: e.target.value})} className="w-full bg-transparent border-b border-black/20 pb-2 text-lg focus:outline-none focus:border-black placeholder:opacity-20 transition-colors rounded-none" placeholder="Groove Co." />
          </div>
        </div>

        <div className="space-y-2 flex-1">
          <label className="text-[10px] uppercase font-bold opacity-50 tracking-wider">Description</label>
          <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-transparent border-b border-black/20 pb-2 text-lg focus:outline-none focus:border-black placeholder:opacity-20 transition-colors rounded-none min-h-[100px]" placeholder="Event details..." />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold opacity-50 tracking-wider">Date & Time</label>
            <input required type="datetime-local" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-transparent border-b border-black/20 pb-2 text-lg focus:outline-none focus:border-black transition-colors rounded-none" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold opacity-50 tracking-wider">Location</label>
            <input required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full bg-transparent border-b border-black/20 pb-2 text-lg focus:outline-none focus:border-black placeholder:opacity-20 transition-colors rounded-none" placeholder="Downtown Park" />
          </div>
        </div>

        <div className="pt-8 border-t border-black/10 mt-12 mb-8">
           <div className="flex items-center justify-between mb-6">
             <h3 className="text-xl font-light font-serif italic">Ticket Tiers</h3>
             <button type="button" onClick={addTicketTier} className="text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-2 border border-black/20 hover:border-black transition-colors flex items-center gap-2">
               <Plus className="w-3 h-3" /> Add Tier
             </button>
           </div>
           
           <div className="space-y-6">
             {ticketTiers.map((tier, index) => (
               <div key={tier.id} className="relative bg-[#F9F9F7] p-8 border border-black/10">
                  <div className="absolute top-4 right-4 text-[10px] uppercase font-bold opacity-40">Tier {index + 1}</div>
                  <div className="grid md:grid-cols-3 gap-8 pr-12">
                     <div className="space-y-2">
                       <label className="text-[10px] uppercase font-bold opacity-50 tracking-wider">Ticket Name</label>
                       <input required value={tier.name} onChange={e => updateTicketTier(tier.id, 'name', e.target.value)} className="w-full bg-transparent border-b border-black/20 pb-2 text-lg focus:outline-none focus:border-black transition-colors rounded-none" />
                     </div>
                     <div className="space-y-2">
                       <label className="text-[10px] uppercase font-bold opacity-50 tracking-wider">Price (₹)</label>
                       <input required type="number" min="0" step="0.01" value={tier.price} onChange={e => updateTicketTier(tier.id, 'price', e.target.value)} className="w-full bg-transparent border-b border-black/20 pb-2 text-lg focus:outline-none focus:border-black transition-colors rounded-none" />
                     </div>
                     <div className="space-y-2">
                       <label className="text-[10px] uppercase font-bold opacity-50 tracking-wider">Quantity</label>
                       <input required type="number" min="1" value={tier.quantity} onChange={e => updateTicketTier(tier.id, 'quantity', e.target.value)} className="w-full bg-transparent border-b border-black/20 pb-2 text-lg focus:outline-none focus:border-black transition-colors rounded-none" />
                     </div>
                  </div>
                  {ticketTiers.length > 1 && (
                    <button type="button" onClick={() => removeTicketTier(tier.id)} className="absolute top-1/2 -translate-y-1/2 right-4 p-2 text-red-500 hover:bg-red-50 transition-colors rounded-full" title="Remove Tier">
                      <X className="w-4 h-4" />
                    </button>
                  )}
               </div>
             ))}
           </div>
        </div>

        <div className="pt-8 flex justify-end">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="px-8 py-4 bg-black text-white text-[11px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {isSubmitting ? "Creating..." : "Save Event"}
          </button>
        </div>
      </form>
    </div>
  );
}
