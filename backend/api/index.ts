/**
 * Vercel serverless entry point.
 * Exports the Express app — Vercel handles the server/port itself.
 * The app.listen() in server.ts is only used for local dev.
 */
import path from 'path';
import dotenv from 'dotenv';

// Load .env for local dev (no-op on Vercel where env vars are injected)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import app from '../src/app';

export default app;
