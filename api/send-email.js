// api/send-email.js

const nodemailer = require('nodemailer');

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
    });
  }

  try {
    const body =
      typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

    const {
      firstName = '',
      lastName = '',
      email = '',
      phone = '',
      service = '',
      details = '',
      website = '',
    } = body;

    // Hidden spam trap. Real users will not fill this field.
    if (website) {
      return res.status(200).json({
        success: true,
        message: 'Enquiry submitted successfully.',
      });
    }

    if (!firstName || !lastName || !email || !phone || !service || !details) {
      return res.status(400).json({
        error: 'Please complete all required fields.',
      });
    }

    const SMTP_HOST = process.env.SMTP_HOST;
    const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASS;
    const TO_EMAIL = process.env.TO_EMAIL || 'info@projectapprovals.com.au';

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      console.error('Missing SMTP configuration');

      return res.status(500).json({
        error: 'Email service is not configured.',
      });
    }

    const fullName = `${firstName} ${lastName}`.trim();

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });

    const textContent = `
New Enquiry from Project Approvals Website

--- Contact Details ---
Name: ${fullName}
Email: ${email}
Phone: ${phone}
Service Required: ${service}

--- Project Details ---
${details}

---
Please respond to: ${email}
Phone: ${phone}
    `.trim();

    const htmlContent = `
      <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #1b2a35;">
        <h2 style="color: #061826;">New Enquiry from Project Approvals Website</h2>

        <h3 style="color: #061826;">Contact Details</h3>
        <p><strong>Name:</strong> ${escapeHtml(fullName)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
        <p><strong>Service Required:</strong> ${escapeHtml(service)}</p>

        <h3 style="color: #061826;">Project Details</h3>
        <p>${escapeHtml(details).replaceAll('\n', '<br>')}</p>

        <hr>

        <p><strong>Reply to:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Project Approvals" <${SMTP_USER}>`,
      to: TO_EMAIL,
      replyTo: email,
      subject: `New Enquiry from ${fullName} - ${service}`,
      text: textContent,
      html: htmlContent,
    });

    return res.status(200).json({
      success: true,
      message: 'Enquiry sent successfully.',
    });
  } catch (error) {
    console.error('Email sending error:', error);

    return res.status(500).json({
      error: 'Failed to send enquiry.',
    });
  }
};
