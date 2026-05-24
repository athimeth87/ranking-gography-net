const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function broadcastEmail() {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const { data: users, error } = await supabase.from('users').select('*');
  
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  console.log(`Found ${users.length} users. Sending emails...`);

  for (const user of users) {
    if (!user.email) continue;
    const userName = user.display_name || user.username || 'Photographer';
    
    const mailOptions = {
      from: `"GOGRAPHY" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Welcome to GOGRAPHY Photo Awards! 📸 (Broadcast Test)',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to GOGRAPHY</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAFAFA; color: #111111; -webkit-font-smoothing: antialiased;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FAFAFA; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #EAEAEA; border-radius: 8px; overflow: hidden;">
                  <!-- Header -->
                  <tr>
                    <td align="center" style="padding: 40px 40px 20px 40px;">
                      <div style="font-size: 24px; font-weight: 300; letter-spacing: -0.02em; color: #111111;">
                        <span style="font-weight: 600;">GOGRAPHY</span> <span style="color: #666666; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-top: 4px;">Photo Awards</span>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 20px 40px 40px 40px;">
                      <h1 style="font-size: 20px; font-weight: 400; margin: 0 0 24px 0; color: #111111;">Welcome, ${userName}.</h1>
                      <p style="font-size: 15px; line-height: 1.6; color: #444444; margin: 0 0 24px 0;">
                        We're thrilled to welcome you to GOGRAPHY Photo Awards. Our platform is dedicated to celebrating extraordinary photography from around the globe.
                      </p>
                      
                      <div style="background-color: #F9F9F9; border-left: 2px solid #111111; padding: 16px 24px; margin-bottom: 32px;">
                        <p style="font-size: 14px; line-height: 1.6; color: #111111; margin: 0 0 8px 0; font-weight: 500;">With your new account, you can:</p>
                        <ul style="margin: 0; padding-left: 16px; font-size: 14px; line-height: 1.6; color: #444444;">
                          <li style="margin-bottom: 4px;">Vote for your favorite photographs</li>
                          <li style="margin-bottom: 4px;">Save photos to your personal gallery</li>
                          <li>Join the Voyageur rewards program</li>
                        </ul>
                      </div>

                      <!-- Button -->
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td align="center">
                            <a href="https://gography.net" target="_blank" style="display: inline-block; background-color: #111111; color: #FFFFFF; text-decoration: none; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; padding: 16px 32px; border-radius: 2px;">
                              Explore GOGRAPHY
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #F9F9F9; padding: 32px 40px; border-top: 1px solid #EAEAEA;">
                      <p style="font-size: 12px; line-height: 1.5; color: #888888; margin: 0; text-align: center;">
                        You received this email because you are registered at GOGRAPHY Photo Awards.<br>
                        If you didn't create an account, please ignore this message.
                      </p>
                      <p style="font-size: 12px; color: #BBBBBB; margin: 16px 0 0 0; text-align: center;">
                        &copy; ${new Date().getFullYear()} GOGRAPHY. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${user.email}: ${info.messageId}`);
    } catch (err) {
      console.error(`Failed to send email to ${user.email}:`, err.message);
    }
  }
}

broadcastEmail();
