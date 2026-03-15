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

#### Running Tests
All tests are executed from the workspace root using Jest and Supertest. The necessary packages are installed at the root level.
```bash
# install on root if you haven't already
npm install

# run tests (Both Server and Client)
npm test
```
You can also invoke the test script from inside `server` or `client` to test only server-side/client-side components:
```bash
#Server-side
cd server
npm test

#Client-side
cd client
npm test
```

## Project Structure
- `server/`: ExpressJS backend.
- `client/`: React Native (Expo) frontend.
- `docker-compose.yml`: PostgreSQL configuration.
- `SPEC.md`: Original project specification.
