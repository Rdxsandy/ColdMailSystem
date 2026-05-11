import { useState, useRef } from 'react';
import Papa from 'papaparse';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '../config/api';
import { useAuth } from '../context/AuthContext';

// ── Toolbar button ──────────────────────────────────────────────────────────
const TB = ({ children, title, onClick }: { children: React.ReactNode; title?: string; onClick?: () => void }) => (
  <button className="toolbar-btn" title={title} onClick={onClick} type="button">{children}</button>
);

// ── Send-Later modal ────────────────────────────────────────────────────────
const SLOTS = [
  'Tomorrow, 10:00 AM', 'Tomorrow, 11:00 AM', 'Tomorrow, 12:00 PM',
  'Tomorrow, 01:00 PM', 'Tomorrow, 02:00 PM',
];

function SendLaterModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (slot: string) => void }) {
  const [selected, setSelected] = useState(SLOTS[0]);
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
    }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="card"
        style={{ width: 280, padding: 20, fontFamily: 'Inter, sans-serif' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#111827' }}>Send Later</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {SLOTS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setSelected(s)}
              style={{
                textAlign: 'left', padding: '9px 12px', borderRadius: 8, fontSize: 13,
                border: selected === s ? '1.5px solid #17AC4E' : '1px solid #E5E7EB',
                background: selected === s ? '#E8F8EF' : '#F9FAFB',
                color: selected === s ? '#15803D' : '#374151',
                fontWeight: selected === s ? 600 : 400,
                cursor: 'pointer', transition: 'all 0.1s',
              }}
            >{s}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Cancel</button>
          <button className="btn-green" style={{ flex: 1, justifyContent: 'center' }} onClick={() => onConfirm(selected)}>Confirm</button>
        </div>
      </motion.div>
    </div>
  );
}

import { useLocation, useNavigate } from 'react-router-dom';

