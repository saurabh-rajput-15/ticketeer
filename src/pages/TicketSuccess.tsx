import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { RegistrationType } from "@/types";
import { DownloadIcon, MapPin, Calendar } from "lucide-react";
import { toast } from "sonner";

export function TicketSuccess() {
  const { regId } = useParams();
  const [reg, setReg] = useState<RegistrationType | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/registrations/${regId}`)
      .then(res => res.json())
      .then(async (data: RegistrationType) => {
        setReg(data);
        if (data.qrData) {
          const qrUrl = await QRCode.toDataURL(data.qrData, { 
            width: 300, 
            margin: 2,
            color: { dark: '#0F172A', light: '#FFFFFF' }
          });
          setQrCodeUrl(qrUrl);
        }
      });
  }, [regId]);

  if (!reg) return <div className="p-12 text-center text-slate-500">Retrieving ticket details...</div>;

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(24);
    doc.text(reg.eventName || "Event Ticket", 20, 30);
    
    doc.setFontSize(14);
    doc.text(`Ticket Type: ${reg.ticketName}`, 20, 50);
    doc.text(`Attendee: ${reg.name}`, 20, 60);
    doc.text(`Email: ${reg.email}`, 20, 70);
    
    if (reg.date) {
      doc.text(`Date: ${new Date(reg.date).toLocaleString()}`, 20, 85);
    }
    if (reg.location) {
      doc.text(`Location: ${reg.location}`, 20, 95);
    }

    if (qrCodeUrl) {
      doc.addImage(qrCodeUrl, 'PNG', 20, 110, 80, 80);
    }

    doc.text(`Ticket ID: ${reg.id}`, 20, 200);

    doc.save(`${reg.eventName?.replace(/\s+/g, '_')}_Ticket.pdf`);
    toast.success("Ticket downloaded!");
  };

  return (
    <div className="max-w-3xl mx-auto p-4 py-12 md:py-24 flex flex-col items-center">
      
      <div className="flex flex-col items-center mb-12 text-center space-y-4">
        <h1 className="text-5xl font-light tracking-tight leading-[0.9] font-serif italic mb-2">You're going!</h1>
        <p className="text-sm opacity-60 max-w-sm">We've emailed this ticket to <span className="font-bold underline decoration-black/20">{reg.email}</span>. You can also download it right now.</p>
      </div>

      <div ref={ticketRef} className="w-full relative shadow-md bg-white border border-black/5 flex flex-col md:flex-row">
        
        {/* Ticket Left Section */}
        <div className="bg-black text-white p-8 md:p-12 md:w-1/3 flex flex-col justify-between items-center text-center">
           <div>
             <div className="text-[10px] uppercase tracking-[0.3em] opacity-50 mb-4 text-orange-400">Scan at Gate</div>
             {qrCodeUrl && (
                <div className="bg-white p-2 rounded-sm mx-auto mb-6 w-fit">
                  <img src={qrCodeUrl} alt="Ticket QR Code" className="w-32 h-32 block mix-blend-multiply" />
                </div>
             )}
             <div className="font-mono text-[9px] uppercase tracking-widest opacity-40">
                {reg.id}
             </div>
           </div>
        </div>

        {/* Ticket Right Section */}
        <div className="p-8 md:p-12 md:w-2/3 flex flex-col">
          <div className="flex-1">
            <h2 className="text-3xl font-light font-serif italic mb-2">{reg.eventName}</h2>
            <div className="text-[11px] uppercase tracking-widest font-bold mb-8 opacity-40">{reg.ticketName}</div>
            
            <div className="grid grid-cols-2 gap-8 mb-8">
               <div>
                  <div className="text-[9px] uppercase font-bold opacity-40 tracking-widest mb-1">Attendee</div>
                  <div className="font-medium text-sm">{reg.name}</div>
               </div>
               <div>
                  <div className="text-[9px] uppercase font-bold opacity-40 tracking-widest mb-1">Email</div>
                  <div className="font-medium text-sm">{reg.email}</div>
               </div>
            </div>

            <div className="border-t border-black/10 pt-6 space-y-4">
              {reg.date && (
                <div className="flex items-center gap-3 text-sm opacity-80">
                  <Calendar className="w-4 h-4 opacity-50" />
                  <span>{new Date(reg.date).toLocaleString(undefined, {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}</span>
                </div>
              )}
              {reg.location && (
                <div className="flex items-center gap-3 text-sm opacity-80">
                  <MapPin className="w-4 h-4 opacity-50" />
                  <span>{reg.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cutout details pattern - visual only  */}
        <div className="absolute top-1/2 -left-2 w-4 h-4 rounded-full bg-[#F9F9F7] md:hidden"></div>
        <div className="absolute top-1/2 -right-2 w-4 h-4 rounded-full bg-[#F9F9F7] md:hidden"></div>
      </div>

      <div className="w-full mt-12 flex flex-col md:flex-row gap-4 max-w-sm mx-auto">
        <button onClick={downloadPDF} className="flex-1 px-4 py-3 bg-black text-white text-[11px] font-bold uppercase tracking-[0.2em] rounded flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors">
          <DownloadIcon className="w-4 h-4" />
          Download PDF
        </button>
        <Link to="/" className="flex-1 px-4 py-3 bg-transparent border border-black/20 text-[11px] font-bold uppercase tracking-[0.2em] rounded hover:border-black transition-colors text-center text-black flex items-center justify-center">
          Explore
        </Link>
      </div>
    </div>
  );
}
