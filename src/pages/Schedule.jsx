import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-hot-toast';
import { User, AlertCircle, Clock, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import Appointments from './Appointments';
import DemoClasses from './DemoClasses';
import './Schedule.css';

export default function Schedule() {
  const [classes, setClasses] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [demoClasses, setDemoClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [baseDate, setBaseDate] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState(null);
  const [activeTab, setActiveTab] = useState('calendar');

  useEffect(() => {
    // Lấy danh sách lớp học
    const unsubscribeClasses = onSnapshot(collection(db, "classes"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        dbId: doc.id,
        ...doc.data(),
      }));
      setClasses(data);
      setLoading(false);
    }, (error) => {
      console.error(error);
      toast.error("Lỗi khi tải dữ liệu lớp học");
      setLoading(false);
    });

    const unsubscribeStudents = onSnapshot(collection(db, "students"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setStudents(data);
    });

    const unsubscribeAppointments = onSnapshot(collection(db, "appointments"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        dbId: doc.id,
        ...doc.data(),
      }));
      setAppointments(data);
    });

    const unsubscribeDemoClasses = onSnapshot(collection(db, "demo_classes"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        dbId: doc.id,
        ...doc.data(),
      }));
      setDemoClasses(data);
    });

    return () => {
      unsubscribeClasses();
      unsubscribeStudents();
      unsubscribeAppointments();
      unsubscribeDemoClasses();
    };
  }, []);

  const getWeekDays = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
    const monday = new Date(d.setDate(diff));
    
    return Array.from({ length: 7 }).map((_, i) => {
      const current = new Date(monday);
      current.setDate(monday.getDate() + i);
      const isToday = new Date().toDateString() === current.toDateString();
      
      const labels = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
      
      return {
        id: current.getDay() === 0 ? 8 : current.getDay() + 1,
        label: labels[current.getDay()],
        dateStr: `${current.getDate().toString().padStart(2, '0')}/${(current.getMonth() + 1).toString().padStart(2, '0')}`,
        isToday,
        fullDate: current
      };
    });
  };

  const weekDays = useMemo(() => getWeekDays(baseDate), [baseDate]);

  const handlePrevWeek = () => {
    const newDate = new Date(baseDate);
    newDate.setDate(newDate.getDate() - 7);
    setBaseDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(baseDate);
    newDate.setDate(newDate.getDate() + 7);
    setBaseDate(newDate);
  };

  const handleToday = () => {
    setBaseDate(new Date());
  };

  const parsedData = useMemo(() => {
    const unassigned = [];
    const timeSlotsSet = new Set();
    const parsedClasses = [];

    classes.forEach((cls) => {
      const scheduleStr = (cls.schedule || '').toLowerCase();
      let matchedDays = [];
      
      if (scheduleStr.includes('t2') || scheduleStr.includes('thứ 2') || scheduleStr.includes('hai')) matchedDays.push(2);
      if (scheduleStr.includes('t3') || scheduleStr.includes('thứ 3') || scheduleStr.includes('ba')) matchedDays.push(3);
      if (scheduleStr.includes('t4') || scheduleStr.includes('thứ 4') || scheduleStr.includes('tư')) matchedDays.push(4);
      if (scheduleStr.includes('t5') || scheduleStr.includes('thứ 5') || scheduleStr.includes('năm')) matchedDays.push(5);
      if (scheduleStr.includes('t6') || scheduleStr.includes('thứ 6') || scheduleStr.includes('sáu')) matchedDays.push(6);
      if (scheduleStr.includes('t7') || scheduleStr.includes('thứ 7') || scheduleStr.includes('bảy')) matchedDays.push(7);
      if (scheduleStr.includes('cn') || scheduleStr.includes('chủ nhật')) matchedDays.push(8);

      let exactTime = null;
      let shiftLabel = '';
      const timeMatch = scheduleStr.match(/(\d{1,2})[h:](\d{2})/i);
      
      if (timeMatch) {
        const h = timeMatch[1].padStart(2, '0');
        const m = timeMatch[2];
        exactTime = `${h}:${m}`;
        const hourInt = parseInt(h);
        if (hourInt < 12) shiftLabel = 'Sáng';
        else if (hourInt < 17) shiftLabel = 'Chiều';
        else shiftLabel = 'Tối';
      } else {
        if (scheduleStr.includes('sáng') || scheduleStr.includes('sang')) {
          exactTime = 'Ca Sáng (Chưa rõ giờ)';
          shiftLabel = 'Sáng';
        } else if (scheduleStr.includes('chiều') || scheduleStr.includes('chieu')) {
          exactTime = 'Ca Chiều (Chưa rõ giờ)';
          shiftLabel = 'Chiều';
        } else if (scheduleStr.includes('tối') || scheduleStr.includes('toi')) {
          exactTime = 'Ca Tối (Chưa rõ giờ)';
          shiftLabel = 'Tối';
        }
      }

      if (matchedDays.length > 0 && exactTime) {
        timeSlotsSet.add(exactTime);
        parsedClasses.push({
          ...cls,
          matchedDays,
          exactTime,
          shiftLabel
        });
      } else {
        unassigned.push(cls);
      }
    });

    appointments.forEach((app) => {
      if (!app.date || !app.time) return;
      const matchDay = weekDays.find(d => d.fullDate.toLocaleDateString('vi-VN') === app.date);
      if (matchDay) {
        timeSlotsSet.add(app.time);
        parsedClasses.push({
          isAppointment: true,
          dbId: app.dbId,
          id: app.type, 
          name: app.student,
          teacher: app.teacher,
          exactTime: app.time,
          matchedDays: [matchDay.id],
          shiftLabel: '',
          status: app.status
        });
      }
    });

    demoClasses.forEach((demo) => {
      if (!demo.demoDate || !demo.startTime) return;
      const [y, m, d] = demo.demoDate.split('-');
      const formattedDate = `${d}/${m}/${y}`;
      const matchDay = weekDays.find(day => day.fullDate.toLocaleDateString('vi-VN') === formattedDate);
      
      if (matchDay) {
        timeSlotsSet.add(demo.startTime);
        parsedClasses.push({
          isAppointment: true,
          dbId: demo.dbId,
          id: 'Demo Class',
          name: demo.classCode,
          teacher: demo.teacher,
          exactTime: demo.startTime,
          matchedDays: [matchDay.id],
          shiftLabel: '',
          status: `${demo.actualStudents || 0}/${demo.expectedStudents || 0} HV`
        });
      }
    });

    const timeSlots = Array.from(timeSlotsSet).sort((a, b) => {
      const isTimeA = /^\d{2}:\d{2}$/.test(a);
      const isTimeB = /^\d{2}:\d{2}$/.test(b);
      if (isTimeA && isTimeB) return a.localeCompare(b);
      if (isTimeA && !isTimeB) return -1;
      if (!isTimeA && isTimeB) return 1;
      return a.localeCompare(b); 
    });

    const grid = {};
    timeSlots.forEach(time => {
      grid[time] = {};
      weekDays.forEach(day => {
        grid[time][day.id] = [];
      });
    });

    parsedClasses.forEach(cls => {
      cls.matchedDays.forEach(dayId => {
        grid[cls.exactTime][dayId].push(cls);
      });
    });

    return { grid, timeSlots, unassigned, parsedClasses };
  }, [classes, appointments, demoClasses, weekDays]);

  const getColorClass = (classId) => {
    if (!classId) return 'color-0';
    let sum = 0;
    for (let i = 0; i < classId.length; i++) {
      sum += classId.charCodeAt(i);
    }
    return `color-${sum % 7}`;
  };

  const renderClassCard = (cls, idx) => {
    if (cls.isAppointment) {
      return (
        <div 
          key={`app-${cls.dbId}-${idx}`} 
          className={`class-card ${cls.id === 'Demo' ? 'color-4' : 'color-5'}`}
          title={`Trạng thái: ${cls.status}`}
          style={{ borderStyle: 'dashed' }}
        >
          <div className="class-header">
            <span className="class-id" style={{fontSize: '0.75rem', padding: '2px 4px', background: 'rgba(255,255,255,0.3)', borderRadius: '4px'}}>{cls.id}</span>
            <span style={{fontSize: '0.7rem'}}>{cls.status}</span>
          </div>
          <div className="class-name">{cls.name}</div>
          <div className="class-teacher">
            <User size={12} />
            <span>{cls.teacher || 'Chưa phân công'}</span>
          </div>
        </div>
      );
    }

    const isFull = cls.students >= cls.max;
    return (
      <div 
        key={`${cls.dbId}-${idx}`} 
        className={`class-card ${getColorClass(cls.id)}`}
        title={`Lịch gốc: ${cls.schedule}`}
        onClick={() => setSelectedClass(cls)}
      >
        <div className="class-header">
          <span className="class-id">{cls.id}</span>
          <span className={`class-count ${isFull ? 'full' : ''}`}>
            {cls.students || 0}/{cls.max || 15}
          </span>
        </div>
        <div className="class-name">{cls.name || 'Lớp chưa có tên'}</div>
        <div className="class-teacher">
          <User size={12} />
          <span>{cls.teacher || 'Chưa phân công'}</span>
        </div>
      </div>
    );
  };

  const daysVN = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const currentMonthStr = `${daysVN[baseDate.getDay()]}, ${String(baseDate.getDate()).padStart(2, '0')}/${String(baseDate.getMonth() + 1).padStart(2, '0')}/${baseDate.getFullYear()}`;
  const localDateStr = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}-${String(baseDate.getDate()).padStart(2, '0')}`;

  return (
    <div className="schedule-container">
      <div className="schedule-header-wrap" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">Quản Lý Lịch Học & Lịch Hẹn</h1>
            <p className="page-subtitle">Theo dõi lịch học chính thức và các lịch hẹn khác</p>
          </div>
          
          <div className="schedule-tabs" style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
            <button 
              className={`btn ${activeTab === 'calendar' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('calendar')}
            >
              <Calendar size={18} /> Lịch Tổng Hợp
            </button>
            <button 
              className={`btn ${activeTab === 'demo' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('demo')}
            >
              <Clock size={18} /> Lịch Demo
            </button>
            <button 
              className={`btn ${activeTab === 'makeup' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('makeup')}
            >
              <Clock size={18} /> Lịch Học Bù
            </button>
          </div>
        </div>
        
        {activeTab === 'calendar' && (
          <div className="date-controls" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <button className="btn-today" onClick={handleToday}>Hôm nay</button>
            <button className="date-btn" onClick={handlePrevWeek}><ChevronLeft size={20} /></button>
            <div 
              style={{ position: 'relative', display: 'flex', alignItems: 'center', cursor: 'pointer' }} 
              title="Chọn ngày"
              onClick={(e) => {
                const input = e.currentTarget.querySelector('input[type="date"]');
                if (input && input.showPicker) {
                  try {
                    input.showPicker();
                  } catch (err) {
                    // Fallback for browsers that don't support showPicker well yet
                  }
                }
              }}
            >
              <span className="current-week-label" style={{ cursor: 'pointer', padding: '0 0.5rem' }}>{currentMonthStr}</span>
              <input 
                type="date" 
                value={localDateStr}
                onChange={(e) => {
                  if(e.target.value) {
                    const [y, m, d] = e.target.value.split('-');
                    setBaseDate(new Date(y, m - 1, d));
                  }
                }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  pointerEvents: 'none'
                }}
              />
            </div>
            <button className="date-btn" onClick={handleNextWeek}><ChevronRight size={20} /></button>
          </div>
        )}
      </div>

      {activeTab === 'demo' ? (
        <DemoClasses isEmbedded={true} />
      ) : activeTab === 'makeup' ? (
        <Appointments isEmbedded={true} filterType="Học bù" />
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem', width: '30px', height: '30px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
          <p style={{ color: 'var(--text-muted)' }}>Đang tải dữ liệu thời khóa biểu...</p>
        </div>
      ) : (
        <>
          <div className="timetable-card">
            <div className="timetable-grid">
              {/* Header Row */}
              <div className="grid-header-row">
                <div className="grid-header-cell empty-corner"></div>
                {weekDays.map(day => (
                  <div key={day.id} className={`grid-header-cell ${day.isToday ? 'today' : ''}`}>
                    <span className="day-name">{day.label}</span>
                    <span className="day-date">{day.dateStr}</span>
                  </div>
                ))}
              </div>

              {/* Body Rows */}
              {parsedData.timeSlots.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Không có lịch học nào có khung giờ hợp lệ.
                </div>
              ) : (
                parsedData.timeSlots.map(timeSlot => {
                  let shiftLabel = '';
                  for (let cls of parsedData.parsedClasses) {
                    if (cls.exactTime === timeSlot) {
                      shiftLabel = cls.shiftLabel;
                      break;
                    }
                  }

                  return (
                    <div key={timeSlot} className="grid-body-row">
                      <div className="time-row-cell">
                        <span className="exact-time">{timeSlot}</span>
                        {shiftLabel && <span className="shift-hint">{shiftLabel}</span>}
                      </div>
                      
                      {weekDays.map(day => (
                        <div key={`${timeSlot}-${day.id}`} className={`day-content-cell ${day.isToday ? 'today-col' : ''}`}>
                          {parsedData.grid[timeSlot][day.id].map((cls, idx) => renderClassCard(cls, idx))}
                        </div>
                      ))}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {parsedData.unassigned.length > 0 && (
            <div className="unassigned-wrapper">
              <h3 className="unassigned-title">
                <AlertCircle size={22} />
                Lớp học chưa xác định lịch ({parsedData.unassigned.length})
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Các lớp sau có phần "Lịch học" bị trống hoặc không chứa thông tin ngày học (T2-CN).
              </p>
              <div className="unassigned-list">
                {parsedData.unassigned.map(cls => (
                  <div key={cls.dbId} className="unassigned-item">
                    <div><strong>{cls.id}</strong> - {cls.name}</div>
                    <div style={{ color: 'var(--text-muted)' }}>
                      <Clock size={12} style={{ display: 'inline', marginRight: '4px' }}/>
                      {cls.schedule || 'Trống'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {selectedClass && (
        <div className="modal-overlay" onClick={() => setSelectedClass(null)}>
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h2>Chi tiết lớp: {selectedClass.id} - {selectedClass.name}</h2>
              <button className="btn-close" onClick={() => setSelectedClass(null)}>&times;</button>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', background: 'var(--bg-base)', padding: '1rem', borderRadius: 'var(--radius-lg)' }}>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Giảng viên</p>
                  <p style={{ fontWeight: '600', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={16}/> {selectedClass.teacher || 'Chưa phân công'}
                  </p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Lịch học</p>
                  <p style={{ fontWeight: '600', color: 'var(--text-main)' }}>{selectedClass.schedule}</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sĩ số</p>
                  <p style={{ fontWeight: '600', color: 'var(--text-main)' }}>{selectedClass.students}/{selectedClass.max}</p>
                </div>
              </div>

              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Danh sách học viên</h3>
              
              <div style={{ maxHeight: '300px', overflowY: 'auto', overflowX: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                <table className="custom-table" style={{ margin: 0 }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-base)', zIndex: 1 }}>
                    <tr>
                      <th>Mã HV</th>
                      <th>Họ Tên</th>
                      <th>Email</th>
                      <th>Tên phụ huynh</th>
                      <th>SĐT phụ huynh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.filter(s => s.classes && (s.classes.includes(selectedClass.name) || s.classes.includes(selectedClass.id))).length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Chưa có học viên nào trong lớp này</td>
                      </tr>
                    ) : (
                      students.filter(s => s.classes && (s.classes.includes(selectedClass.name) || s.classes.includes(selectedClass.id))).map((s, idx) => (
                        <tr key={idx}>
                          <td><strong>{s.studentId || '-'}</strong></td>
                          <td>{s.name}</td>
                          <td>{s.email || '-'}</td>
                          <td>{s.parentName || '-'}</td>
                          <td>{s.parentPhone || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
