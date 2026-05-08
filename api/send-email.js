// api/send-email.js

const nodemailer = require('nodemailer');

function extractEmail(value) {
  const match = String(value || '').match(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
  );

  return match ? match[0].trim().toLowerCase() : '';
}

function cleanHeader(value) {
  return String(value || '')
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .slice(0, 180);
}

function escapeHtml(value) {
  return String(value || '')
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
    const SMTP_USER = extractEmail(process.env.SMTP_USER);
    const SMTP_PASS = process.env.SMTP_PASS;
    const TO_EMAIL = extractEmail(
      process.env.TO_EMAIL || 'info@projectapprovals.com.au'
    );

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !TO_EMAIL) {
      console.error('Missing SMTP configuration', {
        hasHost: Boolean(SMTP_HOST),
        hasUser: Boolean(SMTP_USER),
        hasPass: Boolean(SMTP_PASS),
        hasTo: Boolean(TO_EMAIL),
      });

      return res.status(500).json({
        error: 'Email service is not configured.',
      });
    }

    const fullName = cleanHeader(`${firstName} ${lastName}`);
    const clientEmail = extractEmail(email);
    const cleanPhone = cleanHeader(phone);
    const cleanService = cleanHeader(service);
    const cleanDetails = String(details || '').trim();

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      requireTLS: SMTP_PORT === 587,
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
Email: ${clientEmail || email}
Phone: ${cleanPhone}
Service Required: ${cleanService}

--- Project Details ---
${cleanDetails}

---
Please respond to: ${clientEmail || email}
Phone: ${cleanPhone}
    `.trim();

    const htmlContent = `
      <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #1b2a35;">
        <h2 style="color: #061826;">New Enquiry from Project Approvals Website</h2>

        <h3 style="color: #061826;">Contact Details</h3>
        <p><strong>Name:</strong> ${escapeHtml(fullName)}</p>
        <p><strong>Email:</strong> ${escapeHtml(clientEmail || email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(cleanPhone)}</p>
        <p><strong>Service Required:</strong> ${escapeHtml(cleanService)}</p>

        <h3 style="color: #061826;">Project Details</h3>
        <p>${escapeHtml(cleanDetails).replaceAll('\n', '<br>')}</p>

        <hr>

        <p><strong>Reply to:</strong> ${escapeHtml(clientEmail || email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(cleanPhone)}</p>
      </div>
    `;

    const mailOptions = {
      from: {
        name: 'Project Approvals',
        address: SMTP_USER,
      },
      sender: SMTP_USER,
      to: {
        name: 'Project Approvals Enquiries',
        address: TO_EMAIL,
      },
      subject: cleanHeader(`New Enquiry from ${fullName} - ${cleanService}`),
      text: textContent,
      html: htmlContent,

      // Controls actual SMTP routing.
      envelope: {
        from: SMTP_USER,
        to: [TO_EMAIL],
      },
    };

    if (clientEmail) {
      mailOptions.replyTo = clientEmail;
    }

    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent successfully', {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      envelope: info.envelope,
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
