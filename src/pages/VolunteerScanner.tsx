import { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { RegistrationType } from "@/types";
import { apiFetch } from "@/lib/api";

export function VolunteerScanner() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [successStatus, setSuccessStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [attendeeInfo, setAttendeeInfo] = useState<RegistrationType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [account, setAccount] = useState<any>(null);
  const [registrations, setRegistrations] = useState<RegistrationType[]>([]);

  useEffect(() => {
    const accStr = localStorage.getItem("adminAccount");
    if (accStr) {
       const acc = JSON.parse(accStr);
       setAccount(acc);
       if (acc.eventId) {
         apiFetch(`/api/organizer/registrations/${acc.eventId}`)
           .then(res => res.json())
           .then(data => {
             if (Array.isArray(data)) setRegistrations(data);
           })
           .catch(() => {});
       }
    }
  }, []);

  useEffect(() => {
    // Only init if not already initialized
    if (!scannerRef.current) {
        scannerRef.current = new Html5QrcodeScanner(
            "reader", 
            { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 }, 
            /* verbose= */ false
        );

        scannerRef.current.render(
            async (decodedText) => {
                 if (successStatus === 'scanning') return; // Prevent multiple scans
                 setSuccessStatus('scanning');
                 setScanResult(decodedText);
                 
                 // Process QR code with backend
                 try {
                   const res = await apiFetch("/api/volunteer/checkin", {
                         method: "POST",
                         headers: { "Content-Type": "application/json" },
                         body: JSON.stringify({ qrData: decodedText })
                     });
                     
                     const data = await res.json();
                     
                     if (res.ok) {
                         setSuccessStatus('success');
                         setAttendeeInfo(data.registration);
                         toast.success("Check-in verified!");
                         // Refresh attendee list without full reload
                         if (account && account.eventId) {
                             apiFetch(`/api/organizer/registrations/${account.eventId}`)
                               .then(r => r.json())
                               .then(d => { if (Array.isArray(d)) setRegistrations(d); });
                         }
                     } else {
                         setSuccessStatus('error');
                         setErrorMessage(data.error);
                         if (data.registration) {
                             setAttendeeInfo(data.registration);
                         }
                         toast.error(data.error);
                     }
                 } catch (err) {
                    setSuccessStatus('error');
                    setErrorMessage("Network error during verification");
                 }
                 
                 // Auto reset after 3 seconds
                 setTimeout(() => {
                     setSuccessStatus('idle');
                     setScanResult(null);
                     setAttendeeInfo(null);
                 }, 3500);
            },
            (error) => {
                // Ignore standard scanning errors
            }
        );
    }
    
    return () => {
        if (scannerRef.current) {
            scannerRef.current.clear().catch(e => console.error("Failed to clear scanner", e));
            scannerRef.current = null;
        }
    };
  }, [successStatus, account]);

  return (
    <div className="max-w-7xl mx-auto p-8 md:p-16 flex flex-col items-center w-full">
      <div className="text-center mb-12">
        <div className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-50 mb-4 text-orange-600">Verification</div>
        <h1 className="text-4xl font-light font-serif italic mb-2 tracking-tight">Gate Scanner</h1>
        <p className="text-xs opacity-60 uppercase tracking-widest mt-4">Point camera at QR Code</p>
      </div>

      <div className="relative w-full max-w-sm bg-black border border-black/10 shadow-xl overflow-hidden p-2 mb-16">
        <div id="reader" className="w-full bg-black"></div>
        
        {/* Overlay statuses */}
        {successStatus === 'success' && (
          <div className="absolute inset-0 bg-[#F9F9F7] flex flex-col items-center justify-center text-black p-8 z-10 animate-in fade-in zoom-in duration-200 border border-black/10">
             <div className="w-16 h-16 rounded-full border border-black/20 flex items-center justify-center mb-6">
               <CheckCircle className="w-8 h-8 opacity-80" />
             </div>
             <h2 className="text-3xl font-light font-serif italic mb-2">Verified</h2>
             {attendeeInfo && (
                <div className="text-center mt-4">
                    <p className="font-medium text-lg tracking-tight">{attendeeInfo.name}</p>
                    <p className="font-mono text-[9px] uppercase tracking-widest opacity-40 mt-4">{attendeeInfo.id}</p>
                </div>
             )}
          </div>
        )}

        {successStatus === 'error' && (
          <div className="absolute inset-0 bg-red-600 flex flex-col items-center justify-center text-white p-8 z-10 animate-in fade-in zoom-in duration-200">
             <div className="w-16 h-16 rounded-full border border-white/40 flex items-center justify-center mb-6">
               <XCircle className="w-8 h-8 opacity-90" />
             </div>
             <h2 className="text-3xl font-light font-serif italic mb-2">Invalid</h2>
             <p className="text-white/80 font-medium text-center text-sm">{errorMessage}</p>
             {attendeeInfo && (
                <div className="text-center mt-8 border-t border-white/20 pt-6 w-full">
                    <p className="text-[9px] uppercase tracking-[0.2em] opacity-60 mb-2">Registered To</p>
                    <p className="font-medium tracking-tight text-lg">{attendeeInfo.name}</p>
                </div>
             )}
          </div>
        )}
      </div>

      {account && account.eventId && registrations.length > 0 && (
         <div className="w-full border border-black/10 bg-white">
          <div className="flex flex-col md:flex-row items-center justify-between p-6 border-b border-black/10">
            <h2 className="text-lg font-light font-serif italic">Attendee Manifest</h2>
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
      )}
      
      {/* Fallback instruction styling target */}
      <style>{`
        #reader__dashboard_section_csr span { color: white !important; font-family: ui-sans-serif, system-ui, sans-serif !important; opacity: 0.6; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;}
        #reader button { background-color: white !important; color: black !important; border-radius: 0 !important; padding: 12px 24px !important; border: none !important; margin: 16px 0 !important; cursor: pointer; font-weight: bold; font-size: 10px; text-transform: uppercase; letter-spacing: 2px;}
        #reader__dashboard_section_swaplink { color: white !important; opacity: 0.4; font-size: 10px; text-decoration: underline;}
      `}</style>
    </div>
  );
}
