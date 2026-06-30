import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { ProtectedRoute } from './components/ProtectedRoute';
import { 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  TrendingUp,
  Inbox,
  Filter,
  Zap,
  Play
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, isPositive, icon }) => {
  return (
    <div className="glass rounded-2xl p-5 border border-white/5 relative overflow-hidden transition-all duration-300 hover:border-white/10 hover:shadow-xl hover:translate-y-[-2px]">
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs font-medium text-gray-400">{title}</span>
        <div className="p-2 rounded-xl bg-white/5 text-indigo-400">
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-white">{value}</span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
          isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
        }`}>
          {change}
        </span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
    </div>
  );
};

// Extracted Dashboard Component to protect via ProtectedRoute
const DashboardContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('inbox');

  const metrics = [
    { title: 'Total Ingested', value: '1,284', change: '+12%', isPositive: true, icon: <Inbox size={18} /> },
    { title: 'Urgent Action Required', value: '4', change: '-25%', isPositive: true, icon: <ShieldAlert size={18} className="text-amber-400 animate-pulse" /> },
    { title: 'Auto-resolved / Closed', value: '84%', change: '+3.5%', isPositive: true, icon: <CheckCircle2 size={18} className="text-emerald-400" /> },
    { title: 'Average Action Time', value: '1.2m', change: '-12%', isPositive: true, icon: <Clock size={18} /> },
  ];

  const mockEmails = [
    {
      id: '1',
      sender: 'stripe@stripe.com',
      senderName: 'Stripe Recruiting',
      subject: 'Interview Scheduled: Technical Intern SWE',
      summary: 'Invitation for a technical coding interview round. Action required by Friday.',
      category: 'job',
      priority: 88,
      status: 'UNREAD',
      received: '10m ago'
    },
    {
      id: '2',
      sender: 'prof.sharma@university.edu',
      senderName: 'Prof. Sharma (DBMS)',
      subject: 'DBMS Mini-Project Deadline Reminder',
      summary: 'Final submission deadline is tonight at 11:59 PM. No late submissions accepted.',
      category: 'academic',
      priority: 95,
      status: 'UNREAD',
      received: '45m ago'
    },
    {
      id: '3',
      sender: 'billing@cloudprovider.com',
      senderName: 'Cloud Infrastructure',
      subject: 'Invoice #INV-2901: Cloud Computing Resources',
      summary: 'Invoice details for active node pools. Auto-debit scheduled.',
      category: 'finance',
      priority: 72,
      status: 'READ',
      received: '2h ago'
    },
    {
      id: '4',
      sender: 'google-auth@google.com',
      senderName: 'Google Account Security',
      subject: 'Verification Code: 894102',
      summary: '2FA authentication request code. Expires in 10 minutes.',
      category: 'otp',
      priority: 98,
      status: 'UNREAD',
      received: '3m ago'
    }
  ];

  const handleComposeAction = () => {
    alert('Compose action triggered (Compose modal will follow in the next steps).');
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      onComposeClick={handleComposeAction}
    >
      <div className="space-y-8 animate-fadeIn">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Workspace Overview <Sparkles size={16} className="text-indigo-400" />
            </h2>
            <p className="text-xs text-gray-400">
              InboxOS has resolved **87** tasks today automatically. Your inbox is clean.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-xs font-semibold rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/5 transition-all">
              Diagnostics
            </button>
            <button className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-all glow-accent">
              <Play size={12} fill="currentColor" />
              <span>Run Pipeline</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {metrics.map((metric, idx) => (
            <MetricCard key={idx} {...metric} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Inbox size={16} className="text-indigo-400" />
                <span>Recent Smart Ingests</span>
              </h3>
              <button className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                View all emails
              </button>
            </div>

            <div className="space-y-3.5">
              {mockEmails.map((email) => (
                <div 
                  key={email.id}
                  className="glass rounded-2xl p-4 border border-white/5 transition-all hover:border-white/10 hover:bg-white/5 cursor-pointer flex gap-4"
                >
                  <div className="w-1.5 rounded-full bg-indigo-500 shrink-0" style={{
                    backgroundColor: 
                      email.category === 'urgent' || email.priority > 90 ? '#f43f5e' :
                      email.category === 'job' ? '#a855f7' :
                      email.category === 'finance' ? '#10b981' :
                      email.category === 'otp' ? '#f59e0b' : '#6366f1'
                  }} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-bold text-gray-200 truncate">{email.senderName}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-gray-400">{email.received}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-extrabold ${
                          email.priority > 90 
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                            : 'bg-white/5 text-gray-400'
                        }`}>
                          Score: {email.priority}
                        </span>
                      </div>
                    </div>
                    
                    <h4 className="text-xs font-semibold text-gray-100 mb-1 truncate">{email.subject}</h4>
                    <p className="text-[11px] text-gray-400 leading-normal line-clamp-2">{email.summary}</p>
                    
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5">
                        {email.category}
                      </span>
                      {email.status === 'UNREAD' && (
                        <span className="text-[9px] font-semibold bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">
                          Unresolved
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 px-2">
                <Filter size={16} className="text-indigo-400" />
                <span>Active Routing Rules</span>
              </h3>

              <div className="glass rounded-2xl p-4 border border-white/5 space-y-3.5">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-amber-400" />
                    <div>
                      <p className="text-xs font-semibold text-gray-200">OTP Auto-Extract</p>
                      <p className="text-[9px] text-gray-500">Fast-path codes to clipboard</p>
                    </div>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Active
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-indigo-400" />
                    <div>
                      <p className="text-xs font-semibold text-gray-200">Finance Alert Channel</p>
                      <p className="text-[9px] text-gray-500">Route invoices to WhatsApp</p>
                    </div>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Active
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-gray-400" />
                    <div>
                      <p className="text-xs font-semibold text-gray-200">Newsletter Digest</p>
                      <p className="text-[9px] text-gray-500">Compile weekly updates</p>
                    </div>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Active
                  </span>
                </div>

                <button className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-indigo-400 border border-white/5 transition-all text-center block">
                  Manage Rules DSL
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 px-2">
                <TrendingUp size={16} className="text-indigo-400" />
                <span>Decision Pipeline Load</span>
              </h3>

              <div className="glass rounded-2xl p-5 border border-white/5 space-y-4">
                <div className="h-16 flex items-end gap-1.5">
                  {[45, 60, 30, 80, 65, 95, 40, 50, 75, 90, 85, 30, 45, 60, 85, 95, 70, 55, 60, 90].map((h, i) => (
                    <div 
                      key={i} 
                      className="flex-1 bg-indigo-500/30 rounded-t transition-all hover:bg-indigo-500" 
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center text-[10px] text-gray-500 border-t border-white/5 pt-3">
                  <span>12 AM</span>
                  <span>12 PM</span>
                  <span>11 PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegisterForm />} />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <DashboardContent />
          </ProtectedRoute>
        } 
      />
      {/* Fallback to dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
