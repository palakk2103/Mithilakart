import SearchInput from '../../../../shared/components/SearchInput';
import React, { useState, useEffect } from 'react';
import { auditApi } from '../../services/api';
import { extractList, mapAuditLog, mapLoginHistory } from '../../utils/mappers';
import { 
  Terminal, Search, Filter, Calendar, 
  Download, Clock, Shield, Key, 
  Database, UserCheck, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pagination } from '../../components/ui';

const AuditLogs = () => {
  const [activeTab, setActiveTab] = useState('Activity');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loginLogs, setLoginLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const itemsPerPage = 10;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [logsRes, loginRes] = await Promise.all([
        auditApi.getLogs(),
        auditApi.getLoginHistory(),
      ]);
      if (cancelled) return;
      if (logsRes.error && loginRes.error) setError(logsRes.error);
      else setError(null);
      if (logsRes.data) setActivityLogs(extractList(logsRes.data).map(mapAuditLog));
      if (loginRes.data) setLoginLogs(extractList(loginRes.data).map(mapLoginHistory));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const logs = activeTab === 'Activity' ? activityLogs : loginLogs;

  const filteredLogs = logs.filter(log => {
    const q = searchQuery.toLowerCase();
    if (activeTab === 'Activity') {
      return log.admin.toLowerCase().includes(q) || 
             log.action.toLowerCase().includes(q) || 
             log.target.toLowerCase().includes(q) ||
             log.ip.includes(q);
    } else {
      return log.admin.toLowerCase().includes(q) || 
             log.ip.includes(q) || 
             log.device.toLowerCase().includes(q) || 
             log.location.toLowerCase().includes(q);
    }
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getLogIcon = (type) => {
    switch (type) {
      case 'auth': return <Key size={14} className="text-blue-500" />;
      case 'user': return <UserCheck size={14} className="text-green-500" />;
      case 'product': return <Database size={14} className="text-indigo-500" />;
      case 'settings': return <Shield size={14} className="text-purple-500" />;
      default: return <Clock size={14} className="text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-semibold text-slate-900 tracking-tight font-montserrat uppercase">Audit Logs</h1>
          <p className="text-slate-500 font-medium mt-1 font-raleway">Monitor administrator activities, security events, and login history.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm">
          <Download size={16} />
          Export Logs
        </button>
      </div>

      {/* Tabs / Filters Panel */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 space-y-4">
          <div className="flex gap-2">
            {['Activity', 'Logins'].map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setCurrentPage(1); setSearchQuery(''); }}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab 
                  ? 'bg-slate-900 text-white shadow-lg' 
                  : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                }`}
              >
                {tab === 'Activity' ? 'Admin Actions' : 'Login History'}
              </button>
            ))}
          </div>

          <div className="flex gap-4">
            <SearchInput 
              type="text" 
              placeholder="Search audit trail..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        {/* Content Table */}
        <div className="overflow-x-auto">
          {activeTab === 'Activity' ? (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Administrator</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Target Resource</th>
                  <th className="px-6 py-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                <AnimatePresence>
                  {paginatedLogs.map((log) => (
                    <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 text-[11px] font-bold text-slate-500">{log.timestamp}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{log.admin}</td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-2 font-semibold text-slate-700">
                          <span className="p-1 bg-slate-100 rounded">
                            {getLogIcon(log.type)}
                          </span>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">{log.target}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{log.ip}</td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Administrator</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Browser / Device</th>
                  <th className="px-6 py-4">IP Address</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                <AnimatePresence>
                  {paginatedLogs.map((log) => (
                    <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 text-[11px] font-bold text-slate-500">{log.timestamp}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{log.admin}</td>
                      <td className="px-6 py-4 font-bold text-slate-600">{log.location}</td>
                      <td className="px-6 py-4 text-xs text-slate-600">{log.device}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{log.ip}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${
                          log.status === 'Success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {paginatedLogs.length > 0 && (
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredLogs.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
