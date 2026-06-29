import { Plus, Users, BookOpen, Edit, Trash } from 'lucide-react';
import './Students.css'; // Reusing some table styles from Students
import RoleGuard from '../components/RoleGuard';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast'
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '../config/firebase';

export default function Classes() {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    teacher: '',
    students: 0,
    max: 15,
    schedule: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'students' || name === 'max' ? Number(value) : value
    });
  };

  useEffect(() => {
    setLoading(true)
    const unsubscribe = onSnapshot(collection(db, "classes"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        dbId: doc.id,
        ...doc.data(),
      }))
      data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setClasses(data)
      setLoading(false)
    }, (error) => {
      console.log(error)
      toast.error("Lỗi khi tải dữ liệu lớp học")
      setLoading(false)
    });

    return () => unsubscribe();
  }, [])

  const handleAddOrEditClass = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingId) {
        const docRef = doc(db, "classes", editingId);
        await updateDoc(docRef, formData);
        setClasses(prev => prev.map(c => c.dbId === editingId ? { ...c, ...formData } : c));
        toast.success("Cập nhật lớp học thành công");
      } else {
        const newClass = { ...formData, createdAt: new Date().getTime() };
        const docRef = await addDoc(collection(db, "classes"), newClass);
        setClasses(prev => [{ dbId: docRef.id, ...newClass }, ...prev]);
        toast.success("Thêm lớp học thành công");
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ id: '', name: '', teacher: '', students: 0, max: 15, schedule: '' });
    }
    catch (err) {
      console.error(err);
      toast.error(editingId ? "Cập nhật lớp học thất bại" : "Thêm lớp học thất bại");
    }
    finally {
      setLoading(false);
    }
  };

  const openEditModal = (cls) => {
    setFormData({
      id: cls.id || '',
      name: cls.name,
      teacher: cls.teacher,
      students: cls.students,
      max: cls.max,
      schedule: cls.schedule
    });
    setEditingId(cls.dbId);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setFormData({ id: '', name: '', teacher: '', students: 0, max: 15, schedule: '' });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (dbId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa lớp học này?")) return;

    try {
      const docRef = doc(db, "classes", dbId);
      await deleteDoc(docRef);
      setClasses(prev => prev.filter(c => c.dbId !== dbId));
      toast.success("Xóa lớp học thành công");
    } catch (err) {
      console.error(err);
      toast.error("Xóa lớp học thất bại");
    }
  };

  const totalClasses = classes.length;
  const avgStudents = totalClasses > 0
    ? (classes.reduce((sum, cls) => sum + (cls.students || 0), 0) / totalClasses).toFixed(1)
    : 0;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý Lớp học</h1>
          <p className="page-subtitle">Quản lý các lớp đang hoạt động và sắp khai giảng</p>
        </div>
        <RoleGuard allowedRoles={['super_admin', 'admin']}>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} />
            Mở lớp mới
          </button>
        </RoleGuard>
      </div>

      <div className="stats-grid" style={{ marginBottom: '1rem' }}>
        <div className="stat-card glass">
          <div className="stat-info">
            <h3 className="stat-title">Lớp đang mở</h3>
            <div className="stat-value">{totalClasses}</div>
          </div>
          <BookOpen size={32} style={{ color: 'var(--primary)', opacity: 0.2, marginLeft: 'auto' }} />
        </div>
        <div className="stat-card glass">
          <div className="stat-info">
            <h3 className="stat-title">Sĩ số trung bình</h3>
            <div className="stat-value">{avgStudents}</div>
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
              {loading && classes.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Đang tải dữ liệu...</td>
                </tr>
              ) : classes.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Không có lớp học nào</td>
                </tr>
              ) : (
                classes.map(cls => (
                  <tr key={cls.dbId}>
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
                      <div className="action-buttons">
                        <RoleGuard allowedRoles={['super_admin', 'admin']}>
                          <button className="btn-icon" title="Chỉnh sửa" onClick={() => openEditModal(cls)}><Edit size={16} /></button>
                          <button className="btn-icon text-danger" title="Xóa" onClick={() => handleDelete(cls.dbId)}><Trash size={16} /></button>
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
              <h2>{editingId ? 'Cập nhật Lớp học' : 'Mở Lớp mới'}</h2>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddOrEditClass} className="modal-form">
              <div className="form-group">
                <label>Mã Lớp</label>
                <input type="text" name="id" required value={formData.id} onChange={handleChange} placeholder="Ví dụ: C001" />
              </div>
              <div className="form-group">
                <label>Tên Lớp</label>
                <input type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="Ví dụ: Python Basic" />
              </div>
              <div className="form-group">
                <label>Giảng viên</label>
                <input type="text" name="teacher" required value={formData.teacher} onChange={handleChange} placeholder="Tên giảng viên..." />
              </div>
              <div className="form-group">
                <label>Lịch học</label>
                <input type="text" name="schedule" required value={formData.schedule} onChange={handleChange} placeholder="Ví dụ: T3, T5 - 18h00" />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Sĩ số hiện tại</label>
                  <input type="number" name="students" required value={formData.students} onChange={handleChange} min="0" />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Sĩ số tối đa</label>
                  <input type="number" name="max" required value={formData.max} onChange={handleChange} min="1" />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Đang lưu...' : 'Lưu lớp học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
