/**
 * Base email template wrapper
 */
export function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FundBrave</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .email-wrapper {
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      padding: 30px;
      text-align: center;
    }
    .logo {
      color: #ffffff;
      font-size: 28px;
      font-weight: bold;
      text-decoration: none;
    }
    .content {
      padding: 30px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .button:hover {
      opacity: 0.9;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px 30px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
    }
    .footer a {
      color: #6366f1;
      text-decoration: none;
    }
    h1 {
      color: #1f2937;
      margin-top: 0;
    }
    p {
      color: #4b5563;
    }
    .highlight {
      background-color: #f3f4f6;
      padding: 15px;
      border-radius: 6px;
      margin: 15px 0;
    }
    .code {
      font-family: monospace;
      font-size: 24px;
      letter-spacing: 4px;
      color: #6366f1;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-wrapper">
      <div class="header">
        <a href="https://fundbrave.com" class="logo">FundBrave</a>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p>
          This email was sent by <a href="https://fundbrave.com">FundBrave</a>,
          the decentralized fundraising platform.
        </p>
        <p>
          <a href="https://fundbrave.com/unsubscribe">Unsubscribe</a> |
          <a href="https://fundbrave.com/privacy">Privacy Policy</a>
        </p>
        <p>&copy; ${new Date().getFullYear()} FundBrave. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
