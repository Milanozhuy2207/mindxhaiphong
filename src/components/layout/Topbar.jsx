import { Bell, Search, User, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './Topbar.css';

export default function Topbar() {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi đăng xuất');
    }
  };

  const getRoleDisplayName = (role) => {
    switch(role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Quản lý';
      default: return 'Nhân viên';
    }
  };

  return (
    <header className="topbar glass">
      <div className="search-bar">
        <Search size={18} className="search-icon" />
        <input type="text" placeholder="Tìm kiếm học viên, lớp học..." />
      </div>

      <div className="topbar-actions">
        <button className="icon-btn relative">
          <Bell size={20} />
          <span className="badge">3</span>
        </button>
        <div className="user-profile">
          <div className="avatar">
            <User size={20} />
          </div>
          <div className="user-info">
            <span className="user-name">{currentUser?.email?.split('@')[0] || 'User'}</span>
            <span className="user-role">{getRoleDisplayName(userRole)}</span>
          </div>
          <button className="logout-btn icon-btn" onClick={handleLogout} title="Đăng xuất">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
