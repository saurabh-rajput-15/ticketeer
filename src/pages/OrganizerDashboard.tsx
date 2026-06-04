import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EventType, RegistrationType } from "@/types";
import { Users, FileSpreadsheet, PlusCircle, LogOut, Send, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

export function OrganizerDashboard() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventType[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationType[]>([]);
  const [account, setAccount] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'broadcast'>('overview');
  
  // Team Form
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'volunteer' });
  const [broadcastMessage, setBroadcastMessage] = useState("");

  useEffect(() => {
    const accStr = localStorage.getItem("adminAccount");
    if (!accStr) {
       navigate("/admin/login");
       return;
    }
    const acc = JSON.parse(accStr);
    setAccount(acc);
    if (acc.role === 'volunteer') {
       navigate("/volunteer");
       return;
    }

    apiFetch(`/api/events?accountId=${acc.id}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setEvents(data);
          if (data.length > 0) setSelectedEventId(data[0].id);
        } else {
          setEvents([]);
        }
      })
      .catch(() => setEvents([]));
  }, [navigate]);

  useEffect(() => {
    if (!selectedEventId) return;
    apiFetch(`/api/organizer/registrations/${selectedEventId}`)
      .then(res => res.json())
      .then(data => Array.isArray(data) ? setRegistrations(data) : setRegistrations([]))
      .catch(() => setRegistrations([]));
      
    if (activeTab === 'team') loadTeam();
  }, [selectedEventId, activeTab]);

  const loadTeam = () => {
    if (!selectedEventId) return;
    apiFetch(`/api/events/${selectedEventId}/users`)
      .then(res => res.json())
      .then(data => setTeamMembers(data));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
       const res = await apiFetch(`/api/events/${selectedEventId}/users`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(newUser)
       });
       const data = await res.json();
       if (!res.ok) throw new Error(data.error);
       toast.success("Team member added");
       setNewUser({ username: '', password: '', role: 'volunteer' });
       loadTeam();
    } catch(err: any) {
       toast.error(err.message);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage) return;
    try {
      const res = await apiFetch(`/api/events/${selectedEventId}/broadcast`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ message: broadcastMessage })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      setBroadcastMessage("");
    } catch(err: any) {
      toast.error(err.message);
    }
  };

  const activeEvent = events.find(e => e.id === selectedEventId);
  const checkedInCount = registrations.filter(r => r.isCheckedIn === 1).length;
  const totalRevenue = registrations.filter(r => r.paymentStatus === 'completed').reduce((sum, r) => sum + (r.price || 0), 0);

  const downloadCSV = () => {
    const csvRows = [];
    const headers = ['Order ID', 'Ticket Type', 'Name', 'Email', 'Status', 'Checked In'];
    csvRows.push(headers.join(','));

    for (const row of registrations) {
      const values = [
        row.id,
        row.ticketName || '',
        row.name.replace(/,/g, ''),
        row.email,
        row.paymentStatus,
        row.isCheckedIn === 1 ? 'Yes' : 'No'
      ];
      csvRows.push(values.join(','));
    }

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeEvent?.name?.replace(/\s+/g, '_')}_Attendees.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminAccount");
    navigate("/admin/login");
  };

  if (!account) return null;

  return (
    <div className="max-w-7xl mx-auto p-8 md:p-16 w-full">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16 border-b border-black/10 pb-8">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] font-bold opacity-50 mb-3">System Panel &mdash; Role: {account.role}</div>
          <h1 className="text-4xl md:text-5xl font-light font-serif italic tracking-tight leading-[1]">Organizer Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
           <button onClick={handleLogout} className="px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity border border-transparent hover:border-black/10">
             <LogOut className="w-3 h-3" /> Logout
           </button>
           {account.role === 'host' && (
             <Link to="/admin/create">
               <button className="px-4 py-2 bg-black text-white hover:bg-zinc-800 transition-colors text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                 <PlusCircle className="w-3 h-3" /> Launch Event
               </button>
             </Link>
           )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 border-b border-black/5 pb-4">
        {events.map(event => (
          <button
            key={event.id}
            onClick={() => { setSelectedEventId(event.id); setActiveTab('overview'); }}
            className={`px-4 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors ${selectedEventId === event.id ? 'bg-black text-white' : 'bg-transparent text-black opacity-40 hover:opacity-100 hover:bg-black/5'}`}
          >
            {event.name}
          </button>
        ))}
      </div>

      {activeEvent ? (
        <>
          <div className="flex gap-6 mb-12">
            <button onClick={() => setActiveTab('overview')} className={`text-[11px] font-bold uppercase tracking-[0.2em] ${activeTab === 'overview' ? 'opacity-100 border-b border-black pb-1' : 'opacity-40 hover:opacity-100'}`}>Overview</button>
            <button onClick={() => setActiveTab('team')} className={`text-[11px] font-bold uppercase tracking-[0.2em] ${activeTab === 'team' ? 'opacity-100 border-b border-black pb-1' : 'opacity-40 hover:opacity-100'}`}>Team Access</button>
            <button onClick={() => setActiveTab('broadcast')} className={`text-[11px] font-bold uppercase tracking-[0.2em] ${activeTab === 'broadcast' ? 'opacity-100 border-b border-black pb-1' : 'opacity-40 hover:opacity-100'}`}>Broadcast</button>
          </div>

          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                <div className="border border-black/10 p-8 flex flex-col justify-between">
                   <div className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-40 mb-8 border-b border-black/5 pb-2">Total Yield</div>
                   <div className="text-4xl font-light font-serif italic">₹{(totalRevenue).toFixed(2)}</div>
                </div>
                <div className="border border-black/10 p-8 flex flex-col justify-between">
                   <div className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-40 mb-8 border-b border-black/5 pb-2 flex justify-between">
                     Attendees <Users className="w-3 h-3" />
                   </div>
                   <div className="text-4xl font-light font-serif italic">{registrations.length}</div>
                </div>
                <div className="border border-black/10 p-8 flex flex-col justify-between relative bg-[#F9F9F7]">
                   <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-orange-600 mb-8 border-b border-black/5 pb-2">Gate Status</div>
                   <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-light font-serif italic">{checkedInCount}</span>
                      <span className="text-[11px] uppercase tracking-widest opacity-40">/ {registrations.length}</span>
                   </div>
                </div>
              </div>

              <div className="border border-black/10 bg-white">
                <div className="flex flex-col md:flex-row items-center justify-between p-6 border-b border-black/10">
                  <h2 className="text-lg font-light font-serif italic">Attendee Tracking</h2>
                  <button onClick={downloadCSV} className="text-[10px] uppercase font-bold tracking-[0.2em] flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                    <FileSpreadsheet className="w-3 h-3" /> Export CSV
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F9F9F7]">
                        <th className="p-4 text-[9px] uppercase tracking-[0.2em] opacity-40 font-bold border-b border-black/10">Order ID</th>
                        <th className="p-4 text-[9px] uppercase tracking-[0.2em] opacity-40 font-bold border-b border-black/10">Name</th>
                        <th className="p-4 text-[9px] uppercase tracking-[0.2em] opacity-40 font-bold border-b border-black/10">Ticket</th>
                        <th className="p-4 text-[9px] uppercase tracking-[0.2em] opacity-40 font-bold border-b border-black/10">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrations.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-12 text-center text-[10px] uppercase tracking-[0.2em] opacity-40 italic">
                            No attendees yet.
                          </td>
                        </tr>
                      )}
                      {registrations.map(reg => (
                        <tr key={reg.id} className="border-b border-black/5 hover:bg-black/5 transition-colors">
                          <td className="p-4 font-mono text-[10px] opacity-60 uppercase">{reg.id}</td>
                          <td className="p-4">
                            <div className="text-sm font-medium">{reg.name}</div>
                            <div className="text-[10px] opacity-60 tracking-wider">{reg.email}</div>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-black/5 text-[9px] uppercase tracking-[0.2em] font-bold opacity-80 inline-block">
                              {reg.ticketName}
                            </span>
                          </td>
                          <td className="p-4">
                            {reg.isCheckedIn === 1 ? (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-[9px] uppercase tracking-[0.2em] font-bold">Checked In</span>
                            ) : (
                              <span className="px-2 py-1 bg-[#F9F9F7] text-black/40 border border-black/10 text-[9px] uppercase tracking-[0.2em] font-bold">Expected</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'team' && (
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-light font-serif italic mb-6">Create Access</h3>
                <form onSubmit={handleCreateUser} className="space-y-6 bg-white p-8 border border-black/10">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold opacity-50 tracking-wider">Role</label>
                    <select required value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full bg-transparent border-b border-black/20 pb-2 focus:outline-none focus:border-black transition-colors rounded-none outline-none appearance-none font-bold">
                      {account.role === 'host' && <option value="cohost">Co-Host</option>}
                      <option value="volunteer">Volunteer (Scanner)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold opacity-50 tracking-wider">Username</label>
                    <input required value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} className="w-full bg-transparent border-b border-black/20 pb-2 focus:outline-none focus:border-black transition-colors rounded-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold opacity-50 tracking-wider">Password</label>
                    <input required type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full bg-transparent border-b border-black/20 pb-2 focus:outline-none focus:border-black transition-colors rounded-none" />
                  </div>
                  <button type="submit" className="pt-4 pb-4 px-6 bg-black text-white text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors">
                    <UserPlus className="w-3 h-3" /> Add Member
                  </button>
                </form>
              </div>

              <div>
                <h3 className="text-2xl font-light font-serif italic mb-6">Active Team</h3>
                <div className="space-y-4">
                  {teamMembers.length === 0 && <p className="opacity-40 italic text-sm">No team members added yet.</p>}
                  {teamMembers.map((m) => (
                    <div key={m.id} className="flex justify-between items-center p-4 border border-black/10 bg-white">
                       <div>
                         <div className="font-bold">{m.username}</div>
                         <div className="text-[10px] uppercase tracking-widest opacity-50">{m.role}</div>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'broadcast' && (
            <div className="max-w-2xl">
              <h3 className="text-2xl font-light font-serif italic mb-6">Broadcast Message</h3>
              <p className="opacity-60 text-sm mb-8 leading-relaxed">Send an email announcement to all registered attendees for this event. Useful for pre-event instructions or last-minute location updates.</p>
              
              <form onSubmit={handleBroadcast} className="space-y-6">
                 <div className="space-y-2">
                   <label className="text-[10px] uppercase font-bold opacity-50 tracking-wider">Message</label>
                   <textarea required value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value)} className="w-full bg-white border border-black/20 p-4 min-h-[150px] focus:outline-none focus:border-black transition-colors rounded-none" placeholder="We are excited to see you tomorrow..." />
                 </div>
                 <button type="submit" className="pt-4 pb-4 px-8 bg-black text-white text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors">
                    <Send className="w-3 h-3" /> Send to {registrations.length} Attendees
                 </button>
              </form>
            </div>
          )}
        </>
      ) : (
        <div className="py-24 text-center opacity-40 italic font-serif text-xl border border-black/10 border-dashed">
          No events created yet.
        </div>
      )}
    </div>
  );
}
