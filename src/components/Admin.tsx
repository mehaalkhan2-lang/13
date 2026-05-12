import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { Plus, Video, GraduationCap, FileText, Bell, CheckCircle2, AlertCircle, Trash2, Clock, Calendar, User, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'lectures' | 'results' | 'notes' | 'notifications' | 'users'>('lectures');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [lectureData, setLectureData] = useState({ title: '', description: '', videoUrl: '', teacher: '', classLevel: '9th', subject: 'Physics', boardImageUrl: '' });
  const [resultData, setResultData] = useState({ studentName: '', studentEmail: '', subject: 'Physics', marks: '', totalMarks: '', classLevel: '9th' });
  const [noteData, setNoteData] = useState({ title: '', description: '', pdfUrl: '' });
  const [notifData, setNotifData] = useState({ title: '', message: '', type: 'news' });
  const [items, setItems] = useState<any[]>([]);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    let q;
    if (activeTab === 'users') {
      q = query(collection(db, 'users'), orderBy('fullName', 'asc'));
    } else {
      q = query(collection(db, activeTab), orderBy('date', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, activeTab);
    });
    return () => unsubscribe();
  }, [activeTab]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    setDeleteLoading(id);
    try {
      await deleteDoc(doc(db, activeTab, id));
      setStatus({ type: 'success', message: 'Item deleted successfully!' });
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to delete item.' });
      handleFirestoreError(error, OperationType.DELETE, `${activeTab}/${id}`);
    } finally {
      setDeleteLoading(null);
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const resetForms = () => {
    setLectureData({ title: '', description: '', videoUrl: '', teacher: '', classLevel: '9th', subject: 'Physics', boardImageUrl: '' });
    setResultData({ studentName: '', studentEmail: '', subject: 'Physics', marks: '', totalMarks: '', classLevel: '9th' });
    setNoteData({ title: '', description: '', pdfUrl: '' });
    setNotifData({ title: '', message: '', type: 'news' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      let collectionName = '';
      let data: any = {};

      switch (activeTab) {
        case 'lectures':
          collectionName = 'lectures';
          data = { ...lectureData, date: serverTimestamp() };
          break;
        case 'results':
          collectionName = 'results';
          data = { 
            ...resultData, 
            marks: Number(resultData.marks), 
            totalMarks: Number(resultData.totalMarks), 
            date: serverTimestamp() 
          };
          break;
        case 'notes':
          collectionName = 'notes';
          data = { ...noteData, date: serverTimestamp() };
          break;
        case 'notifications':
          collectionName = 'notifications';
          data = { ...notifData, date: serverTimestamp() };
          break;
      }

      await addDoc(collection(db, collectionName), data);
      setStatus({ type: 'success', message: `${activeTab.slice(0, -1)} added successfully!` });
      resetForms();
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to add. Please check permissions.' });
      handleFirestoreError(error, OperationType.CREATE, activeTab);
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(null), 5000);
    }
  };

  const tabs = [
    { id: 'lectures', label: 'Topics', icon: Video },
    { id: 'results', label: 'Results', icon: GraduationCap },
    { id: 'notes', label: 'PDF Notes', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'users', label: 'Students', icon: User },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl vibrant-heading mb-2">Instructor Console</h1>
        <p className="text-slate-500 font-medium">Manage coaching portions, student results, and campus alerts.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="space-y-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-4 px-6 py-4 rounded-[24px] transition-all font-bold text-sm ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 border border-indigo-400' 
                    : 'text-slate-500 hover:bg-white hover:text-brand-primary border border-transparent'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Area */}
        <div className="lg:col-span-3">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="vibrant-card !p-10 border-t-8 border-t-brand-primary"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                {activeTab === 'users' ? 'Registered Students' : `Post New ${activeTab.slice(0, -1)}`}
              </h2>
              {status && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${
                    status.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                  }`}
                >
                  {status.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{status.message}</span>
                </motion.div>
              )}
            </div>

            {activeTab !== 'users' ? (
              <form onSubmit={handleSubmit} className="space-y-8">
                {activeTab === 'lectures' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Today's Topic</label>
                        <input 
                          required
                          type="text" 
                          value={lectureData.title}
                          onChange={(e) => setLectureData({...lectureData, title: e.target.value})}
                          placeholder="e.g. Laws of Motion"
                          className="vibrant-input"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Select Class</label>
                        <select 
                          required
                          value={lectureData.classLevel}
                          onChange={(e) => setLectureData({...lectureData, classLevel: e.target.value})}
                          className="vibrant-input cursor-pointer"
                        >
                          <option value="9th">9th Class</option>
                          <option value="10th">10th Class</option>
                          <option value="11th">11th Class</option>
                          <option value="12th">12th Class</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Select Subject</label>
                        <select 
                          required
                          value={lectureData.subject}
                          onChange={(e) => setLectureData({...lectureData, subject: e.target.value})}
                          className="vibrant-input cursor-pointer"
                        >
                          <option value="Physics">Physics</option>
                          <option value="Biology">Biology</option>
                          <option value="Chemistry">Chemistry</option>
                          <option value="Maths">Maths</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Board Picture URL</label>
                        <input 
                          type="url" 
                          value={lectureData.boardImageUrl}
                          onChange={(e) => setLectureData({...lectureData, boardImageUrl: e.target.value})}
                          placeholder="Link to board photo (Google Photos/Drive)"
                          className="vibrant-input"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Instructor</label>
                        <input 
                          type="text" 
                          value={lectureData.teacher}
                          onChange={(e) => setLectureData({...lectureData, teacher: e.target.value})}
                          placeholder="e.g. Dr. Khan"
                          className="vibrant-input"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">YouTube Link (Optional)</label>
                        <input 
                          type="url" 
                          value={lectureData.videoUrl}
                          onChange={(e) => setLectureData({...lectureData, videoUrl: e.target.value})}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="vibrant-input"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Chapter Summary</label>
                      <textarea 
                        rows={3}
                        value={lectureData.description}
                        onChange={(e) => setLectureData({...lectureData, description: e.target.value})}
                        placeholder="High-level overview of the session..."
                        className="vibrant-input resize-none"
                      />
                    </div>
                  </>
                )}

                {activeTab === 'results' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Full Name</label>
                        <input 
                          required
                          type="text" 
                          value={resultData.studentName}
                          onChange={(e) => setResultData({...resultData, studentName: e.target.value})}
                          placeholder="Student's name"
                          className="vibrant-input"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Portal Email</label>
                        <input 
                          required
                          type="email" 
                          value={resultData.studentEmail}
                          onChange={(e) => setResultData({...resultData, studentEmail: e.target.value})}
                          placeholder="verified@email.com"
                          className="vibrant-input"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Select Subject</label>
                        <select 
                          required
                          value={resultData.subject}
                          onChange={(e) => setResultData({...resultData, subject: e.target.value})}
                          className="vibrant-input cursor-pointer"
                        >
                          <option value="Physics">Physics</option>
                          <option value="Biology">Biology</option>
                          <option value="Chemistry">Chemistry</option>
                          <option value="Maths">Maths</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Select Class</label>
                        <select 
                          required
                          value={resultData.classLevel}
                          onChange={(e) => setResultData({...resultData, classLevel: e.target.value})}
                          className="vibrant-input cursor-pointer"
                        >
                          <option value="9th">9th Class</option>
                          <option value="10th">10th Class</option>
                          <option value="11th">11th Class</option>
                          <option value="12th">12th Class</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Obtained Marks</label>
                        <input 
                          required
                          type="number" 
                          value={resultData.marks}
                          onChange={(e) => setResultData({...resultData, marks: e.target.value})}
                          placeholder="0"
                          className="vibrant-input text-center"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Total Marks</label>
                        <input 
                          required
                          type="number" 
                          value={resultData.totalMarks}
                          onChange={(e) => setResultData({...resultData, totalMarks: e.target.value})}
                          placeholder="100"
                          className="vibrant-input text-center"
                        />
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'notes' && (
                  <>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Resource Title</label>
                      <input 
                        required
                        type="text" 
                        value={noteData.title}
                        onChange={(e) => setNoteData({...noteData, title: e.target.value})}
                        placeholder="e.g. Unit 4 Detailed Notes"
                        className="vibrant-input"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Cloud Link (PDF)</label>
                      <input 
                        required
                        type="url" 
                        value={noteData.pdfUrl}
                        onChange={(e) => setNoteData({...noteData, pdfUrl: e.target.value})}
                        placeholder="Public PDF URL"
                        className="vibrant-input"
                      />
                    </div>
                  </>
                )}

                {activeTab === 'notifications' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Notification Title</label>
                        <input 
                          required
                          type="text" 
                          value={notifData.title}
                          onChange={(e) => setNotifData({...notifData, title: e.target.value})}
                          className="vibrant-input"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Alert Category</label>
                        <select 
                          value={notifData.type}
                          onChange={(e) => setNotifData({...notifData, type: e.target.value as any})}
                          className="vibrant-input cursor-pointer"
                        >
                          <option value="news">General News</option>
                          <option value="alert">Urgent Action</option>
                          <option value="update">Portal Update</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Broadcast Message</label>
                      <textarea 
                        required
                        rows={5}
                        value={notifData.message}
                        onChange={(e) => setNotifData({...notifData, message: e.target.value})}
                        placeholder="Type details here for all students..."
                        className="vibrant-input resize-none"
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="vibrant-button w-full py-5 !text-lg !rounded-[24px]"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-6 h-6 mr-2" />
                      <span>Publish Content</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                  <div>
                    <h3 className="text-xl font-black text-indigo-900">Student Directory</h3>
                    <p className="text-xs text-indigo-600 font-bold uppercase tracking-widest mt-1">SCA Karak Enrollment List</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="px-5 py-2 bg-white rounded-2xl shadow-sm border border-indigo-100 flex flex-col items-center">
                      <span className="text-2xl font-black text-indigo-600">{items.length}</span>
                      <span className="text-[8px] font-black text-indigo-300 uppercase">Enrolled</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Existing Content List */}
            <div className="mt-16 pt-10 border-t-2 border-slate-50">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                  {activeTab === 'users' ? 'Managed Directory' : `Manage Existing ${activeTab}`}
                </h3>
                <span className="px-4 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest leading-none">
                  {items.length} Total
                </span>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-bold">No entries found for this category.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div 
                      key={item.id}
                      className="bg-slate-50 border border-slate-100 p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:bg-white hover:border-brand-primary/20 hover:shadow-xl transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-slate-800 truncate">{item.fullName || item.title}</h4>
                          {item.classLevel && (
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded text-[10px] font-black uppercase">{item.classLevel}</span>
                          )}
                          {item.subject && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-black uppercase">{item.subject}</span>
                          )}
                          {item.role === 'admin' && (
                             <span className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded text-[10px] font-black uppercase">Admin</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-400 font-bold">
                          {activeTab === 'users' ? (
                            <span className="flex items-center gap-1">
                               <FileText className="w-3 h-3" />
                               {item.email}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {item.date?.toDate ? item.date.toDate().toLocaleDateString() : 'Just now'}
                            </span>
                          )}
                          {item.studentName && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {item.studentName}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deleteLoading === item.id || (activeTab === 'users' && item.email === 'mehaalkhan.2@gmail.com')}
                        className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-20"
                        title="Delete entry"
                      >
                        {deleteLoading === item.id ? (
                          <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* New Help Guide */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-indigo-900 rounded-3xl p-6 text-white shadow-xl">
              <h3 className="font-black text-lg mb-2 flex items-center gap-2">
                 <span className="w-2 h-2 bg-amber-400 rounded-full" />
                 How to Upload Topics & Board Pics
              </h3>
              <ul className="text-xs text-indigo-100 space-y-2 font-medium">
                <li>• Board Pics: Upload your photo to Google Drive/Photos and paste the "Share" link here.</li>
                <li>• Topics: Select the Subject (Biology, Physics, etc.) for better organization.</li>
                <li>• Video links are now optional if you only want to show board pictures.</li>
              </ul>
            </div>
            <div className="bg-amber-100 rounded-3xl p-6 border-2 border-amber-200">
              <h3 className="font-black text-lg mb-2 text-amber-900 flex items-center gap-2">
                 <span className="w-2 h-2 bg-indigo-600 rounded-full" />
                 Managing Results
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed font-bold">
                When you upload a result, use the student's exact email they use to login. They will automatically see only their own marks in their "Results" tab.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
