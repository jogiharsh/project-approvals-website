module.exports = async function handler(req, res) {
  // 1. Enforce CORS / HTTP Method Check
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. Safely Parse Incoming Body Body Data
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON payload structured.' });
    }
  }
  
  const { firstName, lastName, email, phone, service, details } = body || {};

  // 3. Fallback Validation Loop
  if (!firstName || !lastName || !email || !phone || !service || !details) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // 4. Verification Check on Environment Constants
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error('Configuration Error: RESEND_API_KEY environment variable missing.');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // 5. Sanitize Strings safely
  const safe = (value) => String(value || '').replace(/[<>]/g, '').trim();

  const safeFirstName = safe(firstName);
  const safeLastName = safe(lastName);
  const safeEmail = safe(email);
  const safePhone = safe(phone);
  const safeService = safe(service);
  const safeDetails = safe(details);

  // Regex string signature verification for emails
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(safeEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }

  // 6. Build Text and HTML email templates
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

  // 7. Fire API Request to Resend Endpoint
  try {
    const targetRecipient = process.env.TO_EMAIL || 'info@projectapprovals.com.au';
    
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Project Approvals <noreply@send.projectapprovals.com.au>',
        to: [targetRecipient],
        reply_to: safeEmail,
        subject: `New enquiry: ${safeFirstName} ${safeLastName} - ${safeService}`,
        text: textBody,
        html: htmlBody,
      }),
    });

    // Extract potential payload messages safely 
    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Resend API payload submission crash:', resendData);
      return res.status(resendResponse.status || 500).json({
        error: 'Failed to send email via integration layer',
        details: resendData,
      });
    }

    return res.status(200).json({
      success: true,
      id: resendData.id,
    });
  } catch (error) {
    console.error('Internal processing script crash execution layer:', error);
    return res.status(500).json({
      error: 'Failed to complete execution thread',
      details: error.message,
    });
  }
};
