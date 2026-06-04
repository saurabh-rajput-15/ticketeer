import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { apiFetch } from "@/lib/api";

export function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      localStorage.setItem("adminToken", "authenticated");
      localStorage.setItem("adminAccount", JSON.stringify(data.account));
      toast.success(`Welcome, ${data.account.username}`);
      navigate("/organizer");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center p-8 bg-[#F9F9F7]">
      <div className="w-full max-w-sm bg-white border border-black/10 p-8 shadow-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white mb-6">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-light font-serif italic tracking-tight mb-2">Portal Login</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] opacity-40 font-bold">Secure Access</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold opacity-50 tracking-wider">Username</label>
            <input 
              required 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              className="w-full bg-transparent border-b border-black/20 pb-2 focus:outline-none focus:border-black transition-colors rounded-none" 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold opacity-50 tracking-wider">Password</label>
            <input 
              required 
              type="password"
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full bg-transparent border-b border-black/20 pb-2 focus:outline-none focus:border-black transition-colors rounded-none" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full pt-4 pb-4 mt-4 bg-black text-white text-[11px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Authenticate"}
          </button>
          
          <div className="text-center mt-6 text-sm opacity-60">
            Don't have a host account? <Link to="/admin/register" className="font-bold underline">Sign Up</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
