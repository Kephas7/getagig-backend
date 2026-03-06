# GetaGig Backend

TypeScript + Express backend API for the GetaGig platform. It powers authentication, user profiles, gigs, applications, dashboards, messaging, notifications, and media access control.

## What This Service Handles

- User authentication and account lifecycle
- Musician and organizer profile workflows
- Gig creation, discovery, and applications
- Organizer and musician dashboard data
- Real-time messaging and notifications (Socket.IO)
- Secure media serving with role-based protection for sensitive uploads

## Tech Stack

- Node.js
- TypeScript
- Express
- MongoDB + Mongoose
- JWT authentication
- Socket.IO
- Zod validation
- Jest + Supertest for integration testing

## Prerequisites

- Node.js 18+
- npm
- Running MongoDB instance

## Environment Variables

Create a `.env` file in `getagig-backend/`.

```env
PORT=5050
MONGODB_URI=mongodb://localhost:27017/getagig
JWT_SECRET=replace-with-a-strong-secret
CLIENT_URL=http://localhost:3000
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-app-password
FIREBASE_SERVICE_ACCOUNT_PATH=FirebaseService/getagig-a6fb3-firebase-adminsdk-fbsvc-0384ec4cad.json
```

Notes:

- `JWT_SECRET` is required on startup.
- `PORT` defaults to `3000` if omitted.
- `MONGODB_URI` defaults to `mongodb://localhost:27017/default_db` if omitted.
- Firebase and email variables are only required for features that use push notifications or transactional email.

## Install And Run

```bash
npm install
npm run dev
```

The API starts on the configured port and initializes Socket.IO on the same HTTP server.

## Scripts

- `npm run dev`: Start the API in development mode with `nodemon` + `ts-node`
- `npm test`: Run Jest integration tests
- `npm run cleanup:conversations`: Dry-run cleanup for invalid conversations
- `npm run cleanup:conversations:apply`: Apply cleanup changes to the database

## API Prefixes

Main routes are mounted under:

- `/api/auth`
- `/api/musicians`
- `/api/organizers`
- `/api/admin/users`
- `/api/gigs`
- `/api/applications`
- `/api/dashboard`
- `/api/messages`
- `/api/notifications`
