export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firstName, lastName, email, phone, service, details } = req.body || {};

  if (!firstName || !lastName || !email || !phone || !service || !details) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    return res.status(500).json({ error: 'RESEND_API_KEY is not configured' });
  }

  const safe = (value) => String(value).replace(/[<>]/g, '');
  const safeFirstName = safe(firstName);
  const safeLastName = safe(lastName);
  const safeEmail = safe(email);
  const safePhone = safe(phone);
  const safeService = safe(service);
  const safeDetails = safe(details).replace(/\n/g, '<br/>');

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
    safe(details),
  ].join('\n');

  const htmlBody = `
    <h2>New enquiry from Project Approvals website</h2>
    <p><strong>Name:</strong> ${safeFirstName} ${safeLastName}</p>
    <p><strong>Email:</strong> ${safeEmail}</p>
    <p><strong>Phone:</strong> ${safePhone}</p>
    <p><strong>Service:</strong> ${safeService}</p>
    <p><strong>Project details:</strong></p>
    <p>${safeDetails}</p>
  `;

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Project Approvals <noreply@send.projectapprovals.com.au>',
      to: ['info@projectapprovals.com.au'],
      reply_to: safeEmail,
      subject: `New enquiry: ${safeFirstName} ${safeLastName} - ${safeService}`,
      text: textBody,
      html: htmlBody,
    }),
  });

  const resendData = await resendResponse.json();

  if (!resendResponse.ok) {
    console.error('Resend API error:', resendData);
    return res.status(500).json({ error: 'Failed to send email' });
  }

  return res.status(200).json({ success: true, id: resendData.id });
}
