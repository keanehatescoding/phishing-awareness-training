import { and, eq, or, sql } from "drizzle-orm";
import { db } from "../src/db/index";
import * as schema from "../src/db/schema";

async function main() {
  console.log("Seeding database...");

  await db.transaction(async (tx) => {
    // Check if company already exists
    let [company] = await tx
      .select()
      .from(schema.companies)
      .where(
        eq(schema.companies.domain, "example-bank.co.ke")
      )
      .limit(1);
    
    if (!company) {
      [company] = await tx
        .insert(schema.companies)
        .values({
          name: "Example Bank Ltd",
          domain: "example-bank.co.ke",
          billingEmail: "billing@example-bank.co.ke",
        })
        .returning();
    }
    if (!company) {
      throw new Error("Failed to create or find company");
    }

    // Check if user already exists
    let [user] = await tx
      .select()
      .from(schema.users)
      .where(
        sql`lower(${schema.users.email}) = ${"admin@example-bank.co.ke"}`
      )
      .limit(1);
    
    if (!user) {
      [user] = await tx
        .insert(schema.users)
        .values({
          email: "admin@example-bank.co.ke",
          name: "Admin User",
          passwordHash: "$2b$12$placeholder_hash_for_demo_only",
        })
        .returning();
    }
    if (!user) {
      throw new Error("Failed to create or find user");
    }

    // Check if membership already exists
    const existingMembership = await tx
      .select()
      .from(schema.memberships)
      .where(
        and(
          eq(schema.memberships.userId, user.id),
          eq(schema.memberships.companyId, company.id)
        )
      )
      .limit(1);
    
    if (existingMembership.length === 0) {
      await tx.insert(schema.memberships).values({
        userId: user.id,
        companyId: company.id,
        role: "admin",
      });
    }

    // Check if employees already exist
    let [employee1] = await tx
      .select()
      .from(schema.employees)
      .where(
        and(
          eq(schema.employees.companyId, company.id),
          sql`lower(${schema.employees.email}) = ${"john.doe@example-bank.co.ke"}`
        )
      )
      .limit(1);
    
    if (!employee1) {
      [employee1] = await tx
        .insert(schema.employees)
        .values({
          companyId: company.id,
          email: "john.doe@example-bank.co.ke",
          name: "John Doe",
          department: "Finance",
          locale: "en-KE",
        })
        .returning();
    }
    if (!employee1) {
      throw new Error("Failed to create or find employee1");
    }

    let [employee2] = await tx
      .select()
      .from(schema.employees)
      .where(
        and(
          eq(schema.employees.companyId, company.id),
          sql`lower(${schema.employees.email}) = ${"jane.smith@example-bank.co.ke"}`
        )
      )
      .limit(1);
    
    if (!employee2) {
      [employee2] = await tx
        .insert(schema.employees)
        .values({
          companyId: company.id,
          email: "jane.smith@example-bank.co.ke",
          name: "Jane Smith",
          department: "Operations",
          locale: "en-KE",
        })
        .returning();
    }
    if (!employee2) {
      throw new Error("Failed to create or find employee2");
    }

    // Check if template already exists
    let [template] = await tx
      .select()
      .from(schema.templates)
      .where(eq(schema.templates.name, "Fake M-Pesa Transaction Alert"))
      .limit(1);
    
    if (!template) {
      [template] = await tx
        .insert(schema.templates)
        .values({
          name: "Fake M-Pesa Transaction Alert",
          summary: "Simulates a fraudulent M-Pesa payment notification",
          difficulty: "medium",
          subject: "M-Pesa: KSh 50,000 received from Safaricom",
          fromName: "M-Pesa",
          fromAddress: "mpesa@safaricom.co.ke",
          html: `<html><body><h2>M-Pesa Transaction Notification</h2><p>You have received KSh 50,000 from Safaricom.</p><p>Transaction ID: MPESA-123456789</p><p>Date: {{date}}</p><p>Your new balance: KSh 150,000</p><p><a href="http://mpesa-training.co.ke/verify?token={{trackingToken}}">Click here to verify transaction</a></p><p>This is an automated message. Do not reply.</p></body></html>`,
          landingHtml: `<html><body><h1>Security Alert</h1><p>This was a simulated phishing test.</p><p>You clicked on a suspicious link. Please review the security training.</p></body></html>`,
          locale: "en-KE",
        })
        .returning();
    }
    if (!template) {
      throw new Error("Failed to create or find template");
    }

    // Check if campaign already exists
    let [campaign] = await tx
      .select()
      .from(schema.campaigns)
      .where(
        and(
          eq(schema.campaigns.companyId, company.id),
          eq(schema.campaigns.templateId, template.id),
          eq(schema.campaigns.name, "Q4 2024 Phishing Test - M-Pesa Scam")
        )
      )
      .limit(1);
    
    if (!campaign) {
      [campaign] = await tx
        .insert(schema.campaigns)
        .values({
          companyId: company.id,
          templateId: template.id,
          name: "Q4 2024 Phishing Test - M-Pesa Scam",
          status: "draft",
        })
        .returning();
    }
    if (!campaign) {
      throw new Error("Failed to create or find campaign");
    }

    // Check existing sends for the campaign and employees
    const existingSends = await tx
      .select()
      .from(schema.sends)
      .where(
        and(
          eq(schema.sends.campaignId, campaign.id),
          or(
            eq(schema.sends.employeeId, employee1.id),
            eq(schema.sends.employeeId, employee2.id)
          )
        )
      );
    
    const existingSendMap = new Map(existingSends.map(s => [s.employeeId, s]));
    
    const sends = [];
    
    if (!existingSendMap.has(employee1.id)) {
      const [send] = await tx
        .insert(schema.sends)
        .values({
          campaignId: campaign.id,
          employeeId: employee1.id,
          trackingToken: crypto.randomUUID(),
          outcome: "pending",
        })
        .returning();
      if (!send) {
        throw new Error("Failed to create send for employee1");
      }
      sends.push(send);
    } else {
      const existingSend = existingSendMap.get(employee1.id);
      if (!existingSend) {
        throw new Error("Missing existing send for employee1");
      }
      sends.push(existingSend);
    }
    
    if (!existingSendMap.has(employee2.id)) {
      const [send] = await tx
        .insert(schema.sends)
        .values({
          campaignId: campaign.id,
          employeeId: employee2.id,
          trackingToken: crypto.randomUUID(),
          outcome: "pending",
        })
        .returning();
      if (!send) {
        throw new Error("Failed to create send for employee2");
      }
      sends.push(send);
    } else {
      const existingSend = existingSendMap.get(employee2.id);
      if (!existingSend) {
        throw new Error("Missing existing send for employee2");
      }
      sends.push(existingSend);
    }

    // Check if lesson already exists
    let [lesson] = await tx
      .select()
      .from(schema.lessons)
      .where(eq(schema.lessons.slug, "mpesa-fraud-awareness"))
      .limit(1);
    
    if (!lesson) {
      [lesson] = await tx
        .insert(schema.lessons)
        .values({
          slug: "mpesa-fraud-awareness",
          title: "Identifying M-Pesa Fraud",
          tags: ["spoofed_domain", "urgency", "mobile_money"],
          bodyMd: `# M-Pesa Fraud Awareness

## Common M-Pesa Scams

1. **Fake Transaction Notifications**: Scammers send SMS/email pretending to be M-Pesa notifications for transactions that never happened.

2. **SIM Swap Scams**: Attackers trick you into revealing your PIN or getting a new SIM card issued in their name.

3. **Phishing Links**: Messages with links to fake websites that look like M-Pesa or bank portals.

## Red Flags

- Urgent requests for action
- Links to unfamiliar websites
- Requests for personal information or PINs
- Offers that seem too good to be true

## What to Do

- Always verify transactions through official M-Pesa menu (*234#)
- Never share your PIN with anyone
- Check the sender's phone number carefully
- Report suspicious messages immediately
`,
          minutes: 5,
        })
        .returning();
    }
    if (!lesson) {
      throw new Error("Failed to create or find lesson");
    }

    // Link lessons to sends
    for (const send of sends) {
      const existingAssignment = await tx
        .select()
        .from(schema.lessonAssignments)
        .where(
          and(
            eq(schema.lessonAssignments.sendId, send.id),
            eq(schema.lessonAssignments.lessonId, lesson.id)
          )
        )
        .limit(1);
      
      if (existingAssignment.length === 0) {
        await tx.insert(schema.lessonAssignments).values({
          sendId: send.id,
          lessonId: lesson.id,
        });
      }
    }

    console.log("Seeding complete!");
    console.log(`- Company: ${company.name}`);
    console.log(`- Users: 1 (${user.email})`);
    console.log(`- Employees: 2`);
    console.log(`- Templates: 1 (${template.name})`);
    console.log(`- Campaigns: 1 (${campaign.name})`);
    console.log(`- Sends: ${sends.length}`);
    console.log(`- Lessons: 1 (${lesson.title})`);
  });
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
