import { Users, BookOpen, Clock, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import './Dashboard.css';
import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../config/firebase';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    pendingTickets: 0
  });
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const unsubStudents = onSnapshot(collection(db, "students"), (snap) => {
      setStats(prev => ({ ...prev, totalStudents: snap.docs.length }));
    });

    const unsubClasses = onSnapshot(collection(db, "classes"), (snap) => {
      setStats(prev => ({ ...prev, totalClasses: snap.docs.length }));
    });

    const unsubTickets = onSnapshot(collection(db, "tickets"), (snap) => {
      const ticketsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const pendingTks = ticketsData.filter(t => t.status !== 'Hoàn thành').length;
      setStats(prev => ({ ...prev, pendingTickets: pendingTks }));
      
      // Mocking order by slicing, should ideally sort by createdAt if available
      ticketsData.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setRecentTickets(ticketsData.slice(0, 3));
      
      setLoading(false);
    }, (error) => {
      console.error("Error fetching tickets:", error);
      setLoading(false);
    });

    return () => {
      unsubStudents();
      unsubClasses();
      unsubTickets();
    };
  }, []);

  const displayStats = [
    { id: 1, title: 'Tổng học viên', value: stats.totalStudents, icon: Users, color: 'var(--info)', trend: 'Cập nhật thời gian thực' },
    { id: 2, title: 'Lớp đang mở', value: stats.totalClasses, icon: BookOpen, color: 'var(--primary)', trend: 'Cập nhật thời gian thực' },
    { id: 3, title: 'Ticket cần xử lý', value: stats.pendingTickets, icon: AlertCircle, color: 'var(--warning)', trend: 'Từ phản hồi học viên' },
    { id: 4, title: 'Tỷ lệ đi học', value: '94%', icon: TrendingUp, color: 'var(--success)', trend: 'Dữ liệu ước tính' },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Tổng quan (Dashboard)</h1>
          <p className="page-subtitle">Chào buổi sáng, chúc bạn một ngày làm việc hiệu quả!</p>
        </div>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Làm mới dữ liệu
        </button>
      </div>

      <div className="stats-grid">
        {displayStats.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.id} className="stat-card glass">
              <div className="stat-icon-wrapper" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                <Icon size={24} />
              </div>
              <div className="stat-info">
                <h3 className="stat-title">{stat.title}</h3>
                <div className="stat-value">{loading ? '...' : stat.value}</div>
                <div className="stat-trend">{stat.trend}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-content">
        <div className="main-panel glass">
          <div className="panel-header">
            <h2>Hoạt động gần đây (Minh họa)</h2>
            <button className="btn btn-ghost">Xem tất cả</button>
          </div>
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-icon bg-primary-light text-primary"><CheckCircle2 size={16}/></div>
              <div className="timeline-content">
                <p><strong>Lớp Python Cơ Bản (PT-01)</strong> đã hoàn thành khóa học.</p>
                <span className="time">2 giờ trước</span>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-icon bg-warning-light text-warning"><AlertCircle size={16}/></div>
              <div className="timeline-content">
                <p><strong>Hệ thống</strong> ghi nhận có ticket mới cần xử lý.</p>
                <span className="time">4 giờ trước</span>
              </div>
            </div>
          </div>
        </div>

        <div className="side-panel glass">
          <div className="panel-header">
            <h2>Tickets ưu tiên</h2>
          </div>
          <div className="ticket-list">
            {loading ? (
               <div style={{ padding: '1rem', textAlign: 'center' }}>Đang tải...</div>
            ) : recentTickets.length === 0 ? (
               <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>Không có ticket nào</div>
            ) : (
              recentTickets.map(ticket => (
                <div key={ticket.id} className="ticket-item">
                  <div className="ticket-info">
                    <h4>{ticket.student || ticket.id}</h4>
                    <p>{ticket.type}</p>
                  </div>
                  <div className={`ticket-status status-${ticket.status === 'Mới' ? 'new' : ticket.status === 'Đang xử lý' ? 'processing' : 'done'}`}>
                    {ticket.status}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
