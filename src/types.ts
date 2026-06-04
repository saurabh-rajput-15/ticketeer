// Types
export interface EventType {
  id: string;
  name: string;
  description: string;
  date: string;
  location: string;
  bannerUrl: string;
  organizerName: string;
  ticketTypes?: TicketType[];
}

export interface TicketType {
  id: string;
  eventId: string;
  name: string;
  price: number;
  quantity: number;
  availability: number;
}

export interface RegistrationType {
  id: string;
  eventId: string;
  ticketTypeId: string;
  name: string;
  email: string;
  phone: string;
  paymentStatus: string;
  isCheckedIn: number;
  qrData: string;
  createdAt: string;
  eventName?: string;
  location?: string;
  date?: string;
  ticketName?: string;
  price?: number;
}
