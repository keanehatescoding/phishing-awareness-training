import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const campaignStatusEnum = pgEnum("campaign_status", ["draft", "scheduled", "sending", "sent", "closed"]);
export const sendOutcomeEnum = pgEnum("send_outcome", [
  "pending",
  "delivered",
  "bounced",
  "opened",
  "clicked",
  "reported",
  "credentials_submitted",
]);
export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("users_email_lower_idx").on(sql`lower(${t.email})`)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  // Primary verified mail domain; links coming from the training must look nothing like it.
  domain: text("domain").notNull(),
  billingEmail: text("billing_email").notNull(),
  ...timestamps,
});

export const memberships = pgTable(
  "memberships",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("admin"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.companyId] })],
);

/** The staff member being trained — the "target" of simulations. */
export const employees = pgTable(
  "employees",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    name: text("name").notNull(),
    department: text("department"),
    locale: text("locale").notNull().default("en-KE"),
    active: boolean("active").notNull().default(true),
    ...timestamps,
  },
  (t) => [uniqueIndex("employees_company_email_idx").on(t.companyId, sql`lower(${t.email})`)],
);

/** A phishing template — subject line, HTML body, landing-page copy. Shared across companies. */
export const templates = pgTable("templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  // Shown in the dashboard so admins know what the mail looked like.
  summary: text("summary").notNull(),
  difficulty: difficultyEnum("difficulty").notNull(),
  subject: text("subject").notNull(),
  fromName: text("from_name").notNull(),
  fromAddress: text("from_address").notNull(),
  html: text("html").notNull(),
  landingHtml: text("landing_html").notNull(),
  locale: text("locale").notNull().default("en-KE"),
  ...timestamps,
});

export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    templateId: uuid("template_id")
      .notNull()
      .references(() => templates.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    status: campaignStatusEnum("status").notNull().default("draft"),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("campaigns_company_idx").on(t.companyId, t.createdAt)],
);

/** One row per employee the campaign went to. */
export const sends = pgTable(
  "sends",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    // Unguessable per-send token embedded in the fake links.
    trackingToken: text("tracking_token").notNull(),
    outcome: sendOutcomeEnum("outcome").notNull().default("pending"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    clickedAt: timestamp("clicked_at", { withTimezone: true }),
    reportedAt: timestamp("reported_at", { withTimezone: true }),
    credentialsSubmittedAt: timestamp("credentials_submitted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("sends_token_idx").on(t.trackingToken),
    uniqueIndex("sends_campaign_employee_idx").on(t.campaignId, t.employeeId),
  ],
);

/** Short learning modules (video or markdown) shown as a response to clicking. */
export const lessons = pgTable("lessons", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  // Red-flag themes this lesson covers (e.g. "spoofed_domain", "urgency").
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  bodyMd: text("body_md").notNull(),
  minutes: integer("minutes").notNull().default(5),
  ...timestamps,
});

export const lessonAssignments = pgTable(
  "lesson_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sendId: uuid("send_id")
      .notNull()
      .references(() => sends.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "restrict" }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("lesson_assignments_send_lesson_idx").on(t.sendId, t.lessonId)],
);

export const companyRelations = relations(companies, ({ many }) => ({
  memberships: many(memberships),
  employees: many(employees),
  campaigns: many(campaigns),
}));

export const campaignRelations = relations(campaigns, ({ one, many }) => ({
  company: one(companies, { fields: [campaigns.companyId], references: [companies.id] }),
  template: one(templates, { fields: [campaigns.templateId], references: [templates.id] }),
  sends: many(sends),
}));

export const sendRelations = relations(sends, ({ one }) => ({
  campaign: one(campaigns, { fields: [sends.campaignId], references: [campaigns.id] }),
  employee: one(employees, { fields: [sends.employeeId], references: [employees.id] }),
}));

export type Company = typeof companies.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type Send = typeof sends.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
