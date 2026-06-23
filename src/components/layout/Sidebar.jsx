import { NavLink } from 'react-router-dom';
import { Home, Users, BookOpen, MessageSquare, Calendar } from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: Home },
  { path: '/students', label: 'Học viên', icon: Users },
  { path: '/classes', label: 'Lớp học', icon: BookOpen },
  { path: '/tickets', label: 'Hỗ trợ (Tickets)', icon: MessageSquare },
  { path: '/schedule', label: 'Lịch biểu', icon: Calendar },
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
        </ul>
      </nav>
    </aside>
  );
}
