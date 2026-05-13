import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firstName, lastName, email, phone, service, details } = req.body || {};

  if (!firstName || !lastName || !email || !phone || !service || !details) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const requiredEnv = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'TO_EMAIL'];
  const missingEnv = requiredEnv.filter((key) => !process.env[key]);

  if (missingEnv.length > 0) {
    return res.status(500).json({
      error: `Missing environment variables: ${missingEnv.join(', ')}`,
    });
  }

  const safe = (value) => String(value || '').replace(/[<>]/g, '').trim();

  const safeFirstName = safe(firstName);
  const safeLastName = safe(lastName);
  const safeEmail = safe(email);
  const safePhone = safe(phone);
  const safeService = safe(service);
  const safeDetails = safe(details);

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(safeEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }

  const smtpPort = Number(process.env.SMTP_PORT || 465);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: true,
    },
  });

  const textBody = [
    'New enquiry from Project Approvals website',
    '',
    'Contact details',
    `Name: ${safeFirstName} ${safeLastName}`,
    `Email: ${safeEmail}`,
    `Phone: ${safePhone}`,
    `Service: ${safeService}`,
    '',
    'Project details',
    safeDetails,
  ].join('\n');

  const htmlBody = `
    <h2>New enquiry from Project Approvals website</h2>
    <p><strong>Name:</strong> ${safeFirstName} ${safeLastName}</p>
    <p><strong>Email:</strong> ${safeEmail}</p>
    <p><strong>Phone:</strong> ${safePhone}</p>
    <p><strong>Service:</strong> ${safeService}</p>
    <p><strong>Project details:</strong></p>
    <p>${safeDetails.replace(/\n/g, '<br/>')}</p>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      sender: process.env.SMTP_USER,
      to: process.env.TO_EMAIL,
      replyTo: safeEmail,
      subject: `New enquiry: ${safeFirstName} ${safeLastName} - ${safeService}`,
      text: textBody,
      html: htmlBody,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Email sending error:', error);

    return res.status(500).json({
      error: 'Failed to send email',
      details: error.message,
      code: error.code || null,
      response: error.response || null,
    });
  }
}
