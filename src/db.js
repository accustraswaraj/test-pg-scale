// src/db.js
import postgres from "postgres";
import "dotenv/config";

export const sql = postgres(process.env.DATABASE_URL, {
    max: 20,          // connection pool
    idle_timeout: 20,
    prepare: false,   // keep this if you're behind PgBouncer / Supabase pooler / Cloudflare Hyperdrive
});