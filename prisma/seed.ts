/**
 * Seeds demo data for all 18 entities so every dashboard widget and list
 * view is non-trivial on first run.
 *
 * Idempotent: every row uses a fixed, human-readable `id` and is written
 * with `upsert`, so re-running `pnpm prisma db seed` is safe and relations
 * below can just reference those ids directly instead of captured return
 * values.
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import {
  PrismaClient,
  type SystemRole,
  type EmployeeRole,
} from "@prisma/client";

const prisma = new PrismaClient();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const DEMO_PASSWORD = "password123";

type SeedUser = {
  id: string;
  email: string;
  name: string;
  role: SystemRole;
  employeeRole?: EmployeeRole;
};

const SEED_USERS: SeedUser[] = [
  { id: "profile-owner", email: "owner@leadyfy.test", name: "Priya Owner", role: "OWNER" },
  { id: "profile-admin", email: "admin@leadyfy.test", name: "Rahul Admin", role: "ADMIN" },
  { id: "profile-sales", email: "sales@leadyfy.test", name: "Sana Sales", role: "EMPLOYEE", employeeRole: "SALES" },
  { id: "profile-writer", email: "scriptwriter@leadyfy.test", name: "Wasim Writer", role: "EMPLOYEE", employeeRole: "SCRIPT_WRITER" },
  { id: "profile-shootmgr", email: "shootmanager@leadyfy.test", name: "Meera Shoots", role: "EMPLOYEE", employeeRole: "SHOOT_MANAGER" },
  { id: "profile-editor", email: "editor@leadyfy.test", name: "Ekta Editor", role: "EMPLOYEE", employeeRole: "EDITOR" },
  { id: "profile-client1", email: "client1@leadyfy.test", name: "Amit @ Acme Foods", role: "CLIENT" },
  { id: "profile-client2", email: "client2@leadyfy.test", name: "Nisha @ Nova Skincare", role: "CLIENT" },
];

async function ensureAuthUser(email: string, name: string): Promise<string> {
  const { data: existing } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const found = existing?.users.find((u) => u.email === email);
  if (found) return found.id;

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { name },
  });
  if (error || !data.user) {
    throw new Error(`Failed to create auth user ${email}: ${error?.message}`);
  }
  return data.user.id;
}

async function seedUsers() {
  for (const u of SEED_USERS) {
    const authUserId = await ensureAuthUser(u.email, u.name);

    const profile = await prisma.profile.upsert({
      where: { id: u.id },
      update: { authUserId, email: u.email, name: u.name, role: u.role },
      create: { id: u.id, authUserId, email: u.email, name: u.name, role: u.role },
    });

    if (u.employeeRole) {
      await prisma.employee.upsert({
        where: { profileId: profile.id },
        update: { employeeRole: u.employeeRole },
        create: { id: `employee-${u.id}`, profileId: profile.id, employeeRole: u.employeeRole },
      });
    }
  }
  console.log(`Seeded ${SEED_USERS.length} users (password for all: ${DEMO_PASSWORD})`);
}

async function seedClients() {
  const clients = [
    { id: "client-acme", profileId: "profile-client1", companyName: "Acme Foods", contactName: "Amit Shah", contactEmail: "amit@acmefoods.test", status: "ACTIVE" as const, industry: "Food & Beverage" },
    { id: "client-nova", profileId: "profile-client2", companyName: "Nova Skincare", contactName: "Nisha Rao", contactEmail: "nisha@novaskincare.test", status: "ONBOARDING" as const, industry: "Beauty" },
    { id: "client-bloom", profileId: null, companyName: "Bloom Bakery", contactName: "Kabir Mehta", contactEmail: "kabir@bloombakery.test", status: "LEAD" as const, industry: "Food & Beverage" },
    { id: "client-urbanfit", profileId: null, companyName: "Urban Fit", contactName: "Divya Nair", contactEmail: "divya@urbanfit.test", status: "NEW" as const, industry: "Fitness" },
    { id: "client-zenith", profileId: null, companyName: "Zenith Traders", contactName: "Farhan Ali", contactEmail: "farhan@zenithtraders.test", status: "ON_HOLD" as const, industry: "Retail" },
  ];

  for (const c of clients) {
    await prisma.client.upsert({
      where: { id: c.id },
      update: c,
      create: c,
    });
  }
  console.log(`Seeded ${clients.length} clients`);
}

async function seedOrders() {
  const orders = [
    { id: "order-acme-1", clientId: "client-acme", salesOwnerId: "employee-profile-sales", packageName: "Starter Pack (10 videos)", videoCount: 10, totalValue: 60000, status: "IN_PRODUCTION" as const },
    { id: "order-acme-2", clientId: "client-acme", salesOwnerId: "employee-profile-sales", packageName: "Growth Pack (20 videos)", videoCount: 20, totalValue: 110000, status: "PARTIALLY_DELIVERED" as const },
    { id: "order-nova-1", clientId: "client-nova", salesOwnerId: "employee-profile-sales", packageName: "Launch Pack (15 videos)", videoCount: 15, totalValue: 85000, status: "ONBOARDING" as const },
    { id: "order-bloom-1", clientId: "client-bloom", salesOwnerId: "employee-profile-sales", packageName: "Trial Pack (5 videos)", videoCount: 5, totalValue: 25000, status: "NEW" as const },
    { id: "order-urbanfit-1", clientId: "client-urbanfit", salesOwnerId: "employee-profile-sales", packageName: "Starter Pack (10 videos)", videoCount: 10, totalValue: 58000, status: "IN_PRODUCTION" as const },
    { id: "order-zenith-1", clientId: "client-zenith", salesOwnerId: "employee-profile-sales", packageName: "Growth Pack (20 videos)", videoCount: 20, totalValue: 105000, status: "COMPLETED" as const },
  ];

  for (const o of orders) {
    await prisma.order.upsert({ where: { id: o.id }, update: o, create: o });
  }
  console.log(`Seeded ${orders.length} orders`);
}

async function seedScripts() {
  const statuses = ["DRAFT", "ASSIGNED", "IN_REVIEW", "SENT_TO_CLIENT", "REVISION_REQUIRED", "APPROVED", "READY_FOR_SHOOT", "APPROVED"] as const;
  const orderIds = ["order-acme-1", "order-acme-1", "order-acme-2", "order-nova-1", "order-bloom-1", "order-urbanfit-1", "order-urbanfit-1", "order-zenith-1"];

  for (let i = 0; i < statuses.length; i++) {
    const id = `script-${i + 1}`;
    await prisma.script.upsert({
      where: { id },
      update: {},
      create: {
        id,
        orderId: orderIds[i],
        assignedToId: "employee-profile-writer",
        videoNumber: i + 1,
        title: `Product spotlight script #${i + 1}`,
        content: "Hook -> Problem -> Product demo -> CTA. (Seed placeholder script body.)",
        status: statuses[i],
      },
    });
  }
  console.log(`Seeded ${statuses.length} scripts`);
}

async function seedCreators() {
  const creators = [
    { id: "creator-1", name: "Riya Kapoor", email: "riya.creator@leadyfy.test", city: "Mumbai", languages: "Hindi, English", niches: "Food, Lifestyle", ratePerVideo: 3500 },
    { id: "creator-2", name: "Aarav Singh", email: "aarav.creator@leadyfy.test", city: "Delhi", languages: "Hindi, English", niches: "Fitness, Tech", ratePerVideo: 4200 },
    { id: "creator-3", name: "Simran Kaur", email: "simran.creator@leadyfy.test", city: "Bengaluru", languages: "English, Kannada", niches: "Beauty", ratePerVideo: 3800 },
    { id: "creator-4", name: "Karan Mehta", email: "karan.creator@leadyfy.test", city: "Pune", languages: "Hindi, Marathi", niches: "Comedy, Lifestyle", ratePerVideo: 3000 },
    { id: "creator-5", name: "Ananya Iyer", email: "ananya.creator@leadyfy.test", city: "Chennai", languages: "Tamil, English", niches: "Beauty, Fashion", ratePerVideo: 4500 },
  ];

  for (const c of creators) {
    await prisma.creator.upsert({ where: { id: c.id }, update: c, create: c });
  }

  const availabilityStatuses = ["AVAILABLE", "BOOKED", "UNAVAILABLE", "ON_HOLD"] as const;
  let dayOffset = 0;
  for (const c of creators) {
    for (let i = 0; i < 3; i++) {
      const date = new Date();
      date.setDate(date.getDate() + dayOffset);
      dayOffset++;
      await prisma.creatorAvailability.upsert({
        where: { creatorId_date: { creatorId: c.id, date } },
        update: { status: availabilityStatuses[i % availabilityStatuses.length] },
        create: { creatorId: c.id, date, status: availabilityStatuses[i % availabilityStatuses.length] },
      });
    }
  }
  console.log(`Seeded ${creators.length} creators + availability`);
}

async function seedShoots() {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);

  const shoots = [
    { id: "shoot-1", scriptId: "script-6", creatorId: "creator-1", managerId: "employee-profile-shootmgr", scheduledAt: today, location: "Mumbai Studio A", status: "SCHEDULED" as const },
    { id: "shoot-2", scriptId: "script-7", creatorId: "creator-2", managerId: "employee-profile-shootmgr", scheduledAt: tomorrow, location: "Delhi Studio B", status: "CONFIRMED" as const },
    { id: "shoot-3", scriptId: "script-2", creatorId: "creator-3", managerId: "employee-profile-shootmgr", scheduledAt: nextWeek, location: "Bengaluru Loft", status: "SCHEDULED" as const },
    { id: "shoot-4", scriptId: "script-8", creatorId: "creator-4", managerId: "employee-profile-shootmgr", scheduledAt: yesterday, location: "Pune Studio", status: "COMPLETED" as const },
    { id: "shoot-5", scriptId: "script-3", creatorId: "creator-5", managerId: "employee-profile-shootmgr", scheduledAt: lastWeek, location: "Chennai Outdoor", status: "CANCELLED" as const },
    { id: "shoot-6", scriptId: "script-1", creatorId: "creator-1", managerId: "employee-profile-shootmgr", scheduledAt: lastWeek, location: "Mumbai Studio A", status: "RESHOOT_REQUIRED" as const },
  ];

  for (const s of shoots) {
    await prisma.shoot.upsert({ where: { id: s.id }, update: s, create: s });
  }
  console.log(`Seeded ${shoots.length} shoots`);
}

async function seedVideos() {
  const stages = [
    "SCRIPT_APPROVED",
    "SHOOT_PENDING",
    "RAW_FOOTAGE_RECEIVED",
    "VIDEO_EDITING",
    "INTERNAL_QA",
    "CLIENT_REVIEW",
    "REVISION",
    "FINAL_APPROVED",
    "DELIVERED",
    "VIDEO_EDITING",
  ] as const;
  const scriptIds = ["script-6", "script-7", "script-2", "script-8", "script-3", "script-1", "script-4", "script-5", "script-1", "script-6"];
  const shootIds = [null, "shoot-2", "shoot-3", "shoot-4", "shoot-5", "shoot-6", null, null, "shoot-6", null];

  const today = new Date();
  const inTwoDays = new Date();
  inTwoDays.setDate(inTwoDays.getDate() + 2);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const deadlines = [today, inTwoDays, yesterday, today, inTwoDays, yesterday, today, inTwoDays, yesterday, today];

  for (let i = 0; i < stages.length; i++) {
    const id = `video-${i + 1}`;
    await prisma.video.upsert({
      where: { id },
      update: { status: stages[i] },
      create: {
        id,
        scriptId: scriptIds[i],
        shootId: shootIds[i],
        editorId: "employee-profile-editor",
        title: `Video #${i + 1}`,
        status: stages[i],
        deadline: deadlines[i],
      },
    });
  }

  const feedback = [
    { id: "feedback-1", videoId: "video-6", comment: "Please trim the intro by 3 seconds and swap the CTA text.", timestampSec: 12 },
    { id: "feedback-2", videoId: "video-6", comment: "Logo watermark is cut off in the bottom-right corner.", timestampSec: 45 },
    { id: "feedback-3", videoId: "video-7", comment: "Looks great, just fix the audio sync around 0:20.", timestampSec: 20 },
  ];
  for (const f of feedback) {
    await prisma.videoFeedback.upsert({ where: { id: f.id }, update: f, create: f });
  }
  console.log(`Seeded ${stages.length} videos + ${feedback.length} feedback rows`);
}

async function seedTasks() {
  const today = new Date();
  const overdue1 = new Date();
  overdue1.setDate(overdue1.getDate() - 3);
  const overdue2 = new Date();
  overdue2.setDate(overdue2.getDate() - 1);
  const upcoming = new Date();
  upcoming.setDate(upcoming.getDate() + 3);

  const tasks = [
    { id: "task-1", title: "Confirm Acme Foods shoot location", orderId: "order-acme-1", assigneeId: "profile-shootmgr", status: "TODO" as const, priority: "URGENT" as const, dueDate: overdue1 },
    { id: "task-2", title: "Follow up on Nova Skincare onboarding docs", orderId: "order-nova-1", assigneeId: "profile-sales", status: "IN_PROGRESS" as const, priority: "HIGH" as const, dueDate: overdue2 },
    { id: "task-3", title: "Review script #3 revisions", orderId: "order-bloom-1", assigneeId: "profile-writer", status: "TODO" as const, priority: "MEDIUM" as const, dueDate: upcoming },
    { id: "task-4", title: "Render final export for video #9", orderId: "order-urbanfit-1", assigneeId: "profile-editor", status: "IN_PROGRESS" as const, priority: "HIGH" as const, dueDate: today },
    { id: "task-5", title: "Chase Zenith Traders outstanding invoice", orderId: "order-zenith-1", assigneeId: "profile-admin", status: "TODO" as const, priority: "URGENT" as const, dueDate: today },
    { id: "task-6", title: "Book creator for reshoot", orderId: "order-acme-2", assigneeId: "profile-shootmgr", status: "DONE" as const, priority: "MEDIUM" as const, dueDate: overdue1 },
    { id: "task-7", title: "Prepare monthly expense report", assigneeId: "profile-owner", status: "TODO" as const, priority: "LOW" as const, dueDate: upcoming },
    { id: "task-8", title: "Update creator rate card", assigneeId: "profile-admin", status: "DONE" as const, priority: "LOW" as const, dueDate: overdue2 },
  ];

  for (const t of tasks) {
    await prisma.task.upsert({ where: { id: t.id }, update: t, create: t });
  }
  console.log(`Seeded ${tasks.length} tasks`);
}

async function seedFinancials() {
  const now = new Date();
  const payments = [
    { id: "payment-1", orderId: "order-acme-1", invoiceNumber: "INV-1001", amount: 60000, amountPaid: 60000, status: "PAID" as const, paidAt: now },
    { id: "payment-2", orderId: "order-acme-2", invoiceNumber: "INV-1002", amount: 110000, amountPaid: 55000, status: "PARTIALLY_PAID" as const, paidAt: now },
    { id: "payment-3", orderId: "order-nova-1", invoiceNumber: "INV-1003", amount: 85000, amountPaid: 0, status: "UNPAID" as const },
    { id: "payment-4", orderId: "order-bloom-1", invoiceNumber: "INV-1004", amount: 25000, amountPaid: 0, status: "UNPAID" as const },
    { id: "payment-5", orderId: "order-urbanfit-1", invoiceNumber: "INV-1005", amount: 58000, amountPaid: 20000, status: "OVERDUE" as const, paidAt: now },
    { id: "payment-6", orderId: "order-zenith-1", invoiceNumber: "INV-1006", amount: 105000, amountPaid: 105000, status: "PAID" as const, paidAt: now },
  ];
  for (const p of payments) {
    await prisma.payment.upsert({ where: { id: p.id }, update: p, create: p });
  }

  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);
  const expenses = [
    { id: "expense-1", category: "Salaries", amount: 180000, incurredAt: now },
    { id: "expense-2", category: "Studio", amount: 25000, incurredAt: now },
    { id: "expense-3", category: "Equipment", amount: 15000, incurredAt: lastMonth },
    { id: "expense-4", category: "Fuel", amount: 6000, incurredAt: now },
    { id: "expense-5", category: "Office", amount: 20000, incurredAt: lastMonth },
  ];
  for (const e of expenses) {
    await prisma.expense.upsert({ where: { id: e.id }, update: e, create: e });
  }

  const payouts = [
    { id: "payout-1", creatorId: "creator-1", shootId: "shoot-6", amount: 3500, status: "PENDING" as const },
    { id: "payout-2", creatorId: "creator-2", shootId: "shoot-2", amount: 4200, status: "APPROVED" as const },
    { id: "payout-3", creatorId: "creator-4", shootId: "shoot-4", amount: 3000, status: "PAID" as const, paidAt: now },
    { id: "payout-4", creatorId: "creator-3", shootId: "shoot-3", amount: 3800, status: "PENDING" as const },
  ];
  for (const p of payouts) {
    await prisma.creatorPayout.upsert({ where: { id: p.id }, update: p, create: p });
  }
  console.log(`Seeded ${payments.length} payments, ${expenses.length} expenses, ${payouts.length} creator payouts`);
}

async function seedSupportAndActivity() {
  const tickets = [
    { id: "ticket-1", clientId: "client-acme", subject: "Delivery link not opening", message: "The Drive link for video #4 gives a permission error.", status: "OPEN" as const },
    { id: "ticket-2", clientId: "client-acme", subject: "Invoice discrepancy", message: "INV-1002 shows a different total than agreed.", status: "IN_PROGRESS" as const },
    { id: "ticket-3", clientId: "client-nova", subject: "Change of brand guidelines", message: "We've updated our logo — please use the new brand kit.", status: "RESOLVED" as const },
  ];
  for (const t of tickets) {
    await prisma.supportTicket.upsert({ where: { id: t.id }, update: t, create: t });
  }

  const activity = [
    { id: "activity-1", profileId: "profile-sales", action: "CLIENT_ONBOARDED", entityType: "Client", entityId: "client-nova" },
    { id: "activity-2", profileId: "profile-writer", action: "SCRIPT_APPROVED", entityType: "Script", entityId: "script-6" },
    { id: "activity-3", profileId: "profile-admin", action: "PAYMENT_RECORDED", entityType: "Payment", entityId: "payment-1" },
    { id: "activity-4", clientId: "client-acme", action: "CLIENT_FEEDBACK_POSTED", entityType: "Video", entityId: "video-6" },
    { id: "activity-5", profileId: "profile-editor", action: "VIDEO_DELIVERED", entityType: "Video", entityId: "video-9" },
  ];
  for (const a of activity) {
    await prisma.activityLog.upsert({ where: { id: a.id }, update: a, create: a });
  }

  const notifyProfiles = ["profile-owner", "profile-admin", "profile-sales", "profile-writer", "profile-shootmgr", "profile-editor"];
  let n = 1;
  for (const profileId of notifyProfiles) {
    const messages = [
      "New client onboarded: Nova Skincare",
      "Script #6 approved by client",
      "Shoot scheduled for tomorrow",
    ];
    for (const message of messages) {
      const id = `notification-${n++}`;
      await prisma.notification.upsert({ where: { id }, update: { message }, create: { id, profileId, message } });
    }
  }
  console.log(`Seeded ${tickets.length} support tickets, ${activity.length} activity logs, ${notifyProfiles.length * 3} notifications`);
}

async function main() {
  await seedUsers();
  await seedClients();
  await seedOrders();
  await seedScripts();
  await seedCreators();
  await seedShoots();
  await seedVideos();
  await seedTasks();
  await seedFinancials();
  await seedSupportAndActivity();
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
