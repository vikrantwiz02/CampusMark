# CampusMark - Smart Attendance Tracker

A modern attendance tracking application with Google Authentication and MongoDB cloud sync.

## Features

- **Google Authentication** - Secure sign-in with your Google account
- **Cloud Sync** - MongoDB Atlas integration for cross-device data sync
- **Smart Calendar** - Monthly and yearly attendance views
- **Statistics** - Real-time attendance analytics
- **Dark Mode** - Beautiful UI with dark/light theme support
- **Mobile-First** - Responsive design for all devices
- **Offline-First** - Works offline, syncs when online

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Environment variables:**
   
   Create `.env.local`:
   ```env
   VITE_GOOGLE_CLIENT_ID=your-google-client-id
   VITE_API_URL=http://localhost:3000/api
   MONGODB_URI=your-mongodb-uri
   MONGODB_DB_NAME=CampusMark
   CORS_ORIGIN=*
   ```

3. **Run the application:**
   ```bash
   npm run dev
   ```

4. **Access the app:**
   - Application: `http://localhost:3000`

## Deployment on Vercel

1. **Push to GitHub and import to Vercel**
2. **Set Environment Variables in Vercel:**
   - `VITE_GOOGLE_CLIENT_ID`
   - `VITE_API_URL=https://your-app.vercel.app/api`
   - `MONGODB_URI`
   - `MONGODB_DB_NAME=CampusMark`
   - `CORS_ORIGIN=https://your-app.vercel.app`
3. **Update Google OAuth** with your Vercel URL
4. **Deploy** - Vercel auto-deploys from `vercel.json` config

## Documentation

- **[CONFIGURATION.md](CONFIGURATION.md)** - Configuration guide

## Architecture

```
Frontend (React) → Vercel Serverless Functions → MongoDB Atlas
   Vite Build         /api/* endpoints           Cloud
```

### API Endpoints (Serverless)

- `GET /api/health` - Health check
- `POST /api/sync/records` - Sync records
- `POST /api/sync/courses` - Sync courses
- `POST /api/sync/semesters` - Sync semesters
- `GET /api/data?userId=xxx` - Fetch user data
- `DELETE /api/data?userId=xxx` - Delete user data

## Usage

1. Sign in with your Google account
2. Create a semester
3. Add courses
4. Mark attendance daily using the calendar
5. View stats and track your progress
6. Data automatically syncs to MongoDB when online

## Project Structure

```
CampusMark/
├── .env.local              # Environment variables
├── vercel.json             # Vercel deployment config
├── api/                    # Serverless functions
│   ├── health.js
│   ├── sync-records.js
│   ├── sync-courses.js
│   ├── sync-semesters.js
│   └── data.js
├── App.tsx                # Main React application
├── config.ts              # Configuration
├── services/
│   ├── syncService.ts    # Sync logic
│   └── mongoService.ts   # API client
└── components/           # React components
```

## Security Notes

- Never commit `.env.local` to version control
- MongoDB credentials are used server-side only
- Enable MongoDB IP whitelist in production
- Use HTTPS in production
- Implement rate limiting for production API

## Technologies

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Backend**: Vercel Serverless Functions
- **Build Tool**: Vite
- **Authentication**: Google OAuth 2.0
- **Database**: MongoDB Atlas
- **Charts**: Recharts
- **Deployment**: Vercel

## Troubleshooting

**MongoDB connection errors?**
- Verify `MONGODB_URI` in environment variables
- Check MongoDB Atlas IP whitelist (allow all: 0.0.0.0/0)
- Ensure database user has read/write permissions

**Can't sync data?**
- Check browser console for errors
- Verify you're signed in with Google
- Check network tab for API call failures

**Google Sign-In not working?**
- Add your domain to Google Cloud Console authorized origins
- Verify `VITE_GOOGLE_CLIENT_ID` is correct

## Build for Production

```bash
npm run build
```

Vercel handles deployment automatically.