// ── Main Dashboard ──────────────────────────────────────────────────────────
export const Dashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [subject, setSubject] = useState(location.state?.subject || '');
  const [body, setBody] = useState(location.state?.body || '');
  const [csvData, setCsvData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [delay, setDelay] = useState('2');
  const [hourlyLimit, setHourlyLimit] = useState('200');
  const [showSendLater, setShowSendLater] = useState(false);
  const fromEmail = user?.email || '';
  const [toInput, setToInput] = useState(location.state?.to || '');
  const fileRef = useRef<HTMLInputElement>(null);

  // Clear router state so navigating back doesn't re-fill old reply/forward data
  const clearRouterState = () => {
    navigate('/dashboard', { replace: true, state: null });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          const parsed = results.data.filter((row: any) => row.email || Object.values(row)[0]);
          setCsvData(parsed);
          toast.success(`Loaded ${parsed.length} recipients from CSV`);
        },
        error: () => toast.error('Failed to parse CSV'),
      });
    }
  };

  const handleSend = async (scheduledTime?: string) => {
    setLoading(true);
    try {
      let emails: any[] = [];
      const manualEmails = String(toInput).split(',').map((e: string) => e.trim()).filter((e: string) => e);

      if (csvData.length > 0) {
        emails = csvData.map((row: any) => {
          const to = row.email || Object.values(row)[0];
          let personalizedBody = body;
          Object.keys(row).forEach(k => {
            personalizedBody = personalizedBody.replace(new RegExp(`{{${k}}}`, 'g'), row[k]);
          });
          return { to, subject, body: personalizedBody, scheduledTime: scheduledTime ?? new Date().toISOString() };
        });
      } else if (manualEmails.length > 0) {
        emails = manualEmails.map((to: string) => ({
          to, subject, body, scheduledTime: scheduledTime ?? new Date().toISOString()
        }));
      } else {
        // If no recipients, send an empty one to not block the user (it will fail on SMTP later)
        emails = [{
          to: '',
          subject,
          body,
          scheduledTime: scheduledTime ?? new Date().toISOString()
        }];
      }
      await axios.post(`${API_BASE}/emails/schedule`, { emails });
      toast.success(`${emails.length} email(s) scheduled successfully!`);
      // Reset form
      setSubject('');
      setBody('');
      setCsvData([]);
      setToInput('');
      clearRouterState();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to schedule emails';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {showSendLater && (
          <SendLaterModal
            onClose={() => setShowSendLater(false)}
            onConfirm={(slot) => {
              setShowSendLater(false);
              const d = new Date();
              d.setDate(d.getDate() + 1);
              const [, time, ampm] = slot.match(/(\d+:\d+) (AM|PM)/) || [];
              if (time && ampm) {
                let [h, m] = time.split(':').map(Number);
                if (ampm === 'PM' && h !== 12) h += 12;
                if (ampm === 'AM' && h === 12) h = 0;
                d.setHours(h, m, 0, 0);
              }
              handleSend(d.toISOString());
            }}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="card"
        style={{ fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}
      >
        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid #E5E7EB',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>Compose New Email</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Attach */}
            <button
              type="button"
              title="Attach file"
              onClick={() => fileRef.current?.click()}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
            </button>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
            {/* Clock / schedule */}
            <button
              type="button"
              title="Schedule"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </button>
            {/* Send Later */}
            <button
              type="button"
              className="btn-outline"
              style={{ height: 32, padding: '0 14px', fontSize: 13 }}
              onClick={() => setShowSendLater(true)}
            >
              Send Later
            </button>
          </div>
        </div>

        {/* ── Fields ── */}
        <div style={{ padding: '0 20px' }}>
          {/* From */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #F3F4F6' }}>
            <span style={{ fontSize: 13, color: '#9CA3AF', width: 56, flexShrink: 0 }}>From</span>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6,
              padding: '5px 10px', fontSize: 13, color: '#374151', cursor: 'pointer',
            }}>
              {fromEmail}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>

          {/* To */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #F3F4F6' }}>
            <span style={{ fontSize: 13, color: '#9CA3AF', width: 56, flexShrink: 0 }}>To</span>
            <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <input
                type="text"
                value={toInput}
                onChange={e => setToInput(e.target.value)}
                placeholder="Enter email addresses (comma separated)"
                style={{ flex: 1, minWidth: 150, border: 'none', outline: 'none', fontSize: 13, background: 'transparent', fontFamily: 'Inter, sans-serif' }}
              />
              {csvData.length > 0 && (
                <span className="tag">+{csvData.length} from CSV</span>
              )}
              <span style={{ fontSize: 13, color: '#17AC4E', cursor: 'pointer', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}
                onClick={() => fileRef.current?.click()}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="21 15 21 19 3 19 3 15"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Upload List
              </span>
            </div>
          </div>

          {/* Subject */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #F3F4F6' }}>
            <span style={{ fontSize: 13, color: '#9CA3AF', width: 56, flexShrink: 0 }}>Subject</span>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Subject"
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#111827', background: 'transparent', fontFamily: 'Inter, sans-serif' }}
            />
          </div>

          {/* Delay + Hourly limit */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '12px 0', borderBottom: '1px solid #F3F4F6' }}>
            <span style={{ fontSize: 13, color: '#9CA3AF' }}>Delay between 2 emails</span>
            <input
              type="text"
              value={delay}
              onChange={e => setDelay(e.target.value)}
              style={{
                width: 52, height: 30, background: '#F9FAFB', border: '1px solid #E5E7EB',
                borderRadius: 6, fontSize: 13, textAlign: 'center', color: '#374151',
                fontFamily: 'Inter, sans-serif', outline: 'none',
              }}
            />
            <span style={{ fontSize: 13, color: '#9CA3AF' }}>Hourly Limit</span>
            <input
              type="text"
              value={hourlyLimit}
              onChange={e => setHourlyLimit(e.target.value)}
              style={{
                width: 52, height: 30, background: '#F9FAFB', border: '1px solid #E5E7EB',
                borderRadius: 6, fontSize: 13, textAlign: 'center', color: '#374151',
                fontFamily: 'Inter, sans-serif', outline: 'none',
              }}
            />
          </div>
        </div>

        {/* ── Rich text editor area ── */}
        <div style={{ padding: '12px 20px' }}>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Type Your Reply..."
            style={{
              width: '100%', minHeight: 200, border: '1px solid #E5E7EB',
              borderRadius: 8, padding: '12px 14px', fontSize: 14, color: '#374151',
              fontFamily: 'Inter, sans-serif', background: '#FAFAFA',
              resize: 'vertical', outline: 'none', lineHeight: 1.6,
            }}
            onFocus={e => { e.currentTarget.style.borderColor = '#17AC4E'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(23,172,78,0.1)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; }}
          />

          {/* Toolbar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
            padding: '8px 0', borderTop: '1px solid #F3F4F6', marginTop: 8,
          }}>
            <TB title="Undo">↩</TB>
            <TB title="Redo">↪</TB>
            <div style={{ width: 1, height: 18, background: '#E5E7EB', margin: '0 4px' }} />
            <TB title="Font size" >T↕</TB>
            <div style={{ width: 1, height: 18, background: '#E5E7EB', margin: '0 4px' }} />
            <TB title="Bold"><b>B</b></TB>
            <TB title="Italic"><i>I</i></TB>
            <TB title="Underline"><u>U</u></TB>
            <div style={{ width: 1, height: 18, background: '#E5E7EB', margin: '0 4px' }} />
            <TB title="Align">≡</TB>
            <TB title="Align center">☰</TB>
            <div style={{ width: 1, height: 18, background: '#E5E7EB', margin: '0 4px' }} />
            <TB title="Bullet list">•≡</TB>
            <TB title="Ordered list">1≡</TB>
            <TB title="Indent">→</TB>
            <TB title="Outdent">←</TB>
            <div style={{ width: 1, height: 18, background: '#E5E7EB', margin: '0 4px' }} />
            <TB title="Quote">❝</TB>
            <TB title="Strikethrough"><s>S</s></TB>

            {/* Right side: Send button */}
            <div style={{ marginLeft: 'auto' }}>
              <button
                className="btn-green"
                disabled={loading}
                onClick={() => handleSend()}
                style={{ height: 36, padding: '0 20px', fontSize: 13 }}
              >
                {loading ? 'Sending...' : 'Send'}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};
