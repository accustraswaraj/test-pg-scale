import { sql } from "./db.js";

export const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class InsufficientCreditsError extends Error {
    constructor() {
        super("Insufficient credits");
        this.name = "InsufficientCreditsError";
    }
}

// Atomically consumes credits from credit_balance.
// Throws InsufficientCreditsError if 0 rows were updated.
export async function consumeCredit(userId, amount = 1) {
    if (!Number.isInteger(amount) || amount <= 0) {
        throw new Error("amount must be a positive integer");
    }

    const result = await sql`
    UPDATE subscription
    SET credit_balance = credit_balance - ${amount}
    WHERE user_id = ${userId}
      AND credit_balance >= ${amount}
    RETURNING credit_balance
  `;

    if (result.count === 0) {
        throw new InsufficientCreditsError();
    }

    return result[0].credit_balance;
}

// Hono handler: POST /subscriptions/:userId/consume
export async function consumeCreditHandler(c) {
    const userId = c.req.param("userId");

    if (!UUID_RE.test(userId)) {
        return c.json({ error: "Invalid user id" }, 400);
    }

    const creditBalance = await consumeCredit(userId, 1);

    return c.json({ success: true, credit_balance: creditBalance });
}

// Middleware: consumes 1 credit before the route runs.
// Usage: app.post("/api/generate", requireCredit, handler)
export const requireCredit = async (c, next) => {
    const userId = c.get("userId"); // set by your auth middleware
    const creditBalance = await consumeCredit(userId, 1);

    c.header("X-Credit-Balance", String(creditBalance));
    await next();
};