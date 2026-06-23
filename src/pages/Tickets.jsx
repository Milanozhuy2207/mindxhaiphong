import { MessageSquare, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import './Students.css'; // Reusing styles

export default function Tickets() {
  // TODO: Implement state and logic for Tickets
  const dummyTickets = [
    { id: 'TK001', student: 'Nguyễn Văn A', class: 'Python Basic', type: 'Xin nghỉ phép', status: 'Mới', date: '23/06/2026', priority: 'Thường' },
    { id: 'TK002', student: 'Trần Thị B', class: 'Scratch', type: 'Bảo lưu', status: 'Đang xử lý', date: '22/06/2026', priority: 'Cao' },
    { id: 'TK003', student: 'Phụ huynh C', class: 'Web', type: 'Phản hồi GV', status: 'Mới', date: '23/06/2026', priority: 'Khẩn cấp' },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hỗ trợ (Tickets)</h1>
          <p className="page-subtitle">Quản lý các yêu cầu, phản hồi từ học viên và phụ huynh</p>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '1rem' }}>
        <div className="stat-card glass" style={{ borderLeft: '4px solid var(--info)' }}>
          <div className="stat-info">
            <h3 className="stat-title">Ticket mới</h3>
            <div className="stat-value">8</div>
          </div>
          <MessageSquare size={32} style={{ color: 'var(--info)', opacity: 0.2, marginLeft: 'auto' }} />
        </div>
        <div className="stat-card glass" style={{ borderLeft: '4px solid var(--warning)' }}>
          <div className="stat-info">
            <h3 className="stat-title">Đang xử lý</h3>
            <div className="stat-value">5</div>
          </div>
          <Clock size={32} style={{ color: 'var(--warning)', opacity: 0.2, marginLeft: 'auto' }} />
        </div>
        <div className="stat-card glass" style={{ borderLeft: '4px solid var(--success)' }}>
          <div className="stat-info">
            <h3 className="stat-title">Đã giải quyết (tuần)</h3>
            <div className="stat-value">24</div>
          </div>
          <CheckCircle size={32} style={{ color: 'var(--success)', opacity: 0.2, marginLeft: 'auto' }} />
        </div>
      </div>

      <div className="card glass">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Mã Ticket</th>
                <th>Người gửi</th>
                <th>Phân loại</th>
                <th>Mức độ</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {dummyTickets.map(ticket => (
                <tr key={ticket.id}>
                  <td><strong>{ticket.id}</strong></td>
                  <td>
                    {ticket.student}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lớp: {ticket.class}</div>
                  </td>
                  <td>{ticket.type}</td>
                  <td>
                    <span style={{ 
                      color: ticket.priority === 'Khẩn cấp' ? 'var(--danger)' : ticket.priority === 'Cao' ? 'var(--warning)' : 'inherit',
                      fontWeight: ticket.priority !== 'Thường' ? 600 : 400
                    }}>
                      {ticket.priority === 'Khẩn cấp' && <AlertTriangle size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }}/>}
                      {ticket.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${ticket.status === 'Mới' ? 'info' : ticket.status === 'Đang xử lý' ? 'warning' : 'success'}`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td>{ticket.date}</td>
                  <td>
                    <button className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8125rem' }}>Xử lý</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
