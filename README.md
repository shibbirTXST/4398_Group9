# Habit Tracker App

A mobile app for habit tracking and development.

## Tech Stack
- **Frontend**: React Native (Expo)
- **Backend**: ExpressJS
- **Auth**: Firebase
- **DB**: PostgreSQL (via Docker)

## Getting Started

### 1. Database
Start the PostgreSQL database using Docker:
```bash
docker-compose up -d
```

### 2. Backend (Server)
Navigate to the `server` directory and install dependencies:
```bash
cd server
npm install
```
Create a `.env` file and fill in your Firebase and DB credentials (see `.env.example`).

Load database schema using:
```bash
npx prisma db push
```

Start the server:
```bash
npm run dev
```
### 3. Frontend (Client)
Navigate to the `client` directory and install dependencies:
```bash
cd client
npm install
```
Start the Expo development server:
```bash
npx expo start
```
You can use the Expo Go app on your phone or an emulator to view the app.

If issues are encountered when bundling application, try the follow commands (in the `client` directory) in this order:
```bash
npm install expo@55 @expo/cli@latest
npx expo install --fix
npx expo start -c
```

## Running Tests
You can invoke the test script from inside `server`:
```bash
#Server-side
cd server
npm test
```

## Project Structure
- `server/`: ExpressJS backend.
- `client/`: React Native (Expo) frontend.
- `docker-compose.yml`: PostgreSQL configuration.
- `SPEC.md`: Original project specification.
