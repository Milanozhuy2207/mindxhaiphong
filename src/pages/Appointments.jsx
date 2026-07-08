import { Clock, Plus, Edit, Trash, Calendar, CheckCircle, XCircle } from 'lucide-react';
import './Students.css'; // Reusing styles
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { logActivity } from '../utils/activityUtils';
import { useAuth } from '../contexts/AuthContext';
import RoleGuard from '../components/RoleGuard';

export default function Appointments({ isEmbedded = false, filterType = null }) {
  const { userRole } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    student: '',
    phone: '',
    type: 'Demo',
    date: new Date().toLocaleDateString('vi-VN'),
    time: '18:00',
    teacher: '',
    status: 'Chờ xác nhận'
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "appointments"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        dbId: doc.id,
        ...doc.data(),
      }));
      data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setAppointments(data);
      setLoading(false);
    }, (error) => {
      console.error(error);
      toast.error("Lỗi khi tải dữ liệu lịch hẹn");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddOrEdit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingId) {
        const docRef = doc(db, "appointments", editingId);
        await updateDoc(docRef, formData);
        setAppointments(prev => prev.map(item => item.dbId === editingId ? { ...item, ...formData } : item));
        toast.success("Cập nhật lịch thành công");
        await logActivity('appointment', 'Cập nhật Lịch', `Lịch ${formData.type} của ${formData.student} đã được cập nhật.`, 'info');
      } else {
        const newAppointment = { ...formData, createdAt: new Date().getTime() };
        const docRef = await addDoc(collection(db, "appointments"), newAppointment);
        setAppointments(prev => [{ dbId: docRef.id, ...newAppointment }, ...prev]);
        toast.success("Tạo lịch thành công");
        await logActivity('appointment', 'Lịch mới', `Đã tạo lịch ${formData.type} cho ${formData.student}.`, 'primary');
      }
      closeModal();
    } catch (err) {
      console.error(err);
      toast.error(editingId ? "Cập nhật lịch thất bại" : "Tạo lịch thất bại");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (item) => {
    setFormData({
      student: item.student || '',
      phone: item.phone || '',
      type: item.type || 'Demo',
      date: item.date || '',
      time: item.time || '',
      teacher: item.teacher || '',
      status: item.status || 'Chờ xác nhận'
    });
    setEditingId(item.dbId);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setFormData({
      student: '',
      phone: '',
      type: filterType || 'Demo',
      date: new Date().toLocaleDateString('vi-VN'),
      time: '18:00',
      teacher: '',
      status: 'Chờ xác nhận'
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleDelete = async (dbId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa lịch này?")) return;
    try {
      const item = appointments.find(a => a.dbId === dbId);
      const studentName = item?.student || 'Không rõ';
      const docRef = doc(db, "appointments", dbId);
      await deleteDoc(docRef);
      setAppointments(prev => prev.filter(a => a.dbId !== dbId));
      toast.success("Xóa lịch thành công");
      await logActivity('appointment', 'Xóa Lịch', `Lịch của ${studentName} đã bị xóa.`, 'danger');
    } catch (err) {
      console.error(err);
      toast.error("Xóa lịch thất bại");
    }
  };

  const demoCount = appointments.filter(a => a.type === 'Demo').length;
  const makeupCount = appointments.filter(a => a.type === 'Học bù').length;
  const completedCount = appointments.filter(a => a.status === 'Đã hoàn thành').length;

  const filteredAppointments = filterType
    ? appointments.filter(a => filterType === 'Khác' ? !['Demo', 'Học bù'].includes(a.type) : a.type === filterType)
    : appointments;

  return (
    <div className={isEmbedded ? "" : "page-container"}>
      {!isEmbedded && (
        <div className="page-header">
          <div>
            <h1 className="page-title">Lịch Demo & Học Bù</h1>
            <p className="page-subtitle">Quản lý các lịch học 1 kèm 1, test đầu vào và học bù</p>
          </div>
          <RoleGuard allowedRoles={['super_admin', 'admin', 'CM', 'CS', 'OPS']}>
            <button className="btn btn-primary" onClick={openAddModal}>
              <Plus size={18} />
              Tạo Lịch
            </button>
          </RoleGuard>
        </div>
      )}

      {isEmbedded && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <RoleGuard allowedRoles={['super_admin', 'admin', 'CM', 'CS', 'OPS']}>
            <button className="btn btn-primary" onClick={openAddModal}>
              <Plus size={18} />
              Tạo Lịch {filterType === 'Khác' ? 'Hẹn Khác' : filterType || 'Hẹn Mới'}
            </button>
          </RoleGuard>
        </div>
      )}

      {!filterType && (
        <div className="stats-grid" style={{ marginBottom: '1rem' }}>
          <div className="stat-card glass" style={{ borderLeft: '4px solid var(--primary)' }}>
            <div className="stat-info">
              <h3 className="stat-title">Lịch Demo</h3>
              <div className="stat-value">{demoCount}</div>
            </div>
            <Calendar size={32} style={{ color: 'var(--primary)', opacity: 0.2, marginLeft: 'auto' }} />
          </div>
          <div className="stat-card glass" style={{ borderLeft: '4px solid var(--warning)' }}>
            <div className="stat-info">
              <h3 className="stat-title">Lịch Học bù</h3>
              <div className="stat-value">{makeupCount}</div>
            </div>
            <Clock size={32} style={{ color: 'var(--warning)', opacity: 0.2, marginLeft: 'auto' }} />
          </div>
          <div className="stat-card glass" style={{ borderLeft: '4px solid var(--success)' }}>
            <div className="stat-info">
              <h3 className="stat-title">Đã hoàn thành</h3>
              <div className="stat-value">{completedCount}</div>
            </div>
            <CheckCircle size={32} style={{ color: 'var(--success)', opacity: 0.2, marginLeft: 'auto' }} />
          </div>
        </div>
      )}

      <div className="card glass">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Học viên</th>
                <th>Liên hệ</th>
                <th>Phân loại</th>
                <th>Thời gian</th>
                <th>Giảng viên</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Đang tải dữ liệu...</td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Không có lịch nào</td>
                </tr>
              ) : (
                filteredAppointments.map(item => (
                  <tr key={item.dbId}>
                    <td><strong>{item.student}</strong></td>
                    <td>{item.phone || '-'}</td>
                    <td>
                      <span style={{
                        fontWeight: 600,
                        color: item.type === 'Demo' ? 'var(--primary)' : item.type === 'Học bù' ? 'var(--warning)' : 'var(--info)'
                      }}>
                        {item.type}
                      </span>
                    </td>
                    <td>
                      <div>{item.time}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.date}</div>
                    </td>
                    <td>{item.teacher || '-'}</td>
                    <td>
                      <span className={`status-badge status-${item.status === 'Đã hoàn thành' ? 'success' : item.status === 'Đã hủy' ? 'danger' : item.status === 'Đã lên lịch' ? 'info' : 'warning'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <RoleGuard allowedRoles={['super_admin', 'admin', 'CM', 'CS', 'OPS']}>
                          <button className="btn-icon" title="Chỉnh sửa" onClick={() => openEditModal(item)}><Edit size={16} /></button>
                          <button className="btn-icon text-danger" title="Xóa" onClick={() => handleDelete(item.dbId)}><Trash size={16} /></button>
                        </RoleGuard>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <div className="modal-header">
              <h2>{editingId ? 'Cập nhật Lịch' : 'Tạo Lịch Mới'}</h2>
              <button className="btn-close" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleAddOrEdit} className="modal-form">
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Tên học viên</label>
                  <input type="text" name="student" required value={formData.student} onChange={handleChange} placeholder="Nguyễn Văn A" />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Số điện thoại</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="0987..." />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1, display: filterType && filterType !== 'Khác' ? 'none' : 'block' }}>
                  <label>Phân loại</label>
                  <select name="type" value={formData.type} onChange={handleChange}>
                    <option value="Demo">Demo</option>
                    <option value="Học bù">Học bù</option>
                    <option value="Test đầu vào">Test đầu vào</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Giảng viên phụ trách</label>
                  <input type="text" name="teacher" value={formData.teacher} onChange={handleChange} placeholder="Tên giảng viên..." />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Ngày học</label>
                  <input type="text" name="date" required value={formData.date} onChange={handleChange} placeholder="DD/MM/YYYY" />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Giờ học</label>
                  <input type="time" name="time" required value={formData.time} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label>Trạng thái</label>
                <select name="status" value={formData.status} onChange={handleChange}>
                  <option value="Chờ xác nhận">Chờ xác nhận</option>
                  <option value="Đã lên lịch">Đã lên lịch</option>
                  <option value="Đã hoàn thành">Đã hoàn thành</option>
                  <option value="Đã hủy">Đã hủy</option>
                </select>
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Đang lưu...' : 'Lưu Lịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
