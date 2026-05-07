// api/send-email.js
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firstName, lastName, email, phone, service, details } = req.body;

  // Validate required fields
  if (!firstName || !lastName || !email || !phone || !service || !details) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  // Prepare email content
  const emailContent = `
    New Enquiry from Project Approvals Website
    
    --- Contact Details ---
    Name: ${firstName} ${lastName}
    Email: ${email}
    Phone: ${phone}
    Service Required: ${service}
    
    --- Project Details ---
    ${details}
    
    ---
    Please respond to: ${email} or call ${phone}
  `;

  // Send email using Resend API
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'onboarding@resend.dev', // Resend's test sender (works immediately)
      // Or use your verified domain: 'contact@yourdomain.com'
      to: ['info@projectapprovals.com.au'],
      subject: `New Enquiry from ${firstName} ${lastName} - ${service}`,
      text: emailContent,
    }),
  });

  const data = await response.json();

  if (response.ok) {
    return res.status(200).json({ success: true, message: 'Email sent successfully!' });
  } else {
    console.error('Resend error:', data);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
