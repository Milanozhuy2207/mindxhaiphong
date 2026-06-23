import { Users, BookOpen, Clock, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import './Dashboard.css';

const stats = [
  { id: 1, title: 'Tổng học viên', value: '1,248', icon: Users, color: 'var(--info)', trend: '+12% tháng này' },
  { id: 2, title: 'Lớp đang mở', value: '42', icon: BookOpen, color: 'var(--primary)', trend: '+3 lớp mới' },
  { id: 3, title: 'Ticket cần xử lý', value: '18', icon: AlertCircle, color: 'var(--warning)', trend: '5 khẩn cấp' },
  { id: 4, title: 'Tỷ lệ đi học', value: '94%', icon: TrendingUp, color: 'var(--success)', trend: '+2% so với tuần trước' },
];

const recentTickets = [
  { id: 'TK001', student: 'Nguyễn Văn A', type: 'Xin nghỉ phép', status: 'Mới', time: '10 phút trước' },
  { id: 'TK002', student: 'Trần Thị B', type: 'Bảo lưu khóa học', status: 'Đang xử lý', time: '1 giờ trước' },
  { id: 'TK003', student: 'Lê Hoàng C', type: 'Phản hồi giáo viên', status: 'Hoàn thành', time: 'Hôm qua' },
];

export default function Dashboard() {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Tổng quan (Dashboard)</h1>
          <p className="page-subtitle">Chào buổi sáng, chúc bạn một ngày làm việc hiệu quả!</p>
        </div>
        <button className="btn btn-primary">
          Tạo báo cáo
        </button>
      </div>

      <div className="stats-grid">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.id} className="stat-card glass">
              <div className="stat-icon-wrapper" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                <Icon size={24} />
              </div>
              <div className="stat-info">
                <h3 className="stat-title">{stat.title}</h3>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-trend">{stat.trend}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-content">
        <div className="main-panel glass">
          <div className="panel-header">
            <h2>Hoạt động gần đây</h2>
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
                <p><strong>Phụ huynh bé Nam (Scratch-02)</strong> yêu cầu gọi lại để tư vấn lộ trình.</p>
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
            {recentTickets.map(ticket => (
              <div key={ticket.id} className="ticket-item">
                <div className="ticket-info">
                  <h4>{ticket.student}</h4>
                  <p>{ticket.type}</p>
                </div>
                <div className={`ticket-status status-${ticket.status === 'Mới' ? 'new' : ticket.status === 'Đang xử lý' ? 'processing' : 'done'}`}>
                  {ticket.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
