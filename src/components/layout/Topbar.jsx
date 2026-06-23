import { Bell, Search, User } from 'lucide-react';
import './Topbar.css';

export default function Topbar() {
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
            <span className="user-name">Admin CS</span>
            <span className="user-role">Quản lý</span>
          </div>
        </div>
      </div>
    </header>
  );
}
