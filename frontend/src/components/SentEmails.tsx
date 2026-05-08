import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { MailCheck } from 'lucide-react';

export const SentEmails = () => {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        const res = await axios.get('http://localhost:5000/emails/sent', { withCredentials: true });
        setEmails(res.data);
      } catch (error) {
        console.error('Error fetching sent emails', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEmails();
    const interval = setInterval(fetchEmails, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Sent Emails</h1>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-black/20">
                <th className="px-6 py-4 font-medium text-gray-400">Recipient</th>
                <th className="px-6 py-4 font-medium text-gray-400">Subject</th>
                <th className="px-6 py-4 font-medium text-gray-400">Sent Time</th>
                <th className="px-6 py-4 font-medium text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400">Loading...</td>
                </tr>
              ) : emails.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                    <MailCheck size={40} className="mx-auto mb-4 opacity-20" />
                    <p>No emails sent yet.</p>
                  </td>
                </tr>
              ) : (
                emails.map((email: any) => (
                  <tr key={email.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">{email.recipientEmail}</td>
                    <td className="px-6 py-4 text-gray-300">{email.subject}</td>
                    <td className="px-6 py-4 text-gray-400">
                      {email.sentTime ? format(new Date(email.sentTime), 'MMM dd, yyyy HH:mm') : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        email.status === 'sent' 
                          ? 'bg-green-500/20 text-green-400 border-green-500/20' 
                          : 'bg-red-500/20 text-red-400 border-red-500/20'
                      }`}>
                        {email.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
