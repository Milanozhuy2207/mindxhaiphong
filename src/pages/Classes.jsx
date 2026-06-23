import { Plus, Users, BookOpen } from 'lucide-react';
import './Students.css'; // Reusing some table styles from Students
import { useState } from 'react';
import { toast } from 'react-hot-toast'

export default function Classes() {
  // TODO: Implement state and logic for Classes

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const dummyClasses = [
    { id: 'C001', name: 'Python Basic 01', teacher: 'Lê Văn T', students: 12, max: 15, schedule: 'T3, T5 - 18h00' },
    { id: 'C002', name: 'Scratch Kids', teacher: 'Trần Thị N', students: 10, max: 10, schedule: 'T7, CN - 09h00' },
    { id: 'C003', name: 'Web Fullstack', teacher: 'Nguyễn Văn P', students: 8, max: 12, schedule: 'T2, T4 - 19h30' },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý Lớp học</h1>
          <p className="page-subtitle">Quản lý các lớp đang hoạt động và sắp khai giảng</p>
        </div>
        <button className="btn btn-primary" onClick={() => {/* TODO: Logic thêm lớp */ }}>
          <Plus size={18} />
          Mở lớp mới
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: '1rem' }}>
        <div className="stat-card glass">
          <div className="stat-info">
            <h3 className="stat-title">Lớp đang mở</h3>
            <div className="stat-value">42</div>
          </div>
          <BookOpen size={32} style={{ color: 'var(--primary)', opacity: 0.2, marginLeft: 'auto' }} />
        </div>
        <div className="stat-card glass">
          <div className="stat-info">
            <h3 className="stat-title">Sĩ số trung bình</h3>
            <div className="stat-value">11.5</div>
          </div>
          <Users size={32} style={{ color: 'var(--info)', opacity: 0.2, marginLeft: 'auto' }} />
        </div>
      </div>

      <div className="card glass">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Mã Lớp</th>
                <th>Tên Lớp</th>
                <th>Giảng viên</th>
                <th>Lịch học</th>
                <th>Sĩ số</th>
                <th>Tình trạng</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {dummyClasses.map(cls => (
                <tr key={cls.id}>
                  <td><strong>{cls.id}</strong></td>
                  <td>{cls.name}</td>
                  <td>{cls.teacher}</td>
                  <td>{cls.schedule}</td>
                  <td>{cls.students}/{cls.max}</td>
                  <td>
                    <span className={`status-badge status-${cls.students >= cls.max ? 'warning' : 'active'}`}>
                      {cls.students >= cls.max ? 'Đã đầy' : 'Đang tuyển'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-ghost" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8125rem' }}>Chi tiết</button>
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
