// ── FORM SUBMISSION ROUTED DIRECTLY TO FORMSPREE ──
async function handleFormSubmit(event) {
  event.preventDefault();
  
  // Gather form data
  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  const email = document.getElementById('emailAddr').value.trim();
  const phone = document.getElementById('phoneNum').value.trim();
  const service = document.getElementById('serviceSelect').value;
  const details = document.getElementById('projectDetails').value.trim();
  
  // Basic validation
  if (!firstName || !lastName || !email || !phone || !service || !details) {
    alert('Please fill in all fields before sending your enquiry.');
    return;
  }
  
  // Email validation
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    alert('Please enter a valid email address.');
    return;
  }
  
  const btn = document.getElementById('sb');
  const originalText = btn.textContent;
  btn.textContent = '✓  Sending...';
  btn.style.background = '#6366f1';
  btn.style.color = '#fff';
  btn.disabled = true;
  
  try {
    // 💡 PASTE YOUR COPIED FORMSPREE ENDPOINT URL HERE:
    const response = await fetch('https://formspree.io/projects/3000740037122849807', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        FirstName: firstName,
        LastName: lastName,
        Email: email,
        Phone: phone,
        Service: service,
        Message: details
      }),
    });
    
    if (response.ok) {
      btn.textContent = '✓  Enquiry Sent!';
      alert('Thank you! Your enquiry has been sent successfully. We\'ll get back to you soon.');
      
      // Clear the form fields completely
      document.getElementById('firstName').value = '';
      document.getElementById('lastName').value = '';
      document.getElementById('emailAddr').value = '';
      document.getElementById('phoneNum').value = '';
      document.getElementById('serviceSelect').value = '';
      document.getElementById('projectDetails').value = '';
    } else {
      const result = await response.json();
      throw new Error(result.error || 'Failed to send');
    }
  } catch (error) {
    console.error('Formspree Delivery Error:', error);
    btn.textContent = '✗  Failed. Try Again.';
    btn.style.background = '#ff007f';
    alert('Sorry, there was an error sending your enquiry via Formspree. Please try again or call us directly.');
  }
  
  setTimeout(() => {
    btn.textContent = originalText;
    btn.style.background = '';
    btn.style.color = '';
    btn.disabled = false;
  }, 3000);
}

// Re-bind the event listener to keep form keys operational
const contactForm = document.getElementById('contactForm');
contactForm.addEventListener('submit', handleFormSubmit);
