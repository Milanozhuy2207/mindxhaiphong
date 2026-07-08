import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Log an activity to Firestore
 * @param {string} type - e.g., 'student', 'class', 'ticket', 'system'
 * @param {string} title - e.g., 'Thêm học viên mới', 'Ticket cần xử lý'
 * @param {string} description - Detailed description
 * @param {string} iconColor - e.g., 'primary', 'warning', 'success', 'danger'
 */
export const logActivity = async (type, title, description, iconColor = 'primary') => {
  try {
    await addDoc(collection(db, 'activities'), {
      type,
      title,
      description,
      iconColor,
      createdAt: serverTimestamp(),
      read: false
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};
