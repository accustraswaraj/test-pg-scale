import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const PLANS = [
  {
    productId: "prod_business_monthly",
    productName: "Business Team Tier",
    price: 19900,
    interval: "month",
    credits: 1500000,
    weight: 10,
  },
  {
    productId: "prod_enterprise_monthly",
    productName: "Enterprise Tier",
    price: 49900,
    interval: "month",
    credits: 5000000,
    weight: 4,
  },
  {
    productId: "prod_pro_annual",
    productName: "Pro Tier (Annual)",
    price: 47000,
    interval: "year",
    credits: 2500000,
    weight: 6,
  },
];

const STATUSES = [
  { status: "active", weight: 80 },
  { status: "trialing", weight: 10 },
  { status: "canceled", weight: 7 },
  { status: "past_due", weight: 3 },
];

function pickWeighted(items) {
  const totalWeight = items.reduce((acc, item) => acc + item.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of items) {
    if (random < item.weight) return item;
    random -= item.weight;
  }
  return items[0];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomAlphanumeric(length = 24) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function formatDate(date) {
  return date.toISOString().replace("T", " ").replace("Z", "");
}

function generateUsers(count = 1000) {
  const now = new Date();
  const rows = [];

  for (let i = 0; i < count; i++) {
    const id = `sub_${randomAlphanumeric(20)}`;
    const userId = randomUUID(); // UUIDv4
    const subscriptionId = `sub_ext_${randomAlphanumeric(24)}`;
    const plan = pickWeighted(PLANS);
    const statusObj = pickWeighted(STATUSES);
    const status = statusObj.status;

    // Creation date between 1 and 180 days ago
    const daysAgo = randomInt(1, 180);
    const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    // Current period start / end
    let periodStartDaysAgo = plan.interval === "month" ? (daysAgo % 30) : (daysAgo % 365);
    const currentPeriodStart = new Date(now.getTime() - periodStartDaysAgo * 24 * 60 * 60 * 1000);

    const currentPeriodEnd = new Date(currentPeriodStart.getTime());
    if (plan.interval === "month") {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    } else {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
    }

    const cancelAtPeriodEnd = status === "canceled" ? true : Math.random() < 0.05;

    // Credits & Credit Balance
    const credits = plan.credits;
    const creditBalance = plan.credits;
    // let creditBalance = 0;
    // if (status === "active") {
    //   // Typically used 10% - 90% of credits
    //   creditBalance = Math.round(credits * (0.1 + Math.random() * 0.9));
    // } else if (status === "trialing") {
    //   creditBalance = Math.round(credits * (0.7 + Math.random() * 0.3));
    // } else if (status === "past_due") {
    //   creditBalance = randomInt(0, Math.floor(credits * 0.05));
    // } else {
    //   // canceled
    //   creditBalance = Math.random() < 0.2 ? randomInt(0, 50) : 0;
    // }

    rows.push({
      id,
      userId,
      subscriptionId,
      productId: plan.productId,
      productName: plan.productName,
      price: plan.price,
      recurringInterval: plan.interval,
      status,
      credits,
      creditBalance,
      currentPeriodStart: formatDate(currentPeriodStart),
      currentPeriodEnd: formatDate(currentPeriodEnd),
      cancelAtPeriodEnd,
      createdAt: formatDate(createdAt),
    });
  }

  return rows;
}

function generateSql(count = 1000) {
  const users = generateUsers(count);
  const statements = [];

  statements.push("-- Seed data: realistic subscriptions with UUIDv4 user_id and credits");
  statements.push("BEGIN;");
  statements.push("");

  const batchSize = 100;
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    const values = batch
      .map((u) => {
        const cleanName = u.productName.replace(/'/g, "''");
        return `  ('${u.id}', '${u.userId}', '${u.subscriptionId}', '${u.productId}', '${cleanName}', ${u.price}, '${u.recurringInterval}', '${u.status}', ${u.credits}, ${u.creditBalance}, '${u.currentPeriodStart}', '${u.currentPeriodEnd}', ${u.cancelAtPeriodEnd}, '${u.createdAt}')`;
      })
      .join(",\n");

    statements.push(
      `INSERT INTO "subscription" (
  "id", "user_id", "subscription_id", "product_id", "product_name",
  "price", "recurring_interval", "status", "credits", "credit_balance",
  "current_period_start", "current_period_end", "cancel_at_period_end",
  "created_at"
) VALUES\n${values}\nON CONFLICT ("id") DO NOTHING;`
    );
    statements.push("");
  }

  statements.push("COMMIT;");
  return statements.join("\n");
}

const count = 1000000;
const sql = generateSql(count);
const outputPath = resolve("seed.sql");
writeFileSync(outputPath, sql, "utf-8");
console.log(`Successfully generated ${count} seed records in ${outputPath}`);

