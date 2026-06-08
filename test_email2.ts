import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const testEmail = process.env.EMAIL_USER;
  if (!testEmail) {
    console.error('EMAIL_USER is not defined in .env.local');
    return;
  }

  console.log(`Sending direct test email to ${testEmail}...`);
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"GOGRAPHY" <${process.env.EMAIL_USER}>`,
      to: testEmail,
      subject: 'Direct Test Email',
      text: 'This is a test email directly from Node.js',
    });
    console.log('Success!', info);
  } catch (error) {
    console.error('Error:', error);
  }
}

run().catch(console.error);
