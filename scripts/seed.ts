import { db } from "../src/db/index";
import * as schema from "../src/db/schema";

async function main() {
  console.log("Seeding database...");

  // Insert example company
  const [company] = await db
    .insert(schema.companies)
    .values({
      name: "Example Bank Ltd",
      domain: "example-bank.co.ke",
      billingEmail: "billing@example-bank.co.ke",
    })
    .returning();

  // Insert example user (admin)
  const [user] = await db
    .insert(schema.users)
    .values({
      email: "admin@example-bank.co.ke",
      name: "Admin User",
      passwordHash: "$2b$12$placeholder_hash_for_demo_only", // In production, use proper hashing
    })
    .returning();

  // Link user to company as admin
  await db.insert(schema.memberships).values({
    userId: user.id,
    companyId: company.id,
    role: "admin",
  });

  // Insert example employees
  const [employee1, employee2] = await db
    .insert(schema.employees)
    .values([
      {
        companyId: company.id,
        email: "john.doe@example-bank.co.ke",
        name: "John Doe",
        department: "Finance",
        locale: "en-KE",
      },
      {
        companyId: company.id,
        email: "jane.smith@example-bank.co.ke",
        name: "Jane Smith",
        department: "Operations",
        locale: "en-KE",
      },
    ])
    .returning();

  // Insert example phishing template (M-Pesa scam)
  const [template] = await db
    .insert(schema.templates)
    .values({
      name: "Fake M-Pesa Transaction Alert",
      summary: "Simulates a fraudulent M-Pesa payment notification",
      difficulty: "medium",
      subject: "M-Pesa: KSh 50,000 received from Safaricom",
      fromName: "M-Pesa",
      fromAddress: "mpesa@safaricom.co.ke",
      html: `<html><body><h2>M-Pesa Transaction Notification</h2><p>You have received KSh 50,000 from Safaricom.</p><p>Transaction ID: MPESA-123456789</p><p>Date: {{date}}</p><p>Your new balance: KSh 150,000</p><p><a href="http://example-bank.co.ke/verify?token={{trackingToken}}">Click here to verify transaction</a></p><p>This is an automated message. Do not reply.</p></body></html>`,
      landingHtml: `<html><body><h1>Security Alert</h1><p>This was a simulated phishing test.</p><p>You clicked on a suspicious link. Please review the security training.</p></body></html>`,
      locale: "en-KE",
    })
    .returning();

  // Insert example campaign
  const [campaign] = await db
    .insert(schema.campaigns)
    .values({
      companyId: company.id,
      templateId: template.id,
      name: "Q4 2024 Phishing Test - M-Pesa Scam",
      status: "draft",
    })
    .returning();

  // Insert sends for the campaign
  const sends = await db
    .insert(schema.sends)
    .values([
      {
        campaignId: campaign.id,
        employeeId: employee1.id,
        trackingToken: crypto.randomUUID(),
        outcome: "pending",
      },
      {
        campaignId: campaign.id,
        employeeId: employee2.id,
        trackingToken: crypto.randomUUID(),
        outcome: "pending",
      },
    ])
    .returning();

  // Insert example lessons
  const [lesson] = await db
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

  // Link lessons to sends
  for (const send of sends) {
    await db.insert(schema.lessonAssignments).values({
      sendId: send.id,
      lessonId: lesson.id,
    });
  }

  console.log("Seeding complete!");
  console.log(`- Company: ${company.name}`);
  console.log(`- Users: 1 (${user.email})`);
  console.log(`- Employees: 2`);
  console.log(`- Templates: 1 (${template.name})`);
  console.log(`- Campaigns: 1 (${campaign.name})`);
  console.log(`- Sends: ${sends.length}`);
  console.log(`- Lessons: 1 (${lesson.title})`);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
