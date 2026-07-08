import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Trash2, Calendar, CheckCircle } from 'lucide-react';
import { logActivity } from '../utils/activityUtils';
import { useAuth } from '../contexts/AuthContext';
import RoleGuard from '../components/RoleGuard';

export default function DemoClasses({ isEmbedded = false }) {
  const { userRole } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    classCode: '',
    expectedStudents: '',
    actualStudents: '',
    startTime: '19:00',
    endTime: '21:00',
    demoDate: new Date().toISOString().split('T')[0],
    startDate: '',
    teacher: '',
    examiner: '',
    auditor: '',
    awardedStudents: '',
    notes: '',
    certi: false,
    ecountVoucher: '',
    csat: false,
    status: 'Đã lên lịch'
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "demo_classes"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        dbId: doc.id,
        ...doc.data(),
      }));
      // Sắp xếp ngày gần nhất
      data.sort((a, b) => new Date(b.demoDate) - new Date(a.demoDate));
      setClasses(data);
      setLoading(false);
    }, (error) => {
      console.error(error);
      toast.error("Lỗi khi tải dữ liệu Lớp Demo");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const getDayOfWeek = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const days = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return days[date.getDay()];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.classCode || !formData.demoDate) {
      toast.error("Vui lòng nhập mã lớp và ngày demo!");
      return;
    }

    const payload = {
      ...formData,
      expectedStudents: parseInt(formData.expectedStudents) || 0,
      actualStudents: parseInt(formData.actualStudents) || 0,
      dayOfWeek: getDayOfWeek(formData.demoDate),
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingId) {
        const docRef = doc(db, "demo_classes", editingId);
        await updateDoc(docRef, payload);
        toast.success("Cập nhật thành công");
        await logActivity('demo_class', 'Sửa Lớp Demo', `Cập nhật lớp ${formData.classCode}.`, 'warning');
      } else {
        await addDoc(collection(db, "demo_classes"), {
          ...payload,
          createdAt: new Date().toISOString()
        });
        toast.success("Thêm mới thành công");
        await logActivity('demo_class', 'Thêm Lớp Demo', `Đã lên lịch demo cho lớp ${formData.classCode}.`, 'success');
      }
      closeModal();
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra");
    }
  };

  const openAddModal = () => {
    setFormData({
      classCode: '',
      expectedStudents: '',
      actualStudents: '',
      startTime: '19:00',
      endTime: '21:00',
      demoDate: new Date().toISOString().split('T')[0],
      startDate: '',
      teacher: '',
      examiner: '',
      auditor: '',
      awardedStudents: '',
      notes: '',
      certi: false,
      ecountVoucher: '',
      csat: false,
      status: 'Đã lên lịch'
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setFormData({
      classCode: item.classCode || '',
      expectedStudents: item.expectedStudents || '',
      actualStudents: item.actualStudents || '',
      startTime: item.startTime || '19:00',
      endTime: item.endTime || '21:00',
      demoDate: item.demoDate || '',
      startDate: item.startDate || '',
      teacher: item.teacher || '',
      examiner: item.examiner || '',
      auditor: item.auditor || '',
      awardedStudents: item.awardedStudents || '',
      notes: item.notes || '',
      certi: item.certi || false,
      ecountVoucher: item.ecountVoucher || '',
      csat: item.csat || false,
      status: item.status || 'Đã lên lịch'
    });
    setEditingId(item.dbId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleDelete = async (dbId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa lớp demo này?")) return;
    try {
      const item = classes.find(a => a.dbId === dbId);
      const code = item?.classCode || 'Không rõ';
      const docRef = doc(db, "demo_classes", dbId);
      await deleteDoc(docRef);
      toast.success("Xóa lớp thành công");
      await logActivity('demo_class', 'Xóa Lớp Demo', `Lớp ${code} đã bị xóa.`, 'danger');
    } catch (err) {
      console.error(err);
      toast.error("Xóa thất bại");
    }
  };

  const formatDateDisplay = (isoStr) => {
    if (!isoStr) return '';
    const [y, m, d] = isoStr.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className={isEmbedded ? "" : "page-container"}>
      {!isEmbedded && (
        <div className="page-header">
          <div>
            <h1 className="page-title">Lịch Lớp Demo</h1>
            <p className="page-subtitle">Quản lý tổ chức các lớp Demo theo tháng</p>
          </div>
          <RoleGuard allowedRoles={['super_admin', 'admin', 'CM', 'CS', 'OPS']}>
            <button className="btn btn-primary" onClick={openAddModal}>
              <Plus size={18} />
              Tạo Lớp Mới
            </button>
          </RoleGuard>
        </div>
      )}

      {isEmbedded && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <RoleGuard allowedRoles={['super_admin', 'admin', 'CM', 'CS', 'OPS']}>
            <button className="btn btn-primary" onClick={openAddModal}>
              <Plus size={18} />
              Tạo Lớp Mới
            </button>
          </RoleGuard>
        </div>
      )}

      <div className="card glass" style={{ overflowX: 'auto' }}>
        <table className="custom-table" style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
          <thead>
            <tr>
              <th>Mã lớp</th>
              <th>SL dự kiến</th>
              <th>Thực tế</th>
              <th>Thời gian</th>
              <th>Thứ</th>
              <th>Dự kiến demo</th>
              <th>Dự kiến KG</th>
              <th>GV</th>
              <th>Giám khảo</th>
              <th>Dự thính</th>
              <th>HV đạt giải</th>
              <th>Note</th>
              <th>Certi</th>
              <th>Phiếu xuất</th>
              <th>CSAT</th>
              <th className="text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading && classes.length === 0 ? (
              <tr>
                <td colSpan="16" style={{ textAlign: 'center', padding: '2rem' }}>Đang tải dữ liệu...</td>
              </tr>
            ) : classes.length === 0 ? (
              <tr>
                <td colSpan="16" style={{ textAlign: 'center', padding: '2rem' }}>Chưa có lớp Demo nào</td>
              </tr>
            ) : (
              classes.map(item => (
                <tr key={item.dbId}>
                  <td><strong>{item.classCode}</strong></td>
                  <td className="text-center">{item.expectedStudents || 0}</td>
                  <td className="text-center">{item.actualStudents || 0}</td>
                  <td>{item.startTime} - {item.endTime}</td>
                  <td>{item.dayOfWeek}</td>
                  <td>{formatDateDisplay(item.demoDate)}</td>
                  <td>{formatDateDisplay(item.startDate)}</td>
                  <td>{item.teacher}</td>
                  <td>{item.examiner}</td>
                  <td>{item.auditor}</td>
                  <td>{item.awardedStudents}</td>
                  <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.notes}>{item.notes}</td>
                  <td className="text-center">{item.certi ? '☑' : '☐'}</td>
                  <td>{item.ecountVoucher}</td>
                  <td className="text-center">{item.csat ? '☑' : '☐'}</td>
                  <td className="text-right">
                    <RoleGuard allowedRoles={['super_admin', 'admin', 'CM', 'CS', 'OPS']}>
                      <button className="action-btn edit" onClick={() => openEditModal(item)} title="Sửa">
                        <Edit2 size={16} />
                      </button>
                      <button className="action-btn delete" onClick={() => handleDelete(item.dbId)} title="Xóa">
                        <Trash2 size={16} />
                      </button>
                    </RoleGuard>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
            <div className="modal-header">
              <h2>{editingId ? 'Cập Nhật Lớp Demo' : 'Thêm Lớp Demo Mới'}</h2>
              <button className="btn-close" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Mã Lớp *</label>
                  <input type="text" name="classCode" value={formData.classCode} onChange={handleChange} required placeholder="VD: HP-C4K-SB26"/>
                </div>
                <div className="form-group">
                  <label>Số lượng HV dự kiến</label>
                  <input type="number" name="expectedStudents" value={formData.expectedStudents} onChange={handleChange} min="0"/>
                </div>
                <div className="form-group">
                  <label>Số lượng HV thực tế</label>
                  <input type="number" name="actualStudents" value={formData.actualStudents} onChange={handleChange} min="0"/>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Ngày Demo *</label>
                  <input type="date" name="demoDate" value={formData.demoDate} onChange={handleChange} required/>
                </div>
                <div className="form-group">
                  <label>Ngày Khai giảng (Dự kiến)</label>
                  <input type="date" name="startDate" value={formData.startDate} onChange={handleChange}/>
                </div>
                <div className="form-group">
                  <label>Giờ Bắt Đầu</label>
                  <input type="time" name="startTime" value={formData.startTime} onChange={handleChange}/>
                </div>
                <div className="form-group">
                  <label>Giờ Kết Thúc</label>
                  <input type="time" name="endTime" value={formData.endTime} onChange={handleChange}/>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Giảng viên (GV)</label>
                  <input type="text" name="teacher" value={formData.teacher} onChange={handleChange} placeholder="Username GV"/>
                </div>
                <div className="form-group">
                  <label>Giám khảo</label>
                  <input type="text" name="examiner" value={formData.examiner} onChange={handleChange}/>
                </div>
                <div className="form-group">
                  <label>Dự thính</label>
                  <input type="text" name="auditor" value={formData.auditor} onChange={handleChange}/>
                </div>
              </div>

              <div className="form-group">
                <label>Học viên đạt giải</label>
                <input type="text" name="awardedStudents" value={formData.awardedStudents} onChange={handleChange} placeholder="Tên các học viên"/>
              </div>

              <div className="form-group">
                <label>Ghi chú (Note)</label>
                <textarea name="notes" value={formData.notes} onChange={handleChange} rows="2" placeholder="Ghi chú thêm..."></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Phiếu xuất Ecount</label>
                  <input type="text" name="ecountVoucher" value={formData.ecountVoucher} onChange={handleChange}/>
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" name="certi" checked={formData.certi} onChange={handleChange} style={{ width: 'auto' }}/>
                    Certi (Đã có chứng chỉ)
                  </label>
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" name="csat" checked={formData.csat} onChange={handleChange} style={{ width: 'auto' }}/>
                    CSAT (Đã làm khảo sát)
                  </label>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu Lớp Demo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
