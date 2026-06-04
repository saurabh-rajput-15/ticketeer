import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { EventType, TicketType } from "@/types";

const checkoutSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional()
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export function AttendeeCheckout() {
  const { eventId, ticketId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventType | null>(null);
  const [ticket, setTicket] = useState<TicketType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema)
  });

  useEffect(() => {
      apiFetch(`/api/events/${eventId}`)
      .then(res => res.json())
      .then(data => {
        setEvent(data);
        const tt = data.ticketTypes?.find((t: any) => t.id === ticketId);
        if (tt) setTicket(tt);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load event details");
        setLoading(false);
      });
  }, [eventId, ticketId]);

  if (loading) return <div className="p-12 text-center text-slate-500">Securely loading checkout...</div>;
  if (!event || !ticket) return <div className="p-12 text-center text-red-500">Event or ticket type not found.</div>;

  const isFree = ticket.price === 0;
  const platformFee = isFree ? 0 : ticket.price * 0.05; // 5% platform fee
  const gatewayFee = isFree ? 0 : (ticket.price + platformFee) * 0.02; // 2% gateway fee
  const orderTotal = ticket.price + platformFee + gatewayFee;

  const onSubmit = async (data: CheckoutForm) => {
    setIsSubmitting(true);
    
    try {
      // 1. Create order
      const orderRes = await fetch("/api/cashfree/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
           ticketTypeId: ticketId,
           customerName: data.name,
           customerEmail: data.email,
           customerPhone: data.phone || "9999999999"
        })
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok) throw new Error(orderData.error || "Failed to initiate payment");

      if (orderData.free) {
        // Handle free ticket flow
        const checkoutRes = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId, ticketTypeId: ticketId, ...data })
        });
        const checkoutData = await checkoutRes.json();
        if (checkoutRes.ok) {
          toast.success("Registration successful!");
          navigate(`/ticket/${checkoutData.registrationId}`);
        } else {
          throw new Error(checkoutData.error);
        }
        return;
      }

      // Handle paid ticket flow
      const scriptURL = "https://sdk.cashfree.com/js/v3/cashfree.js";
      await new Promise<void>((resolve, reject) => {
        if ((window as any).Cashfree) return resolve();
        const script = document.createElement("script");
        script.src = scriptURL;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Cashfree SDK"));
        document.body.appendChild(script);
      });

      const cashfree = await (window as any).Cashfree({ mode: orderData.env || "sandbox" });

      cashfree.checkout({
        paymentSessionId: orderData.sessionId,
        redirectTarget: "_modal",
      }).then(async (result: any) => {
        if (result.error) {
          toast.error(result.error.message || "Payment failed or cancelled");
          setIsSubmitting(false);
        } else if (result.paymentDetails || result.redirect) {
          try {
            const checkoutRes = await fetch("/api/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                eventId,
                ticketTypeId: ticketId,
                ...data,
                cfOrderId: orderData.orderId,
              })
            });
            const checkoutData = await checkoutRes.json();
            if (checkoutRes.ok) {
              toast.success("Payment successful!");
              navigate(`/ticket/${checkoutData.registrationId}`);
            } else {
              toast.error(checkoutData.error || "Payment verification failed");
              setIsSubmitting(false);
            }
          } catch (err: any) {
            toast.error(err.message || "Error verifying payment");
            setIsSubmitting(false);
          }
        }
      });

    } catch (err: any) {
      toast.error(err.message || "Network error during checkout.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-[calc(100vh-4rem)]">
      {/* Checkout Form */}
      <section className="col-span-1 md:col-span-7 p-8 md:p-12 border-r border-black/5 flex flex-col order-2 md:order-1 bg-[#F9F9F7]">
        <div className="mb-8">
          <div className="text-[11px] uppercase tracking-[0.2em] font-bold text-orange-600 mb-3">Live Registration</div>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight leading-[1] font-serif italic mb-2">
            Attendee Details
          </h1>
          <p className="text-sm opacity-60">Please provide your details below.</p>
        </div>

        <div className="flex-1 max-w-xl">
          <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-2">
              <label htmlFor="name" className="text-[10px] uppercase font-bold opacity-50 tracking-wider">Full Name</label>
              <input id="name" placeholder="Arjun Sharma" className="w-full bg-transparent border-b border-black/20 pb-2 text-lg focus:outline-none focus:border-black placeholder:opacity-20 transition-colors rounded-none" {...register("name")} />
              {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-[10px] uppercase font-bold opacity-50 tracking-wider">Email Address</label>
              <input id="email" type="email" placeholder="arjun@dev.io" className="w-full bg-transparent border-b border-black/20 pb-2 text-lg focus:outline-none focus:border-black placeholder:opacity-20 transition-colors rounded-none" {...register("email")} />
              {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-[10px] uppercase font-bold opacity-50 tracking-wider">Phone Number (Optional)</label>
              <input id="phone" type="tel" placeholder="+91 99999 99999" className="w-full bg-transparent border-b border-black/20 pb-2 text-lg focus:outline-none focus:border-black placeholder:opacity-20 transition-colors rounded-none" {...register("phone")} />
            </div>
          </form>

          <div className="mt-10 flex items-start gap-4 p-4 bg-white border border-black/5 rounded-lg max-w-xl">
            <div className="w-5 h-5 shrink-0 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-[10px]">i</div>
            <p className="text-xs opacity-60 leading-relaxed italic">
              No account needed. Your ticket will be generated instantly and sent to your email after verification.
            </p>
          </div>
        </div>
      </section>

      {/* Order Summary */}
      <section className="col-span-1 md:col-span-5 bg-white p-8 md:p-12 flex flex-col order-1 md:order-2">
        <div className="flex-1">
          <h3 className="text-xs font-bold uppercase tracking-widest mb-8 pb-2 border-b border-black/10">Order Summary</h3>
          
          <div className="space-y-4 mb-10">
            <div className="flex justify-between items-end">
              <div>
                <div className="text-lg font-medium">{ticket.name}</div>
                <div className="text-[11px] opacity-40 uppercase tracking-widest">{event.name}</div>
              </div>
              <div className="text-lg">₹{(ticket.price).toFixed(2)}</div>
            </div>
            
            {!isFree && (
              <>
                <div className="h-px bg-black/5 w-full my-4"></div>
                <div className="space-y-2 text-sm opacity-60">
                  <div className="flex justify-between italic">
                    <span>Platform Service Fee</span>
                    <span>₹{(platformFee).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between italic">
                    <span>Processing Fee</span>
                    <span>₹{(gatewayFee).toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-between items-baseline mb-12">
            <span className="text-[11px] uppercase tracking-widest font-bold">{isFree ? 'Amount' : 'Final Amount'}</span>
            <span className="text-4xl font-light font-serif italic tracking-tighter">₹{(orderTotal).toFixed(2)}</span>
          </div>

          <button 
            form="checkout-form"
            disabled={isSubmitting}
            className="w-full py-5 bg-black text-white font-bold uppercase tracking-[0.2em] text-xs rounded hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Processing..." : (isFree ? "Complete Registration" : "Confirm Booking")}
          </button>
        </div>

        <div className="mt-8 text-[10px] opacity-40 text-right uppercase tracking-widest">
          Secure • Encrypted • Transparent
        </div>
      </section>
      
    </div>
  );
}
