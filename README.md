# DomTicket — Ticket Management with Twig and localStorage

This is a small demo ticket management web app that uses Twig for templates and client-side JavaScript for authentication and ticket CRUD stored in localStorage.

Features
- Landing page with a wavy hero and decorative circles.
- Login and Signup with inline validation and toast notifications.
- Protected Dashboard and Ticket Management pages (client-side enforced via localStorage session key).
- Full ticket CRUD (Create, Read, Update, Delete) with validation and confirmation on delete.
- Responsive layout, accessible markup, and visible focus states.

Tech & Libraries
- PHP 7.4+ (for serving Twig templates)
- Twig (twig/twig) — template engine
- Browser localStorage for session and ticket storage

Keys and storage
- Session token key: `ticketapp_session` (stores {token,user})
- Tickets storage key: `ticketapp_tickets` (array of ticket objects)
- Users storage key: `ticketapp_users` (array of mock users)

Sample test user (after creating in signup):
- Use the signup form to create an account. There is no seeded account by default.

Setup
1. Install dependencies using Composer (Twig):

```powershell
cd "c:\Users\user\Desktop\Twigphp"
composer install
```

2. Run the PHP built-in server from the project root:

```powershell
php -S localhost:8000 -t public
```

3. Open http://localhost:8000 in your browser.

How it works
- Server: `public/index.php` is a tiny router that renders Twig templates from `templates/`.
- Templates: `templates/layout.twig` is the base layout used by all pages.
- Client: `public/assets/js/app.js` handles auth, session management (localStorage), and ticket CRUD. The UI updates are performed client-side.

UI & state structure
- Session: stored in localStorage under `ticketapp_session` and checked by `App.ensureAuthenticatedRedirect()` on protected pages.
- Tickets: stored as an array of objects: {id, title, description, status, priority, createdAt, updatedAt}
- Valid statuses: `open`, `in_progress`, `closed`.

Accessibility notes
- Semantic HTML (header/main/footer, labels attached to inputs).
- Visible focus states for keyboard users.
- Color contrast: status colors use distinct tones and background shades; more tweaks may be needed for full WCAG levels.

Known limitations
- Authentication and authorization are client-side simulations only. Do not use this for production or sensitive data.
- No server-side persistence; clearing browser storage removes all data.
- The demo expects Composer to install Twig. If you prefer not to use Composer, you could render static HTML or include Twig manually.

Next steps (optional improvements)
- Add server-side API and persistent storage (SQLite/MySQL).
- Add filtering and search for tickets.
- Add file attachments and comments per ticket.

If you want, I can: wire a small PHP API to persist data, add tests, or seed a demo user. What would you like next?
