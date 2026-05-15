const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// =============================================================
// SMTP CONFIG  (fill these in before running)
// For Gmail: use an App Password, not your regular password.
// Generate at: https://myaccount.google.com/apppasswords
// =============================================================
const SMTP_HOST = 'smtp.gmail.com';
const SMTP_PORT = 465;
const SMTP_SECURE = true; // true for 465, false for 587
const SMTP_USER = '';      // <-- nodemailer id
const SMTP_PASS = '';         // <-- nodemailer pass

// =============================================================
// EMAIL CONTENT
// =============================================================
const FROM_NAME = 'Sourabh Kumhar';
const FROM_ADDRESS = SMTP_USER;

const SUBJECT = 'Application for Frontend/Full-Stack Developer — Sourabh Kumhar';

const TEXT_BODY = `Hi there,

I'm a Frontend Engineer with 2.5+ years building React and Next.js apps at CashBook — looking for my next challenge and wanted to introduce myself.

A few highlights:

• At CashBook, I cut load times by 25–35% across core user flows using memoization, lazy loading, and code-splitting — alongside ~30% fewer Sentry errors and a noticeable bump in session time on daily-use financial workflows.

• On the side, I built and scaled BeatStore, a music licensing marketplace, to 3,100+ users with Next.js + MongoDB and global payments — details in the resume.

• Earlier at Cognitivo (Sydney, remote), I shipped MERN-stack MVP features and built reusable UI systems with MUI and Ant Design.

Stack: React, Next.js, TypeScript, Tailwind, shadcn/ui, Zustand, Node.js, MongoDB.

Open to a 15-min call this week or next if there's a potential fit. Available to start immediately.

LinkedIn: linkedin.com/in/sourabhkumhar
GitHub: github.com/sourabhkumhar

Thanks for your time,
Sourabh Kumhar
+91 85608 42664`;

const HTML_BODY = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
</head>
<body style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.6; color: #222;">

<p>Hi there,</p>

<p>I'm a Frontend Engineer with 2.5+ years building React and Next.js apps at CashBook — looking for my next challenge and wanted to introduce myself.</p>

<p>A few highlights:</p>

<ul style="padding-left: 20px;">
  <li style="margin-bottom: 10px;">
    At <strong>CashBook</strong>, I cut load times by <strong>25–35%</strong> across core user flows using memoization, lazy loading, and code-splitting — alongside <strong>~30% fewer Sentry errors</strong> and a noticeable bump in session time on daily-use financial workflows.
  </li>
  <li style="margin-bottom: 10px;">
    On the side, I built and scaled <strong>BeatStore</strong>, a music licensing marketplace, to <strong>3,100+ users</strong> with Next.js + MongoDB and global payments — details in the resume.
  </li>
  <li style="margin-bottom: 10px;">
    Earlier at <strong>Cognitivo</strong> (Sydney, remote), I shipped MERN-stack MVP features and built reusable UI systems with MUI and Ant Design.
  </li>
</ul>

<p><strong>Stack:</strong> React, Next.js, TypeScript, Tailwind, shadcn/ui, Zustand, Node.js, MongoDB.</p>

<p>Open to a <strong>15-min call this week or next</strong> if there's a potential fit. Available to start <strong>immediately</strong>.</p>

<p>
  <strong>LinkedIn:</strong> <a href="https://linkedin.com/in/sourabhkumhar" style="color: #0066cc; text-decoration: none;">linkedin.com/in/sourabhkumhar</a><br>
  <strong>GitHub:</strong> <a href="https://github.com/sourabhkumhar" style="color: #0066cc; text-decoration: none;">github.com/sourabhkumhar</a>
</p>

<p>
  Thanks for your time,<br>
  <strong>Sourabh Kumhar</strong><br>
  <a href="tel:+918560842664" style="color: #0066cc; text-decoration: none;">+91 85608 42664</a>
</p>

</body>
</html>
`;

// =============================================================
// ATTACHMENT
// =============================================================
const ATTACHMENT_PATH = path.join(__dirname, 'sourabhkumhar_resume.pdf');
const ATTACHMENT_FILENAME = 'Sourabh_Kumhar_Resume.pdf';

// =============================================================
// INPUT / THROTTLING
// =============================================================
const EMAILS_JSON = path.join(__dirname, 'emails.json');
const SENT_LOG = path.join(__dirname, 'sent.log');
const FAILED_LOG = path.join(__dirname, 'failed.log');

const DELAY_MS = 4000;     // delay between sends (ms)
const DAILY_LIMIT = 450;   // max sends per run (Gmail free ~500/day)

// =============================================================
// MAIN
// =============================================================
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadSentSet() {
  if (!fs.existsSync(SENT_LOG)) return new Set();
  return new Set(
    fs.readFileSync(SENT_LOG, 'utf8')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
  );
}

async function main() {
  if (!fs.existsSync(ATTACHMENT_PATH)) {
    console.error(`Attachment not found: ${ATTACHMENT_PATH}`);
    process.exit(1);
  }
  if (!fs.existsSync(EMAILS_JSON)) {
    console.error(`Emails JSON not found: ${EMAILS_JSON}`);
    process.exit(1);
  }

  const allRecipients = JSON.parse(fs.readFileSync(EMAILS_JSON, 'utf8'));
  const alreadySent = loadSentSet();
  const recipients = allRecipients.filter((e) => !alreadySent.has(e));
  const skipped = allRecipients.length - recipients.length;

  console.log(`Total in JSON : ${allRecipients.length}`);
  console.log(`Already sent  : ${skipped}`);
  console.log(`To send now   : ${recipients.length}`);
  console.log(`Daily cap     : ${DAILY_LIMIT}`);
  console.log('---');

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  try {
    await transporter.verify();
    console.log('SMTP connection OK.');
  } catch (err) {
    console.error('SMTP verify failed:', err.message);
    process.exit(1);
  }

  let sentCount = 0;
  let failedCount = 0;

  for (let i = 0; i < recipients.length; i++) {
    if (sentCount >= DAILY_LIMIT) {
      console.log(`Daily cap of ${DAILY_LIMIT} reached. Stopping.`);
      break;
    }

    const to = recipients[i];
    const tag = `[${i + 1}/${recipients.length}]`;

    try {
      await transporter.sendMail({
        from: `"${FROM_NAME}" <${FROM_ADDRESS}>`,
        to,
        subject: SUBJECT,
        text: TEXT_BODY,
        html: HTML_BODY,
        attachments: [
          {
            filename: ATTACHMENT_FILENAME,
            path: ATTACHMENT_PATH,
          },
        ],
      });

      fs.appendFileSync(SENT_LOG, to + '\n');
      sentCount++;
      console.log(`${tag} sent  -> ${to}`);
    } catch (err) {
      fs.appendFileSync(FAILED_LOG, `${to}\t${err.message}\n`);
      failedCount++;
      console.log(`${tag} FAIL  -> ${to}  (${err.message})`);
    }

    if (i < recipients.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log('---');
  console.log(`Done. Sent: ${sentCount}, Failed: ${failedCount}, Skipped: ${skipped}`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
