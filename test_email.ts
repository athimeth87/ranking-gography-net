import { sendRankMasterEmail, sendTop10Email } from './src/lib/email';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const testEmail = 'zerryboy28@gmail.com';
  if (!testEmail) {
    console.error('EMAIL_USER is not defined in .env.local');
    return;
  }

  console.log(`Sending test Rank Master email to ${testEmail}...`);
  await sendRankMasterEmail(testEmail, 'Test User');

  console.log(`Sending test Top 10 email to ${testEmail}...`);
  await sendTop10Email(testEmail, 'Test User', 5);
  
  console.log('Test emails sent successfully!');
}

run().catch(console.error);
