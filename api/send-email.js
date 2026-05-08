// api/send-email.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      firstName = '',
      lastName = '',
      email = '',
      phone = '',
      service = '',
      details = '',
      website = '', // hidden spam trap
    } = req.body || {};

    // Spam trap: real users will not fill this field
    if (website) {
      return res.status(200).json({ success: true });
    }

    const fullName = `${firstName} ${lastName}`.trim();

    if (!firstName || !lastName || !email || !phone || !service || !details) {
      return res.status(400).json({
        error: 'Please complete all required fields.',
      });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
      console.error('Missing RESEND_API_KEY');
      return res.status(500).json({
        error: 'Email service is not configured.',
      });
    }

    const TO_EMAIL =
      process.env.TO_EMAIL || 'info@projectapprovals.com.au';

    const FROM_EMAIL =
      process.env.FROM_EMAIL || 'Project Approvals <onboarding@resend.dev>';

    const emailContent = `
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

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        reply_to: email,
        subject: `New Enquiry from ${fullName} - ${service}`,
        text: emailContent,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend error:', data);
      return res.status(500).json({
        error: data?.message || 'Failed to send enquiry.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Enquiry sent successfully.',
    });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      error: 'Something went wrong. Please try again.',
    });
  }
}
