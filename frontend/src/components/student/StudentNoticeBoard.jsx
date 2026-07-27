import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../services/api';
import { Bell, Pin, Search } from 'lucide-react';

export default function StudentNoticeBoard() {
  const [notices, setNotices] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/notices');
      setNotices(res.notices || []);
    } catch (err) {
      console.error('Failed loading notices:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotices = notices.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-400" /> Hostel Notice Board
          </h2>
          <p className="text-xs text-slate-400 mt-1">Stay updated with hostel rules, maintenance schedules, and events.</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search announcements..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 text-xs">Loading notice board...</div>
      ) : filteredNotices.length === 0 ? (
        <div className="p-8 text-center text-slate-500 text-xs bg-slate-900/60 rounded-2xl border border-slate-800">
          No notices match your search query.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotices.map((n) => (
            <div
              key={n.id}
              className={`p-5 rounded-2xl border transition-all shadow-lg flex flex-col justify-between ${
                n.is_pinned
                  ? 'bg-gradient-to-br from-indigo-950/80 via-slate-900 to-purple-950/40 border-indigo-500/40'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {n.is_pinned && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30">
                        <Pin className="w-3 h-3 fill-amber-400" /> Pinned Announcement
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-md bg-indigo-950 text-indigo-300 font-bold text-[10px] border border-indigo-800/40 uppercase tracking-wider">
                      {n.category}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-500">{n.created_at ? n.created_at.split(' ')[0] : 'Today'}</span>
                </div>

                <h3 className="text-base font-bold text-white mb-2">{n.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{n.content}</p>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-800/80 text-[11px] text-slate-500">
                Posted by: <strong className="text-slate-400">{n.created_by || 'Owner Admin'}</strong>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
