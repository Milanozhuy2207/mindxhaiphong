import { MessageSquare, Clock, CheckCircle, AlertTriangle, Plus, Edit, Trash } from 'lucide-react';
import './Students.css'; // Reusing styles
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast'
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '../config/firebase';
import { logActivity } from '../utils/activityUtils';
import { useAuth } from '../contexts/AuthContext';

export default function Tickets() {
  const { userRole } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    id: '', // Custom Ticket ID
    student: '',
    class: '',
    type: 'Xin nghỉ phép',
    status: 'Mới',
    date: new Date().toLocaleDateString('vi-VN'),
    priority: 'Thường',
    assignee: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "tickets"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        dbId: doc.id,
        ...doc.data(),
      }));
      data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setTickets(data);
      setLoading(false);
    }, (error) => {
      console.error(error);
      toast.error("Lỗi khi tải dữ liệu ticket");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddOrEditTicket = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingId) {
        const docRef = doc(db, "tickets", editingId);
        await updateDoc(docRef, formData);
        setTickets(prev => prev.map(t => t.dbId === editingId ? { ...t, ...formData } : t));
        toast.success("Cập nhật ticket thành công");
        await logActivity('ticket', 'Cập nhật Ticket', `Ticket từ ${formData.student} đã được cập nhật.`, 'info');
      } else {
        const newTicket = { ...formData, createdAt: new Date().getTime() };
        const docRef = await addDoc(collection(db, "tickets"), newTicket);
        setTickets(prev => [{ dbId: docRef.id, ...newTicket }, ...prev]);
        toast.success("Thêm ticket thành công");
        await logActivity('ticket', 'Ticket mới', `Có một ticket mới từ ${formData.student}.`, 'warning');
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ id: '', student: '', class: '', type: 'Xin nghỉ phép', status: 'Mới', date: new Date().toLocaleDateString('vi-VN'), priority: 'Thường', assignee: '' });
    } catch (err) {
      console.error(err);
      toast.error(editingId ? "Cập nhật ticket thất bại" : "Thêm ticket thất bại");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (ticket) => {
    setFormData({
      id: ticket.id || '',
      student: ticket.student,
      class: ticket.class,
      type: ticket.type,
      status: ticket.status,
      date: ticket.date,
      priority: ticket.priority,
      assignee: ticket.assignee || ''
    });
    setEditingId(ticket.dbId);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setFormData({ id: '', student: '', class: '', type: 'Xin nghỉ phép', status: 'Mới', date: new Date().toLocaleDateString('vi-VN'), priority: 'Thường', assignee: '' });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (dbId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa ticket này?")) return;

    try {
      const ticketStudent = tickets.find(t => t.dbId === dbId)?.student || 'Không rõ';
      const docRef = doc(db, "tickets", dbId);
      await deleteDoc(docRef);
      setTickets(prev => prev.filter(t => t.dbId !== dbId));
      toast.success("Xóa ticket thành công");
      await logActivity('ticket', 'Xóa Ticket', `Ticket của ${ticketStudent} đã bị xóa.`, 'danger');
    } catch (err) {
      console.error(err);
      toast.error("Xóa ticket thất bại");
    }
  };

  const newTicketsCount = tickets.filter(t => t.status === 'Mới').length;
  const processingCount = tickets.filter(t => t.status === 'Đang xử lý').length;
  const resolvedCount = tickets.filter(t => t.status === 'Hoàn thành').length;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hỗ trợ (Tickets)</h1>
          <p className="page-subtitle">Quản lý các yêu cầu, phản hồi từ học viên và phụ huynh</p>
        </div>
        {userRole !== 'OPS' && (
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} />
            Tạo Ticket
          </button>
        )}
      </div>

      <div className="stats-grid" style={{ marginBottom: '1rem' }}>
        <div className="stat-card glass" style={{ borderLeft: '4px solid var(--info)' }}>
          <div className="stat-info">
            <h3 className="stat-title">Ticket mới</h3>
            <div className="stat-value">{newTicketsCount}</div>
          </div>
          <MessageSquare size={32} style={{ color: 'var(--info)', opacity: 0.2, marginLeft: 'auto' }} />
        </div>
        <div className="stat-card glass" style={{ borderLeft: '4px solid var(--warning)' }}>
          <div className="stat-info">
            <h3 className="stat-title">Đang xử lý</h3>
            <div className="stat-value">{processingCount}</div>
          </div>
          <Clock size={32} style={{ color: 'var(--warning)', opacity: 0.2, marginLeft: 'auto' }} />
        </div>
        <div className="stat-card glass" style={{ borderLeft: '4px solid var(--success)' }}>
          <div className="stat-info">
            <h3 className="stat-title">Đã giải quyết</h3>
            <div className="stat-value">{resolvedCount}</div>
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
                <th>Người phụ trách</th>
                <th>Mức độ</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && tickets.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Đang tải dữ liệu...</td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Không có ticket nào</td>
                </tr>
              ) : (
                tickets.map(ticket => (
                  <tr key={ticket.dbId}>
                    <td><strong>{ticket.id}</strong></td>
                    <td>
                      {ticket.student}
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lớp: {ticket.class}</div>
                    </td>
                    <td>{ticket.type}</td>
                    <td>{ticket.assignee || <span style={{color: 'var(--text-muted)'}}>Chưa giao</span>}</td>
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
                      <div className="action-buttons">
                        <button className="btn-icon" title="Chỉnh sửa" onClick={() => openEditModal(ticket)}><Edit size={16} /></button>
                        {['super_admin', 'admin', 'CM'].includes(userRole) && (
                          <button className="btn-icon text-danger" title="Xóa" onClick={() => handleDelete(ticket.dbId)}><Trash size={16} /></button>
                        )}
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
              <h2>{editingId ? 'Cập nhật Ticket' : 'Tạo Ticket Mới'}</h2>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddOrEditTicket} className="modal-form">
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Mã Ticket</label>
                  <input type="text" name="id" required value={formData.id} onChange={handleChange} placeholder="Ví dụ: TK001" disabled={userRole === 'OPS'} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Ngày tạo</label>
                  <input type="text" name="date" required value={formData.date} onChange={handleChange} placeholder="DD/MM/YYYY" disabled={userRole === 'OPS'} />
                </div>
              </div>
              <div className="form-group">
                <label>Người gửi (Học viên/Phụ huynh)</label>
                <input type="text" name="student" required value={formData.student} onChange={handleChange} placeholder="Tên người gửi..." disabled={userRole === 'OPS'} />
              </div>
              <div className="form-group">
                <label>Lớp</label>
                <input type="text" name="class" required value={formData.class} onChange={handleChange} placeholder="Ví dụ: Python Basic" disabled={userRole === 'OPS'} />
              </div>
              <div className="form-group">
                <label>Phân loại</label>
                <select name="type" value={formData.type} onChange={handleChange} disabled={userRole === 'OPS'}>
                  <option value="Xin nghỉ phép">Xin nghỉ phép</option>
                  <option value="Bảo lưu">Bảo lưu khóa học</option>
                  <option value="Phản hồi GV">Phản hồi giáo viên</option>
                  <option value="Hỗ trợ kỹ thuật">Hỗ trợ kỹ thuật</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
              <div className="form-group">
                <label>Người phụ trách (OPS)</label>
                <input type="text" name="assignee" value={formData.assignee} onChange={handleChange} placeholder="Nhập tên người phụ trách..." disabled={userRole === 'OPS'} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Mức độ</label>
                  <select name="priority" value={formData.priority} onChange={handleChange}>
                    <option value="Thường">Thường</option>
                    <option value="Cao">Cao</option>
                    <option value="Khẩn cấp">Khẩn cấp</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Trạng thái</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="Mới">Mới</option>
                    <option value="Đang xử lý">Đang xử lý</option>
                    <option value="Hoàn thành">Hoàn thành</option>
                  </select>
                </div>
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Đang lưu...' : 'Lưu Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
