export const getWelcomeEmailHtml = (displayId: string, appUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: 'Inter', sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8f9fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 32px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.05); border: 1px solid #f1f3f5;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px 40px; text-align: center;">
              <img src="https://www.getchintu.com/icon.png" alt="Chintu AI" width="60" height="60" style="margin-bottom: 20px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 900; color: #1a1a1c; letter-spacing: -0.02em; text-transform: uppercase;">Identity Verified.</h1>
              <p style="margin: 10px 0 0 0; font-size: 14px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 0.2em;">Welcome to the Ecosystem</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #4b5563; text-align: center;">
                Your strategic interview assistant is now active. We've provisioned your account with tactical credits to jumpstart your career growth.
              </p>
              
              <div style="background-color: #f8f9fa; border-radius: 24px; padding: 30px; border: 1px solid #f1f3f5; margin-bottom: 32px;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding-bottom: 15px;">
                      <span style="font-size: 10px; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em;">Internal ID:</span>
                      <div style="font-size: 14px; font-weight: 700; color: #1a1a1c;">${displayId}</div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span style="font-size: 10px; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em;">Provisioned Credits:</span>
                      <div style="font-size: 14px; font-weight: 700; color: #10b981;">10 Tactical Credits</div>
                    </td>
                  </tr>
                </table>
              </div>

              <div style="margin-bottom: 32px;">
                <h3 style="font-size: 12px; font-weight: 900; color: #1a1a1c; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px;">Mission Objectives:</h3>
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td width="24" style="vertical-align: top; padding-bottom: 12px;">
                      <div style="width: 16px; height: 16px; background-color: #6366f1; border-radius: 4px;"></div>
                    </td>
                    <td style="padding-bottom: 12px; font-size: 14px; color: #4b5563; line-height: 1.4;">
                      <b>Setup Identity:</b> Complete your profile to enable personalized AI synthesis.
                    </td>
                  </tr>
                  <tr>
                    <td width="24" style="vertical-align: top; padding-bottom: 12px;">
                      <div style="width: 16px; height: 16px; background-color: #6366f1; border-radius: 4px;"></div>
                    </td>
                    <td style="padding-bottom: 12px; font-size: 14px; color: #4b5563; line-height: 1.4;">
                      <b>Stealth Operation:</b> Use the ghost overlay during live sessions.
                    </td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center;">
                <a href="${appUrl}/room" style="display: inline-block; background-color: #1a1a1c; color: #ffffff; padding: 18px 36px; border-radius: 16px; font-size: 12px; font-weight: 900; text-decoration: none; text-transform: uppercase; letter-spacing: 0.2em; box-shadow: 0 10px 20px rgba(0,0,0,0.1);">Launch Ghost Interface</a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #fcfcfd; border-top: 1px solid #f1f3f5; text-align: center;">
              <p style="margin: 0; font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em;">
                © 2026 Chintu AI Ecosystem • Stealth Mode Active
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const getPaymentEmailHtml = (plan: string, credits: number, appUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: 'Inter', sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8f9fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 32px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.05); border: 1px solid #f1f3f5;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px 40px; text-align: center;">
              <img src="https://www.getchintu.com/icon.png" alt="Chintu AI" width="60" height="60" style="margin-bottom: 20px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 900; color: #1a1a1c; letter-spacing: -0.02em; text-transform: uppercase;">Access Granted.</h1>
              <p style="margin: 10px 0 0 0; font-size: 14px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 0.2em;">Subscription Activated</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #4b5563; text-align: center;">
                Your upgrade to the <b>${plan.toUpperCase()}</b> tier is complete. Premium AI engines and advanced features have been unlocked for your account.
              </p>
              
              <div style="background-color: #f8f9fa; border-radius: 24px; padding: 30px; border: 1px solid #f1f3f5; margin-bottom: 32px;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding-bottom: 15px;">
                      <span style="font-size: 10px; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em;">Activated Plan:</span>
                      <div style="font-size: 14px; font-weight: 700; color: #1a1a1c;">${plan.toUpperCase()} Tier</div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span style="font-size: 10px; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em;">Monthly Credit Allowance:</span>
                      <div style="font-size: 14px; font-weight: 700; color: #10b981;">${credits} Tactical Credits</div>
                    </td>
                  </tr>
                </table>
              </div>

              <div style="margin-bottom: 32px;">
                <h3 style="font-size: 12px; font-weight: 900; color: #1a1a1c; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px;">Unlocked Capabilities:</h3>
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td width="24" style="vertical-align: top; padding-bottom: 12px;">
                      <div style="width: 16px; height: 16px; background-color: #6366f1; border-radius: 4px;"></div>
                    </td>
                    <td style="padding-bottom: 12px; font-size: 14px; color: #4b5563; line-height: 1.4;">
                      <b>Premium Engines:</b> Access GPT-OSS 120B and specialized Coding models.
                    </td>
                  </tr>
                  <tr>
                    <td width="24" style="vertical-align: top; padding-bottom: 12px;">
                      <div style="width: 16px; height: 16px; background-color: #6366f1; border-radius: 4px;"></div>
                    </td>
                    <td style="padding-bottom: 12px; font-size: 14px; color: #4b5563; line-height: 1.4;">
                      <b>Stealth Recording:</b> Secure, prompt-less session recording enabled.
                    </td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center;">
                <a href="${appUrl}/room" style="display: inline-block; background-color: #1a1a1c; color: #ffffff; padding: 18px 36px; border-radius: 16px; font-size: 12px; font-weight: 900; text-decoration: none; text-transform: uppercase; letter-spacing: 0.2em; box-shadow: 0 10px 20px rgba(0,0,0,0.1);">Resume Operation</a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #fcfcfd; border-top: 1px solid #f1f3f5; text-align: center;">
              <p style="margin: 0; font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em;">
                © 2026 Chintu AI Ecosystem • Subscription Support Active
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
