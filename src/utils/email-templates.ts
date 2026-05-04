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
              <img src="https://www.getchintu.com/icon.png" alt="Chintu Intelligence" width="60" height="60" style="margin-bottom: 20px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 900; color: #1a1a1c; letter-spacing: -0.02em; text-transform: uppercase;">Identity Verified.</h1>
              <p style="margin: 10px 0 0 0; font-size: 14px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 0.2em;">Welcome to the Ecosystem</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #4b5563; text-align: center;">
                Your strategic interview assistant is now active. We've provisioned your account with tactical credits to jumpstart your career growth with high-precision intelligence.
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
                <h3 style="font-size: 12px; font-weight: 900; color: #1a1a1c; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px;">Next Steps for Success:</h3>
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td width="24" style="vertical-align: top; padding-bottom: 12px;">
                      <div style="width: 16px; height: 16px; background-color: #6366f1; border-radius: 4px;"></div>
                    </td>
                    <td style="padding-bottom: 12px; font-size: 14px; color: #4b5563; line-height: 1.4;">
                      <b>Feed the Engine:</b> Complete your profile with your resume and JD to enable high-context response synthesis.
                    </td>
                  </tr>
                  <tr>
                    <td width="24" style="vertical-align: top; padding-bottom: 12px;">
                      <div style="width: 16px; height: 16px; background-color: #6366f1; border-radius: 4px;"></div>
                    </td>
                    <td style="padding-bottom: 12px; font-size: 14px; color: #4b5563; line-height: 1.4;">
                      <b>Activate Stealth:</b> Launch the ghost interface during your live sessions for real-time tactical guidance.
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
              <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 500; color: #6b7280;">
                Questions or issues? Contact our strategy team at <a href="mailto:contact@getchintu.com" style="color: #6366f1; text-decoration: none;">contact@getchintu.com</a>
              </p>
              <p style="margin: 0 0 15px 0; font-size: 11px; color: #9ca3af; line-height: 1.5;">
                You are receiving this email because you recently created an account at Chintu Intelligence.<br>
                Chintu Intelligence, 123 Tech Avenue, Innovation District, CA 94105
              </p>
              <p style="margin: 0; font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em;">
                © 2026 Chintu Intelligence Ecosystem • <a href="${appUrl}/setup" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a>
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

export const getPaymentEmailHtml = (
  name: string,
  plan: string,
  oldPlan: string,
  credits: number,
  price: string,
  timestamp: string,
  appUrl: string,
  expiry: string
) => `
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
              <img src="https://www.getchintu.com/icon.png" alt="Chintu Intelligence" width="60" height="60" style="margin-bottom: 20px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 900; color: #1a1a1c; letter-spacing: -0.02em; text-transform: uppercase;">CHINTU: MISSION CONTROL</h1>
              <p style="margin: 10px 0 0 0; font-size: 14px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 0.2em;">TACTICAL UPGRADE VERIFIED</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #4b5563; text-align: center;">
                Your upgrade to the <b>${plan.toUpperCase()}</b> tier is verified. Advanced strategic engines and high-priority features are now fully operational.
              </p>
              
              <div style="background-color: #f8f9fa; border-radius: 24px; padding: 30px; border: 1px solid #f1f3f5; margin-bottom: 32px;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding-bottom: 15px;">
                      <span style="font-size: 10px; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em;">Candidate:</span>
                      <div style="font-size: 14px; font-weight: 700; color: #1a1a1c;">${name}</div>
                    </td>
                    <td style="padding-bottom: 15px; text-align: right;">
                      <span style="font-size: 10px; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em;">Timestamp:</span>
                      <div style="font-size: 12px; font-weight: 500; color: #6b7280;">${timestamp}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom: 15px;">
                      <span style="font-size: 10px; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em;">Operation Tier:</span>
                      <div style="font-size: 14px; font-weight: 700; color: #1a1a1c;">${oldPlan.toUpperCase()} → ${plan.toUpperCase()}</div>
                    </td>
                    <td style="padding-bottom: 15px; text-align: right;">
                      <span style="font-size: 10px; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em;">Transaction:</span>
                      <div style="font-size: 14px; font-weight: 700; color: #1a1a1c;">${price}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom: 15px;">
                      <span style="font-size: 10px; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em;">Tactical Credit Allocation:</span>
                      <div style="font-size: 14px; font-weight: 700; color: #10b981;">${credits} Credits Stacked</div>
                    </td>
                    <td style="padding-bottom: 15px; text-align: right;">
                      <span style="font-size: 10px; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em;">Protocol Expiry:</span>
                      <div style="font-size: 14px; font-weight: 700; color: #1a1a1c;">${expiry}</div>
                    </td>
                  </tr>
                </table>
              </div>

              <div style="margin-bottom: 32px;">
                <h3 style="font-size: 12px; font-weight: 900; color: #1a1a1c; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px;">Enhanced Capabilities:</h3>
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td width="24" style="vertical-align: top; padding-bottom: 12px;">
                      <div style="width: 16px; height: 16px; background-color: #6366f1; border-radius: 4px;"></div>
                    </td>
                    <td style="padding-bottom: 12px; font-size: 14px; color: #4b5563; line-height: 1.4;">
                      <b>Elite Strategic Engines:</b> Access to our highest-fidelity reasoning and specialized coding logic.
                    </td>
                  </tr>
                  <tr>
                    <td width="24" style="vertical-align: top; padding-bottom: 12px;">
                      <div style="width: 16px; height: 16px; background-color: #6366f1; border-radius: 4px;"></div>
                    </td>
                    <td style="padding-bottom: 12px; font-size: 14px; color: #4b5563; line-height: 1.4;">
                      <b>Stealth Operation:</b> High-speed visual analysis and stealth session tracking are now active.
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
              <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 500; color: #6b7280;">
                Billing questions? Contact our support team at <a href="mailto:contact@getchintu.com" style="color: #6366f1; text-decoration: none;">contact@getchintu.com</a>
              </p>
              <p style="margin: 0 0 15px 0; font-size: 11px; color: #9ca3af; line-height: 1.5;">
                You are receiving this receipt because of a recent transaction on your Chintu Intelligence account.<br>
                Chintu Intelligence, 123 Tech Avenue, Innovation District, CA 94105
              </p>
              <p style="margin: 0; font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em;">
                © 2026 Chintu Intelligence Ecosystem • <a href="${appUrl}/setup" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a>
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
