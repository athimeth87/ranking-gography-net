import nodemailer from 'nodemailer';

export async function sendWelcomeEmail(userEmail: string, userName: string = 'Photographer') {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"GOGRAPHY" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: 'Welcome to GOGRAPHY Ranking! 📸',
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
                      <span style="font-weight: 600;">GOGRAPHY</span> <span style="color: #666666; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-top: 4px;">Ranking</span>
                    </div>
                  </td>
                </tr>
                
                <!-- Body -->
                <tr>
                  <td style="padding: 20px 40px 40px 40px;">
                    <h1 style="font-size: 20px; font-weight: 400; margin: 0 0 24px 0; color: #111111;">Welcome, ${userName}.</h1>
                    <p style="font-size: 15px; line-height: 1.6; color: #444444; margin: 0 0 24px 0;">
                      We're thrilled to welcome you to GOGRAPHY Ranking. Our platform is dedicated to celebrating extraordinary photography from around the globe.
                    </p>
                    
                    <div style="background-color: #F9F9F9; border-left: 2px solid #111111; padding: 16px 24px; margin-bottom: 32px;">
                      <p style="font-size: 14px; line-height: 1.6; color: #111111; margin: 0 0 8px 0; font-weight: 500;">With your new account, you can:</p>
                      <ul style="margin: 0; padding-left: 16px; font-size: 14px; line-height: 1.6; color: #444444;">
                        <li style="margin-bottom: 4px;">Vote for your favorite photographs</li>
                        <li style="margin-bottom: 4px;">Save photos to your personal gallery</li>
                        <li>Join the Traveller rewards program</li>
                      </ul>
                    </div>

                    <!-- Button -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center">
                          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}" target="_blank" style="display: inline-block; background-color: #111111; color: #FFFFFF; text-decoration: none; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; padding: 16px 32px; border-radius: 2px;">
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
                      You received this email because you signed up for GOGRAPHY Ranking.<br>
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
    console.log('Welcome email sent to: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}

export async function sendAdminInviteEmail(userEmail: string, role: string) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"GOGRAPHY" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: 'You have been invited as an Admin! 🛡️',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Invitation</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAFAFA; color: #111111;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #EAEAEA; border-radius: 8px;">
                <tr>
                  <td align="center" style="padding: 40px;">
                    <div style="font-size: 24px; font-weight: 300;">
                      <span style="font-weight: 600;">GOGRAPHY</span> <span style="color: #666666; font-size: 14px; text-transform: uppercase;">System</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 40px 40px 40px;">
                    <h1 style="font-size: 20px; font-weight: 400; margin: 0 0 24px 0;">Admin Invitation</h1>
                    <p style="font-size: 15px; line-height: 1.6; color: #444444; margin: 0 0 24px 0;">
                      You have been granted <strong>${role.toUpperCase()}</strong> access to the Gography Ranking management system.
                    </p>
                    <p style="font-size: 15px; line-height: 1.6; color: #444444; margin: 0 0 24px 0;">
                      Please log in with this email address to access your dashboard. If you don't have an account yet, your permissions will be applied automatically as soon as you sign in.
                    </p>
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center">
                          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/admin" target="_blank" style="display: inline-block; background-color: #111111; color: #FFFFFF; text-decoration: none; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; padding: 16px 32px; border-radius: 2px;">
                            Access Dashboard
                          </a>
                        </td>
                      </tr>
                    </table>
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
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending admin email:', error);
    return false;
  }
}

export async function sendRankMasterEmail(userEmail: string, userName: string) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"GOGRAPHY Ranking" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: '👑 Congratulations! You are now a Rank Master',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAFAFA; color: #111111;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #EAEAEA; border-radius: 8px;">
                <tr>
                  <td align="center" style="padding: 40px;">
                    <div style="font-size: 24px; font-weight: 300;">
                      <span style="font-weight: 600;">GOGRAPHY</span> <span style="color: #666666; font-size: 14px; text-transform: uppercase;">Ranking</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 40px 40px 40px;">
                    <h1 style="font-size: 20px; font-weight: 400; margin: 0 0 24px 0;">👑 You did it, ${userName}!</h1>
                    <p style="font-size: 15px; line-height: 1.6; color: #444444; margin: 0 0 24px 0;">
                      Congratulations! Your incredible photography has maintained a Top 3 rank for 3 consecutive weeks. You have officially earned the <strong>Rank Master</strong> badge!
                    </p>
                    <p style="font-size: 15px; line-height: 1.6; color: #444444; margin: 0 0 24px 0;">
                      A silver crown icon will now appear next to your name across the platform, recognizing your consistent excellence.
                    </p>
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center">
                          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/about-ranking" target="_blank" style="display: inline-block; background-color: #111111; color: #FFFFFF; text-decoration: none; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; padding: 16px 32px; border-radius: 2px;">
                            View the Hall of Fame
                          </a>
                        </td>
                      </tr>
                    </table>
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
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending Rank Master email:', error);
    return false;
  }
}

export async function sendTop10Email(userEmail: string, userName: string, rank: number) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"GOGRAPHY Ranking" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: '📈 You are Trending in the Top 10!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAFAFA; color: #111111;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #EAEAEA; border-radius: 8px;">
                <tr>
                  <td align="center" style="padding: 40px;">
                    <div style="font-size: 24px; font-weight: 300;">
                      <span style="font-weight: 600;">GOGRAPHY</span> <span style="color: #666666; font-size: 14px; text-transform: uppercase;">Ranking</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 40px 40px 40px;">
                    <h1 style="font-size: 20px; font-weight: 400; margin: 0 0 24px 0;">Incredible work, ${userName}!</h1>
                    <p style="font-size: 15px; line-height: 1.6; color: #444444; margin: 0 0 24px 0;">
                      Your portfolio is gaining serious traction. You are currently ranked <strong>#${rank}</strong> in this week's Trending Photographers!
                    </p>
                    <p style="font-size: 15px; line-height: 1.6; color: #444444; margin: 0 0 24px 0;">
                      Keep uploading amazing photos to maintain your streak and aim for the Rank Master status.
                    </p>
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center">
                          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/explore" target="_blank" style="display: inline-block; background-color: #111111; color: #FFFFFF; text-decoration: none; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; padding: 16px 32px; border-radius: 2px;">
                            See the Leaderboard
                          </a>
                        </td>
                      </tr>
                    </table>
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
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending Top 10 email:', error);
    return false;
  }
}

