import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { PlayCircle, Clock, User, ExternalLink, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { downloadFile } from '../lib/downloadUtils';

interface Lecture {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  date: any;
  teacher?: string;
  classLevel: string;
  subject: string;
  boardImageUrl?: string;
}

export default function Lectures({ role }: { role: string | null }) {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState('All');
  const [filterSubject, setFilterSubject] = useState('All');

  useEffect(() => {
    const q = query(collection(db, 'lectures'), orderBy('date', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Lecture[];
      setLectures(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'lectures');
    });

    return () => unsubscribe();
  }, []);

  const filteredLectures = lectures.filter(l => {
    const classMatch = filterClass === 'All' || l.classLevel === filterClass;
    const subjectMatch = filterSubject === 'All' || l.subject === filterSubject;
    return classMatch && subjectMatch;
  });

  if (loading) {
    return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {[1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-200 rounded-2xl" />)}
    </div>;
  }

  return (
    <div>
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl vibrant-heading mb-2">Academic Topics</h1>
          <p className="text-slate-500 font-medium">Browse by subject and class level.</p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <select 
            value={filterClass} 
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-brand-primary/20 outline-none"
          >
            <option value="All">All Classes</option>
            <option value="9th">9th Class</option>
            <option value="10th">10th Class</option>
            <option value="11th">11th Class</option>
            <option value="12th">12th Class</option>
          </select>
          
          <select 
            value={filterSubject} 
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-brand-primary/20 outline-none"
          >
            <option value="All">All Subjects</option>
            <option value="Physics">Physics</option>
            <option value="Biology">Biology</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Maths">Maths</option>
          </select>
        </div>
      </header>

      {filteredLectures.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[32px] border-2 border-dashed border-indigo-100 flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-4xl">📚</div>
          <p className="text-slate-500 font-bold">No topics found for these filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredLectures.map((lecture, index) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              key={lecture.id}
              className="vibrant-card !p-0 overflow-hidden group"
              id={`lecture-${lecture.id}`}
            >
              <div className="aspect-video bg-slate-100 relative overflow-hidden bg-brand-secondary">
                {lecture.boardImageUrl ? (
                   <img 
                    src={lecture.boardImageUrl} 
                    alt="Board View"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : lecture.videoUrl ? (
                  <img 
                    src={`https://img.youtube.com/vi/${getYouTubeID(lecture.videoUrl)}/maxresdefault.jpg`} 
                    alt={lecture.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                    onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl opacity-20">📖</div>
                )}
                
                <div className="absolute inset-0 bg-indigo-900/10 group-hover:bg-indigo-900/40 transition-colors flex items-center justify-center">
                  {lecture.videoUrl && (
                    <div className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                      <PlayCircle className="w-10 h-10 text-brand-primary" />
                    </div>
                  )}
                  {lecture.boardImageUrl && !lecture.videoUrl && (
                    <div className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                      <ExternalLink className="w-8 h-8 text-brand-primary" />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-8">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-brand-primary text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md">
                    {lecture.classLevel}
                  </span>
                  <span className="px-3 py-1 bg-amber-400 text-amber-950 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">
                    {lecture.subject}
                  </span>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
                    {lecture.date?.toDate ? lecture.date.toDate().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today'}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-3 line-clamp-1">
                  <span className="text-brand-primary block text-xs uppercase tracking-tighter mb-1">Today's Topic:</span>
                  {lecture.title}
                </h3>
                
                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600">
                      {lecture.teacher?.charAt(0) || 'S'}
                    </div>
                    <span className="text-xs font-bold text-slate-400">{lecture.teacher || 'SCA Faculty'}</span>
                  </div>
                  
                  {lecture.videoUrl ? (
                    <a 
                      href={lecture.videoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="vibrant-button !py-2 !px-4 !text-xs"
                    >
                      Watch Now
                    </a>
                  ) : lecture.boardImageUrl ? (
                    <div className="flex gap-2">
                       <button 
                        onClick={() => downloadFile(lecture.boardImageUrl!, `${lecture.title.replace(/\s+/g, '_')}_board.jpg`)}
                        className="p-2 bg-indigo-50 text-brand-primary rounded-lg hover:bg-brand-primary hover:text-white transition-all shadow-sm"
                        title="Download Board Picture"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <a 
                        href={lecture.boardImageUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="vibrant-button !py-2 !px-4 !text-xs bg-emerald-600 shadow-emerald-100"
                      >
                        View Board
                      </a>
                    </div>
                  ) : null}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function getYouTubeID(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}
