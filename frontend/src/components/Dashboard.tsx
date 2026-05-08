import React, { useState } from 'react';
import Papa from 'papaparse';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Upload, Send } from 'lucide-react';

export const Dashboard = () => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [csvData, setCsvData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Settings
  const [startTime, setStartTime] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          // Assuming CSV has a column named "email" or we just grab the first column
          const parsed = results.data.filter((row: any) => row.email || Object.values(row)[0]);
          setCsvData(parsed);
          toast.success(`Loaded ${parsed.length} emails from CSV`);
        },
        error: () => toast.error('Failed to parse CSV')
      });
    }
  };

  const handleSchedule = async () => {
    if (!subject || !body || csvData.length === 0) {
      toast.error('Please fill all fields and upload a CSV');
      return;
    }

    setLoading(true);
    try {
      const emails = csvData.map((row: any) => {
        const to = row.email || Object.values(row)[0];
        // We can replace variables in body if needed, e.g. {{name}}
        let personalizedBody = body;
        Object.keys(row).forEach(key => {
          personalizedBody = personalizedBody.replace(new RegExp(`{{${key}}}`, 'g'), row[key]);
        });
        return {
          to,
          subject,
          body: personalizedBody,
          scheduledTime: startTime ? new Date(startTime).toISOString() : new Date().toISOString()
        };
      });

      await axios.post('http://localhost:5000/emails/schedule', { emails }, { withCredentials: true });
      toast.success('Emails scheduled successfully!');
      
      // Reset form
      setSubject('');
      setBody('');
      setCsvData([]);
      setStartTime('');
    } catch (error) {
      toast.error('Failed to schedule emails');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Compose Campaign</h1>
      </div>

      <div className="glass-panel rounded-2xl p-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Subject</label>
          <input 
            type="text" 
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-white"
            placeholder="E.g. Invitation to an exclusive event"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Email Body (Use {"{{column_name}}"} for variables)</label>
          <textarea 
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-white resize-none"
            placeholder="Hi {{name}},\n\nWe would love to invite you..."
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Upload Recipients (CSV)</label>
            <div className="relative">
              <input 
                type="file" 
                accept=".csv"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="w-full bg-black/20 border border-white/10 border-dashed rounded-xl px-4 py-3 flex items-center justify-center space-x-2 text-gray-400 hover:text-white hover:border-white/30 transition-all">
                <Upload size={18} />
                <span>{csvData.length > 0 ? `${csvData.length} recipients loaded` : 'Click to upload CSV'}</span>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Start Time (Optional)</label>
            <input 
              type="datetime-local" 
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-white custom-datetime-input"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button 
            onClick={handleSchedule}
            disabled={loading}
            className="bg-primary hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-medium transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            <Send size={18} />
            <span>{loading ? 'Scheduling...' : 'Schedule Campaign'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
