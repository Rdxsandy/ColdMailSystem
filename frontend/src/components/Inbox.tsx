import { useState } from 'react';
import { motion } from 'framer-motion';

const MOCK_EMAILS = [
  { id: 1, sender: 'Beata Gula', subject: 'Meeting with her - Monday morning', time: '10:00 AM', status: 'interested' },
  { id: 2, sender: 'Sanya Gupta', subject: 'New project update - UX design', time: '02:30 PM', status: 'closed' },
  { id: 3, sender: 'Arjun Singh', subject: 'Regarding the assignment submission', time: 'Yesterday', status: 'interested' },
  { id: 4, sender: 'Elena Gilbert', subject: 'Feedback on the cold mail system', time: 'Nov 12', status: 'meeting booked' },
];

import { useNavigate } from 'react-router-dom';

export const Inbox = () => {
  const [selected, setSelected] = useState(1);
  const navigate = useNavigate();

  const handleForward = () => {
    const email = MOCK_EMAILS.find(e => e.id === selected);
    if (!email) return;
    navigate('/dashboard', {
      state: {
        subject: `Fwd: ${email.subject}`,
        body: `\n\n---------- Forwarded message ---------\nFrom: ${email.sender}\nDate: ${email.time}\nSubject: ${email.subject}\nTo: me\n\nHi there,\n\nI hope you are doing well. I wanted to follow up on our previous conversation regarding the project requirements.\nWe have some exciting updates to share and would love to get your thoughts on the new proposal.\n\nPlease let me know if you are available for a quick sync next week.\n\nBest regards,\n${email.sender}`
      }
    });
  };

  const handleReply = () => {
    const email = MOCK_EMAILS.find(e => e.id === selected);
    if (!email) return;
    navigate('/dashboard', {
      state: {
        subject: `Re: ${email.subject}`,
        body: `\n\nOn ${email.time}, ${email.sender} wrote:\n> Hi there,\n> I hope you are doing well. I wanted to follow up on our previous conversation regarding the project requirements.\n> We have some exciting updates to share and would love to get your thoughts on the new proposal.\n> \n> Please let me know if you are available for a quick sync next week.\n> \n> Best regards,\n> ${email.sender}`
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fade-in"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'Inter, sans-serif' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>All Inboxes</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-outline" style={{ height: 32, padding: '0 12px', fontSize: 13 }}>Reset</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, gap: 20, minHeight: 0 }}>
        {/* Email List */}
        <div className="card" style={{ width: 340, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: 12, borderBottom: '1px solid #E5E7EB' }}>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input 
                type="text" 
                placeholder="Search" 
                className="input" 
                style={{ paddingLeft: 32, height: 32, fontSize: 13 }} 
              />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {MOCK_EMAILS.map(email => (
              <div 
                key={email.id}
                onClick={() => setSelected(email.id)}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #F3F4F6',
                  cursor: 'pointer',
                  background: selected === email.id ? '#F9FAFB' : 'transparent',
                  borderLeft: selected === email.id ? '3px solid #17AC4E' : '3px solid transparent',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{email.sender}</span>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>{email.time}</span>
                </div>
                <div style={{ fontSize: 13, color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {email.subject}
                </div>
                <div style={{ marginTop: 8 }}>
                  <span className={`badge ${email.status === 'interested' ? 'badge-green' : email.status === 'closed' ? 'badge-red' : 'badge-blue'}`}>
                    {email.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Thread View */}
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{MOCK_EMAILS.find(e => e.id === selected)?.sender}</h2>
              <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0' }}>to me</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
               <button className="btn-outline" style={{ height: 32, padding: '0 12px', fontSize: 13 }} onClick={handleReply}>Reply</button>
               <button className="btn-green" style={{ height: 32, padding: '0 12px', fontSize: 13 }} onClick={handleForward}>Forward</button>
            </div>
          </div>
          <div style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
            <div style={{ maxWidth: 600 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{MOCK_EMAILS.find(e => e.id === selected)?.subject}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: '#374151' }}>
                Hi there,<br /><br />
                I hope you are doing well. I wanted to follow up on our previous conversation regarding the project requirements. 
                We have some exciting updates to share and would love to get your thoughts on the new proposal.<br /><br />
                Please let me know if you are available for a quick sync next week.<br /><br />
                Best regards,<br />
                {MOCK_EMAILS.find(e => e.id === selected)?.sender}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
