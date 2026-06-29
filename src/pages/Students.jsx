import { Search, Plus, Filter, Download, Edit, Trash } from 'lucide-react';
import './Students.css';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast'
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '../config/firebase';

export default function Students() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [formData, setFormData] = useState({
    studentId: '',
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

  useEffect(() => {
    setLoading(true)
    const unsubscribe = onSnapshot(collection(db, "students"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setStudents(data)
      setLoading(false)
    }, (error) => {
      console.log(error)
      toast.error("Lỗi khi tải dữ liệu")
      setLoading(false)
    });

    return () => unsubscribe();
  }, [])

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const filteredStudents = students.filter(s => {
    const term = searchTerm.toLowerCase();
    const matchId = s.studentId && s.studentId.toLowerCase().includes(term);
    const matchName = s.name && s.name.toLowerCase().includes(term);
    const matchPhone = s.phone && s.phone.includes(term);
    const matchClass = s.classes && s.classes.toLowerCase().includes(term);

    const matchSearch = matchId || matchName || matchPhone || matchClass;
    const matchStatus = filterStatus === 'All' || s.status === filterStatus;

    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);

  const handleAddOrEditStudent = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingId) {
        const docRef = doc(db, "students", editingId);
        await updateDoc(docRef, formData);
        setStudents(prev => prev.map(s => s.id === editingId ? { ...s, ...formData } : s));
        toast.success("Cập nhật học viên thành công");
      } else {
        const newStudent = { ...formData, createdAt: new Date().getTime() };
        const docRef = await addDoc(collection(db, "students"), newStudent);
        setStudents(prev => [{ id: docRef.id, ...newStudent }, ...prev]);
        toast.success("Thêm học viên thành công");
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ studentId: '', name: '', phone: '', classes: '', status: 'Đang học' });
    }
    catch (err) {
      console.error(err);
      toast.error(editingId ? "Cập nhật học viên thất bại" : "Thêm học viên thất bại");
    }
    finally {
      setLoading(false);
    }
  };

  const generateStudentId = () => {
    let maxId = 0;
    students.forEach(s => {
      if (s.studentId && s.studentId.startsWith('HV')) {
        const numStr = s.studentId.replace('HV', '');
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && num > maxId) {
          maxId = num;
        }
      }
    });
    return `HV${String(maxId + 1).padStart(3, '0')}`;
  };

  const openEditModal = (student) => {
    setFormData({
      studentId: student.studentId || generateStudentId(),
      name: student.name,
      phone: student.phone,
      classes: student.classes,
      status: student.status
    });
    setEditingId(student.id);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setFormData({ studentId: generateStudentId(), name: '', phone: '', classes: '', status: 'Đang học' });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa học viên này?")) return;

    try {
      const docRef = doc(db, "students", id);
      await deleteDoc(docRef);
      setStudents(prev => prev.filter(s => s.id !== id));
      toast.success("Xóa học viên thành công");
    } catch (err) {
      console.error(err);
      toast.error("Xóa học viên thất bại");
    }
  };

  const migrateData = async () => {
    if (!window.confirm("Cập nhật mã cho toàn bộ học viên cũ?")) return;
    try {
      setLoading(true);
      let count = 0;
      // Lấy danh sách hiện tại theo thứ tự đang hiển thị (từ cũ đến mới)
      const listToUpdate = [...students].reverse(); 
      for (let i = 0; i < listToUpdate.length; i++) {
        const student = listToUpdate[i];
        if (!student.studentId || student.studentId === '') {
          const newId = `HV${String(i + 1).padStart(3, '0')}`;
          const docRef = doc(db, "students", student.id);
          await updateDoc(docRef, { studentId: newId });
          count++;
        }
      }
      toast.success(`Đã cập nhật mã cho ${count} học viên cũ. Đang tải lại...`);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error(err);
      toast.error("Lỗi cập nhật dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      + "Mã HV,Họ tên,Số điện thoại,Lớp đang học,Trạng thái\n"
      + students.map((s) => `"${s.studentId || ''}","${s.name}","${s.phone}","${s.classes}","${s.status}"`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "danh_sach_hoc_vien.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý Học viên</h1>
          <p className="page-subtitle">Xem danh sách và thông tin chi tiết của học viên</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-ghost" onClick={migrateData} style={{ color: 'var(--warning)', border: '1px solid var(--warning)' }}>
            Đồng bộ Mã DB
          </button>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} />
            Thêm học viên
          </button>
        </div>
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
            <select
              className="btn btn-ghost"
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              style={{ outline: 'none', cursor: 'pointer' }}
            >
              <option value="All">Tất cả trạng thái</option>
              <option value="Đang học">Đang học</option>
              <option value="Chờ lớp">Chờ lớp</option>
              <option value="Bảo lưu">Bảo lưu</option>
            </select>
            <button className="btn btn-ghost" onClick={handleExport}>
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
              {loading && students.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Đang tải dữ liệu...</td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Không tìm thấy học viên nào</td>
                </tr>
              ) : (
                currentItems.map((student, index) => (
                  <tr key={student.id}>
                    <td><strong>{student.studentId || 'Chưa cập nhật'}</strong></td>
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
                        <button className="btn-icon" title="Chỉnh sửa" onClick={() => openEditModal(student)}><Edit size={16} /></button>
                        <button className="btn-icon text-danger" title="Xóa" onClick={() => handleDelete(student.id)}><Trash size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <span className="text-muted">
            Hiển thị {filteredStudents.length === 0 ? 0 : indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredStudents.length)} trong số {filteredStudents.length} học viên
          </span>
          <div className="page-controls">
            <button
              className="btn btn-ghost"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              Trước
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`btn ${currentPage === page ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              className="btn btn-ghost"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              Sau
            </button>
          </div>
        </div>
      </div>
      {/* Modal Thêm Học Viên */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <div className="modal-header">
              <h2>{editingId ? 'Cập nhật Học Viên' : 'Thêm Học Viên Mới'}</h2>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddOrEditStudent} className="modal-form">
              <div className="form-group">
                <label>Mã Học Viên</label>
                <input type="text" name="studentId" required value={formData.studentId} disabled style={{ backgroundColor: 'var(--bg-glass-hover)', cursor: 'not-allowed', color: 'var(--text-muted)' }} />
              </div>
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
