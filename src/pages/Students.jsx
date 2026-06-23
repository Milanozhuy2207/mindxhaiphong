import { Search, Plus, Filter, Download, Edit, Trash } from 'lucide-react';
import './Students.css';
import { useState } from 'react';
import { toast } from 'react-hot-toast'
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../config/firebase';

export default function Students() {
  // TODO: Nơi bạn sẽ tự implement state và logic kết nối API

  const [searchTerm, setSearchTerm] = useState('')
  const [students, setStudents] = useState([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    classes: '',
    status: 'Đang học'
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const dummyStudents = [
    { id: 'HV001', name: 'Nguyễn Văn A', phone: '0987654321', classes: 'Python Basic', status: 'Đang học' },
    { id: 'HV002', name: 'Trần Thị B', phone: '0912345678', classes: 'Scratch', status: 'Bảo lưu' },
    { id: 'HV003', name: 'Lê Hoàng C', phone: '0909090909', classes: 'Web Fullstack', status: 'Đang học' },
    { id: 'HV004', name: 'Phạm Văn D', phone: '0988888888', classes: 'ReactJS', status: 'Chờ lớp' },
  ];

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const currentData = students.length > 0 ? students : dummyStudents;

  const filteredStudents = currentData.filter(s => {
    const term = searchTerm.toLowerCase();
    const matchName = s.name && s.name.toLowerCase().includes(term);
    const matchPhone = s.phone && s.phone.includes(term);
    const matchClass = s.classes && s.classes.toLowerCase().includes(term);

    return matchName || matchPhone || matchClass;
  });

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await addDoc(collection(db, "students"), formData);
      toast.success("Thêm học viên thành công");
      setIsModalOpen(false);
      setFormData({ name: '', phone: '', classes: '', status: 'Đang học' });
    }
    catch (err) {
      console.error(err);
      toast.error("Thêm học viên thất bại");
    }
    finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    // TODO: Viết logic xóa học viên
    console.log("Delete student", id);
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý Học viên</h1>
          <p className="page-subtitle">Xem danh sách và thông tin chi tiết của học viên</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          Thêm học viên
        </button>
      </div>

      <div className="card glass">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} className="text-muted" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, mã HV, SĐT..."
              onChange={handleSearch}
            />
          </div>
          <div className="toolbar-actions">
            <button className="btn btn-ghost" onClick={() => {/* TODO: Logic Filter */ }}>
              <Filter size={18} />
              Lọc
            </button>
            <button className="btn btn-ghost" onClick={() => {/* TODO: Logic Export */ }}>
              <Download size={18} />
              Xuất file
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Mã HV</th>
                <th>Họ tên</th>
                <th>Số điện thoại</th>
                <th>Lớp đang học</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => (
                <tr key={student.id}>
                  <td><strong>{student.id}</strong></td>
                  <td>{student.name}</td>
                  <td>{student.phone}</td>
                  <td>{student.classes}</td>
                  <td>
                    <span className={`status-badge status-${student.status === 'Đang học' ? 'active' : student.status === 'Bảo lưu' ? 'warning' : 'info'}`}>
                      {student.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon" title="Chỉnh sửa"><Edit size={16} /></button>
                      <button className="btn-icon text-danger" title="Xóa" onClick={() => handleDelete(student.id)}><Trash size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          {/* TODO: Gắn các hàm chuyển trang vào đây */}
          <span className="text-muted">Hiển thị 1-4 trong số 120 học viên</span>
          <div className="page-controls">
            <button className="btn btn-ghost" disabled>Trước</button>
            <button className="btn btn-primary">1</button>
            <button className="btn btn-ghost">2</button>
            <button className="btn btn-ghost">3</button>
            <button className="btn btn-ghost">Sau</button>
          </div>
        </div>
      </div>
      {/* Modal Thêm Học Viên */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <div className="modal-header">
              <h2>Thêm Học Viên Mới</h2>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddStudent} className="modal-form">
              <div className="form-group">
                <label>Họ tên</label>
                <input type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="Nhập họ và tên..." />
              </div>
              <div className="form-group">
                <label>Số điện thoại</label>
                <input type="text" name="phone" required value={formData.phone} onChange={handleChange} placeholder="Nhập số điện thoại..." />
              </div>
              <div className="form-group">
                <label>Lớp đăng ký</label>
                <input type="text" name="classes" required value={formData.classes} onChange={handleChange} placeholder="Ví dụ: Python Basic" />
              </div>
              <div className="form-group">
                <label>Trạng thái</label>
                <select name="status" value={formData.status} onChange={handleChange}>
                  <option value="Đang học">Đang học</option>
                  <option value="Chờ lớp">Chờ lớp</option>
                  <option value="Bảo lưu">Bảo lưu</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Đang lưu...' : 'Lưu học viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
