# DriveRent — Car Rental Booking App

A full-stack car rental web app where users can browse available cars, search by dates or keyword, and book instantly. Includes authentication, real-time availability updates, and an admin panel for managing the car fleet.

**Live demo:** https://car-rental-app-blush-nine.vercel.app/

## Features

- **Authentication** — sign up / log in with Supabase Auth. Browsing and booking are gated behind login.
- **Car listings** — responsive grid of available cars with images, ratings, seats, transmission, and daily price.
- **Search** — filter cars by pick-up/return date (checks against existing bookings) or by name/brand keyword.
- **Booking flow** — logged-in users can book a car; availability updates instantly (optimistic UI + database write).
- **Admin panel** — password-protected panel to add new cars and manually toggle availability.
- **Responsive design** — grid adapts from 3 columns on desktop down to 1 column on mobile.

## Tech Stack

- **Frontend:** React (Vite)
- **Backend / Database:** Supabase (PostgreSQL, Auth, Row Level Security)
- **Styling:** Plain CSS
- **Deployment:** Vercel (auto-deploys from `main`)

## Running Locally

```bash
git clone https://github.com/rizwan1915/car-rental-app.git
cd car-rental-app
npm install
npm run dev
```

The app expects a Supabase project with `cars` and `bookings` tables. Update `src/supabaseClient.js` with your own Supabase URL and anon key if you're running your own instance.

## Notes

This is a demo/portfolio project — the admin password is intentionally simple and not meant to represent production-grade security practices.
