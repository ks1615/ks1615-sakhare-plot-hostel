import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../services/api';
import { 
  Bell, 
  Plus, 
  Pin, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  Megaphone, 
  AlertTriangle 
} from 'lucide-react';

export default function NoticeManagement() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    is_pinned: false
  });

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    try {
      setLoading(true);
      const data = await fetchApi('/notices');
      setNotices(data.notices || []);
    } catch (err) {
      console.error('Failed loading notices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    try {
      await fetchApi('/notices', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setShowAddModal(false);
      resetForm();
      loadNotices();
    } catch (err) {
      alert('Error posting notice: ' + err.message);
    }
  };

  const handleUpdateNotice = async (e) => {
    e.preventDefault();
    if (!editingNotice) return;
    try {
      await fetchApi(`/notices/${editingNotice.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      setEditingNotice(null);
      resetForm();
      loadNotices();
    } catch (err) {
      alert('Error updating notice: ' + err.message);
    }
  };

  const togglePin = async (notice) => {
    try {
      await fetchApi(`/notices/${notice.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_pinned: !notice.is_pinned })
      });
      loadNotices();
    } catch (err) {
      alert('Error toggling pin: ' + err.message);
    }
  };

  const handleDeleteNotice = async (id) => {
    if (!window.confirm('Delete this announcement notice?')) return;
    try {
      await fetchApi(`/notices/${id}`, { method: 'DELETE' });
      loadNotices();
    } catch (err) {
      alert('Error deleting notice: ' + err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: 'General',
      is_pinned: false
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-400" /> Hostel Notice Board Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">Post announcements, rules, events, and maintenance alerts for all students.</p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all"
        >
          <Plus className="w-4 h-4" /> Post New Announcement
        </button>
      </div>

      {/* Notice Cards List */}
      {loading ? (
        <div className="p-8 text-center text-slate-500 text-xs">Loading notices...</div>
      ) : notices.length === 0 ? (
        <div className="p-8 text-center text-slate-500 text-xs bg-slate-900/60 rounded-2xl border border-slate-800">
          No notices posted yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className={`p-5 rounded-2xl border transition-all shadow-lg flex flex-col justify-between ${
                notice.is_pinned
                  ? 'bg-gradient-to-br from-indigo-950/80 via-slate-900 to-purple-950/40 border-indigo-500/40'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div>
                
                {/* Header Badge Row */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {notice.is_pinned && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30">
                        <Pin className="w-3 h-3 fill-amber-400" /> Pinned
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-md bg-indigo-950 text-indigo-300 font-bold text-[10px] border border-indigo-800/40 uppercase tracking-wider">
                      {notice.category}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-500">{notice.created_at ? notice.created_at.split(' ')[0] : 'Today'}</p>
                </div>

                <h3 className="text-base font-bold text-white mb-2">{notice.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{notice.content}</p>
              </div>

              {/* Action Bar */}
              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-500">By {notice.created_by || 'Owner Admin'}</span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePin(notice)}
                    className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] border transition-all ${
                      notice.is_pinned
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {notice.is_pinned ? 'Unpin' : 'Pin Notice'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingNotice(notice);
                      setFormData({
                        title: notice.title,
                        content: notice.content,
                        category: notice.category,
                        is_pinned: notice.is_pinned === 1
                      });
                    }}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteNotice(notice.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {(showAddModal || editingNotice) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editingNotice ? 'Edit Announcement' : 'Post New Notice'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingNotice(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingNotice ? handleUpdateNotice : handleCreateNotice} className="space-y-3">
              
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Hostel Gate Timings & Safety Rules"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="General">General</option>
                    <option value="Maintenance">Maintenance Alert</option>
                    <option value="Urgent">Urgent / Important</option>
                    <option value="Rules">Rules & Safety</option>
                    <option value="Event">Event / Celebration</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-slate-950 border border-slate-800 w-full text-slate-300 font-semibold">
                    <input
                      type="checkbox"
                      checked={formData.is_pinned}
                      onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                      className="rounded accent-indigo-600"
                    />
                    <span>Pin to top of board</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Notice Announcement Details</label>
                <textarea
                  rows="5"
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write clear instructions for students..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingNotice(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  {editingNotice ? 'Save Notice' : 'Post Announcement'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
