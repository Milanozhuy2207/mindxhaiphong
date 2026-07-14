import { NavLink } from 'react-router-dom';
import { Home, Users as UsersIcon, BookOpen, MessageSquare, Calendar, ShieldCheck } from 'lucide-react';
import RoleGuard from '../RoleGuard';
import './Sidebar.css';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: Home },
  { path: '/students', label: 'Học viên', icon: UsersIcon },
  { path: '/classes', label: 'Lớp học', icon: BookOpen },
  { path: '/tickets', label: 'Hỗ trợ (Tickets)', icon: MessageSquare },
  { path: '/schedule', label: 'Lịch biểu', icon: Calendar },
];

const adminItems = [
  { path: '/users', label: 'Nhân sự', icon: ShieldCheck }
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">M</span>
          <span className="logo-text">MindX CS</span>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink 
                  to={item.path} 
                  className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
          
          <RoleGuard allowedRoles={['super_admin']}>
            <div className="sidebar-divider" style={{ margin: '1rem 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}></div>
            {adminItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink 
                    to={item.path} 
                    className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </RoleGuard>
        </ul>
      </nav>
    </aside>
  );
}
