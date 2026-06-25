document.getElementById('contactForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const subject = document.getElementById('contactSubject').value.trim();
    const message = document.getElementById('contactMessage').value.trim();

    if (!name || !email || !message) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    try {
        const response = await fetch(API_BASE + 'api.php?action=contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, subject, message })
        });
        const data = await response.json();
        if (data.success) {
            showNotification('Message sent successfully!', 'success');
            document.getElementById('contactForm').reset();
        } else {
            showNotification(data.message || 'Failed to send message', 'error');
        }
    } catch (e) {
        showNotification('Network error', 'error');
    }
});