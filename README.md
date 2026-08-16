# COCOBOD Training School Meeting Registration App

A complete web application for managing participant registration and check-in for COCOBOD Training School meetings.

## Features

- **Participant Registration**: Simple 3-field registration form (name, organisation, position)
- **Unique Registration Codes**: Auto-generated codes with collision handling
- **HR Admin Dashboard**: Real-time statistics and attendance tracking
- **Check-in System**: Search by code/name/organisation with transactional safety
- **Walk-in Registration**: Register and check-in walk-in participants
- **Attendance Management**: View, filter, and export attendance data
- **CSV Export**: Export registrations and attendance data
- **Event Settings**: Configure event details and registration status

## Tech Stack

- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, server-side functionality
- **Database**: Neon PostgreSQL with pg driver
- **Authentication**: NextAuth.js for HR admin authentication
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Neon PostgreSQL database
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cocobod-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
```
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
AUTH_SECRET=generate-with-openssl-rand-base64-32
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Generate AUTH_SECRET:
```bash
openssl rand -base64 32
```

4. Set up the database:
```bash
npx ts-node scripts/setup-db.ts
```

5. Seed admin user:
```bash
npx ts-node scripts/seed-admin.ts
```

Default admin credentials:
- Email: admin@cocobod.gov.gh
- Password: admin123 (change after first login)

6. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
cocobod-app/
├── src/
│   ├── app/
│   │   ├── admin/          # Admin pages (dashboard, check-in, etc.)
│   │   ├── api/            # API routes
│   │   ├── register/       # Registration pages
│   │   └── page.tsx        # Landing page
│   ├── lib/
│   │   ├── auth.ts         # NextAuth configuration
│   │   └── db.ts           # Database connection
│   └── middleware.ts       # Auth middleware
├── scripts/
│   ├── setup-db.ts         # Database schema setup
│   └── seed-admin.ts       # Admin user seeding
└── public/                 # Static assets
```

## Usage

### Participant Flow

1. Participants visit the landing page
2. Click "Register Now" to access registration form
3. Fill in name, organisation, and position
4. Receive unique registration code (e.g., CTS-4827)
5. Present code at registration desk for check-in

### HR Admin Flow

1. Log in at `/admin/login`
2. View dashboard with real-time statistics
3. Use check-in page to search and verify participants
4. Manage registrations and view attendance
5. Export data as CSV
6. Configure event settings

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

```
DATABASE_URL=your-neon-database-url
AUTH_SECRET=your-generated-secret
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Database Schema

The application uses the following tables:
- `events` - Event configuration
- `users` - HR admin accounts
- `participants` - Participant registrations
- `check_ins` - Check-in records with unique constraint

## Security Features

- Server-side authentication checks on all admin routes
- Password hashing with bcrypt
- SQL injection protection via parameterized queries
- Transactional check-in to prevent race conditions
- Unique constraints on registration codes and check-ins

## License

Proprietary - COCOBOD
