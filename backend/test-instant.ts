import { sendEmail } from './src/services/emailService';

async function testInstantMail() {
  try {
    console.log('Attempting instant send...');
    const result = await sendEmail(
      '220108062@hbtu.ac.in', // to
      'Instant Mail Test', // subject
      'This is an instant mail sent from the backend script. Hello from ColdMail System!', // body
      'sundeepgangwar@gmail.com' // from
    );
    console.log('Instant email sent successfully!', result.messageId);
  } catch (error) {
    console.error('Failed to send instant email:', error);
  }
}

testInstantMail();
