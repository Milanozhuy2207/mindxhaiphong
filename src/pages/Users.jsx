import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db, secondaryAuth } from '../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import './Users.css';

export default function Users() {
  const { userRole } = useAuth();
  const isAdmin = userRole === 'super_admin' || userRole === 'admin';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    status: 'Hoạt động'
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error("Lỗi khi tải danh sách nhân sự:", error);
      toast.error("Không thể tải danh sách nhân sự");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const openAddModal = () => {
    setFormData({ name: '', email: '', password: '', role: 'staff', status: 'Hoạt động' });
    setEditingId(null);
    setShowModalPassword(false);
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: user.password || '',
      role: user.role || 'staff',
      status: user.status || 'Hoạt động'
    });
    setEditingId(user.id);
    setShowModalPassword(false);
    setIsModalOpen(true);
  };

  const handleAddOrEditUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        const originalUser = users.find(u => u.id === editingId);
        
        // Update Firebase Auth if email or password changed
        if (originalUser && (originalUser.password !== formData.password || originalUser.email !== formData.email)) {
          if (!originalUser.password) {
            toast.error("Không thể cập nhật Auth vì tài khoản này chưa được lưu mật khẩu cũ. Chỉ cập nhật DB.");
          } else {
            const { signInWithEmailAndPassword, updatePassword, updateEmail } = await import('firebase/auth');
            try {
              // Sign in to secondary app to get the user token
              const userCredential = await signInWithEmailAndPassword(secondaryAuth, originalUser.email, originalUser.password);
              
              if (originalUser.password !== formData.password) {
                await updatePassword(userCredential.user, formData.password);
              }
              if (originalUser.email !== formData.email) {
                await updateEmail(userCredential.user, formData.email);
              }
            } catch (authErr) {
              console.error("Lỗi cập nhật Auth:", authErr);
              toast.error("Không thể cập nhật mật khẩu/email trên hệ thống Auth.");
            }
          }
        }

        const userRef = doc(db, 'users', editingId);
        const updateData = { ...formData };
        await updateDoc(userRef, updateData);
        toast.success("Cập nhật nhân viên thành công");
      } else {
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
        const newUid = userCredential.user.uid;
        
        const createData = { ...formData, createdAt: new Date().getTime(), uid: newUid };
        
        await setDoc(doc(db, 'users', newUid), createData);
        toast.success("Thêm nhân viên thành công");
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Đã xảy ra lỗi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="users-header">
        <div>
          <h1 className="page-title">Quản lý Nhân sự</h1>
          <p className="page-subtitle">Thêm mới, phân quyền và quản lý tài khoản nhân viên</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          Thêm nhân viên
        </button>
      </div>

      <div className="users-grid">
        {users.map(user => (
          <div key={user.uid || user.id} className="user-card">
            <div className="user-header">
              <div className="user-avatar">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className={`role-badge role-${(user.role || 'staff').toLowerCase()}`}>
                {user.role}
              </span>
            </div>
            
            <div className="user-info">
              <h3 className="user-name">{user.name || 'Chưa cập nhật tên'}</h3>
              <p className="user-email">{user.email}</p>
              <p className="user-status text-muted">Trạng thái: {user.status}</p>
              {isAdmin && user.password && (
                <p className="user-password text-muted">
                  <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', marginTop: '4px', gap: '8px' }}>
                    Mật khẩu: {visiblePasswords[user.id] ? user.password : '******'}
                    <button 
                      className="btn-icon" 
                      onClick={() => setVisiblePasswords(prev => ({...prev, [user.id]: !prev[user.id]}))}
                      style={{ padding: '0', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: '13px', fontWeight: 'bold' }}
                    >
                      {visiblePasswords[user.id] ? 'Ẩn' : 'Hiện'}
                    </button>
                  </span>
                </p>
              )}
            </div>
            
            <div className="user-actions" style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button className="btn btn-ghost" onClick={() => openEditModal(user)} style={{ flex: 1 }}>
                Chỉnh sửa
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <div className="modal-header">
              <h2>{editingId ? 'Chỉnh sửa nhân sự' : 'Thêm nhân sự mới'}</h2>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddOrEditUser} className="modal-form">
              <div className="form-group">
                <label>Tên nhân viên</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  required 
                />
              </div>
              {isAdmin && (
                <div className="form-group">
                  <label>Mật khẩu {editingId && '(Sẽ đồng bộ trực tiếp lên hệ thống)'}</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      type={showModalPassword ? "text" : "password"} 
                      value={formData.password} 
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      required={!editingId}
                      minLength={6}
                      style={{ flex: 1 }}
                    />
                    <button 
                      type="button" 
                      className="btn btn-ghost" 
                      onClick={() => setShowModalPassword(!showModalPassword)}
                      style={{ padding: '0 15px', whiteSpace: 'nowrap' }}
                    >
                      {showModalPassword ? 'Ẩn' : 'Hiện'}
                    </button>
                  </div>
                </div>
              )}
              <div className="form-group">
                <label>Phân quyền</label>
                <select 
                  value={formData.role} 
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="CM">Center Manager (CM)</option>
                  <option value="CS">Customer Service (CS)</option>
                  <option value="OPS">Operations (OPS)</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
              <div className="form-group">
                <label>Trạng thái</label>
                <select 
                  value={formData.status} 
                  onChange={e => setFormData({...formData, status: e.target.value})}
                >
                  <option value="Hoạt động">Hoạt động</option>
                  <option value="Đã nghỉ">Đã nghỉ</option>
                </select>
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Đang lưu...' : 'Lưu thông vị trí'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
