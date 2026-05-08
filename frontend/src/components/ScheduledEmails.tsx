import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { API_BASE } from '../config/api';

export const ScheduledEmails = () => {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        const res = await axios.get(`${API_BASE}/emails/scheduled`, { withCredentials: true });
        setEmails(res.data);
      } catch (error) {
        console.error('Error fetching scheduled emails', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEmails();
    const interval = setInterval(fetchEmails, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>Scheduled Emails</h1>
        <span style={{ fontSize: 13, color: '#6B7280', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 20, padding: '4px 12px' }}>
          {emails.length} queued
        </span>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['Recipient', 'Subject', 'Scheduled Time', 'Status'].map(h => (
                  <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ padding: '40px 20px', textAlign: 'center', color: '#9CA3AF' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <div style={{ width: 16, height: 16, border: '2px solid #E5E7EB', borderTopColor: '#17AC4E', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      Loading...
                    </div>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </td>
                </tr>
              ) : emails.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '60px 20px', textAlign: 'center', color: '#9CA3AF' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" style={{ marginBottom: 12, display: 'block', margin: '0 auto 12px' }}>
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 500 }}>No scheduled emails</p>
                    <p style={{ margin: '4px 0 0', fontSize: 13 }}>Emails you schedule will appear here</p>
                  </td>
                </tr>
              ) : (
                emails.map((email: any, i: number) => (
                  <tr
                    key={email.id}
                    style={{
                      borderBottom: i < emails.length - 1 ? '1px solid #F3F4F6' : 'none',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px 20px', color: '#374151', fontWeight: 500 }}>{email.recipientEmail}</td>
                    <td style={{ padding: '14px 20px', color: '#6B7280', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email.subject}</td>
                    <td style={{ padding: '14px 20px', color: '#6B7280', whiteSpace: 'nowrap' }}>
                      {format(new Date(email.scheduledTime), 'MMM dd, yyyy · HH:mm')}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span className="badge badge-blue">{email.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};
