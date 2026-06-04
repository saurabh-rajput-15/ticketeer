# Product Requirements Document (PRD)

## Product Overview
Ticketeer is a modern, end-to-end event management and ticketing platform. It provides a seamless experience for event organizers to create, manage, and track events, and for attendees to discover events, purchase tickets, and check in securely.

## Target Audience
1. **Event Organizers:** Individuals or organizations hosting events who need a robust platform for ticketing, attendee management, and revenue tracking.
2. **Attendees:** People looking for events, purchasing tickets securely, and expecting a smooth check-in process.
3. **Volunteers/Gate Staff:** Personnel responsible for scanning tickets and managing entry at the venue.

## Core Features

### 1. User Access & Roles
*   **Public (Attendees):** Can view public events, select ticket types, and register/purchase tickets.
*   **Admin/Organizer:** Secured via authentication. Can create events, manage ticket inventory, view the organizer dashboard for revenue/attendee metrics, and broadcast emails.
*   **Volunteer:** Secured access for scanning attendee QR codes on-site.

### 2. Event Discovery (Explore)
*   Public-facing landing page listing all available events.
*   Detailed event page showcasing event banner, description, date, time, location, and available ticket types.

### 3. Ticketing & Checkout
*   Support for multiple ticket types (e.g., Early Bird, Regular) per event.
*   Dynamic pricing with platform service fee (5%) and gateway fee (2%) calculations (waived for free tickets).
*   Seamless checkout flow with basic attendee information collection (Name, Email, Phone).
*   Payment status tracking and validation.

### 4. Attendee Experience
*   Successful registration generates a unique ticket with a verifiable QR Code.
*   "My Ticket" view accessible post-checkout for easy retrieval.

### 5. Organizer Dashboard
*   High-level metrics: Total yielded revenue, total attendees, and checked-in count.
*   Real-time attendee list with filtering by checked-in status.
*   Export attendees data to CSV.
*   Email broadcast capability ensuring no duplicate emails are sent to attendees who purchased multiple tickets.

### 6. Event Creation (Host)
*   Form-based event creation capturing name, description, date, location, and banner image.
*   Dynamic ticket tier creation (name, price, capacity).

### 7. Gate Scanner
*   Built-in QR code scanner utilizing device camera.
*   Instant verification of ticket validity against the database.
*   Updates attendee status to "Checked In" to prevent duplicate entries or ticket sharing.

## Technical Requirements
*   **Frontend:** React, React Router, Tailwind CSS, Lucide Icons.
*   **Backend:** Express (Node.js) server.
*   **Database:** Supabase (PostgreSQL) for events, ticket tiers, and registrations.
*   **Security:** Secure route wrappers. Route protection for non-public paths, hiding navigation elements when unauthenticated.
