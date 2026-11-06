import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { sql } from "./db.js";
import { consumeCreditHandler } from "./credits.js";

const app = new Hono();

// Root route
app.get("/", (c) => {
  return c.text("Hello Hono! Server is running.");
});

// Sample parameterized route
app.get("/subscriptions/:userId", async (c) => {
  const userId = c.req.param("userId");

  // Reject malformed UUIDs before hitting Postgres (otherwise it throws a 500)
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRe.test(userId)) {
    return c.json({ error: "Invalid user id" }, 400);
  }

  const [subscription] = await sql`
    SELECT
      id,
      user_id,
      subscription_id,
      product_id,
      product_name,
      price,
      recurring_interval,
      status,
      credits,
      credit_balance,
      current_period_start,
      current_period_end,
      cancel_at_period_end,
      created_at
    FROM subscription
    WHERE user_id = ${userId}
  `;

  if (!subscription) return c.json({ error: "Not found" }, 404);
  return c.json(subscription);
});


app.post("/subscriptions/:userId/consume", consumeCreditHandler);

const port = Number(process.env.PORT) || 3000;
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

