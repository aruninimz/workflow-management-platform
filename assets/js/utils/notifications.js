/**
 * FlowBit Notification Manager
 * Centralized notification system for all modules
 */

class NotificationManager {
  constructor() {
    this.notifications = dataManager.getData('notifications') || [];
    this.listeners = {};
    this.initializeUI();
  }

  // Initialize notification UI
  initializeUI() {
    // Create notification container if it doesn't exist
    if (!document.getElementById('notification-container')) {
      const container = document.createElement('div');
      container.id = 'notification-container';
      container.className = 'fixed top-4 right-4 z-50 space-y-2';
      document.body.appendChild(container);
    }

    // Create notification center icon
    if (!document.getElementById('notification-center')) {
      const center = document.createElement('div');
      center.id = 'notification-center';
      center.innerHTML = `
        <button class="relative p-2 text-gray-600 hover:text-gray-900" onclick="window.notificationManager.toggleCenter()">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
          </svg>
          <span class="notification-badge absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center hidden">0</span>
        </button>
      `;
      
      // Try to add to navbar if it exists
      const navbar = document.querySelector('nav') || document.querySelector('header');
      if (navbar) {
        navbar.appendChild(center);
      }
    }
  }

  // Create notification
  create(options) {
    const notification = {
      id: dataManager.generateId(),
      type: options.type || 'info', // success, error, warning, info
      title: options.title || '',
      message: options.message || '',
      data: options.data || {},
      read: false,
      createdAt: new Date().toISOString()
    };

    this.notifications.unshift(notification);
    dataManager.setData('notifications', this.notifications);

    // Show toast
    this.showToast(notification);

    // Update badge
    this.updateBadge();

    // Trigger event
    this.trigger('notification-created', notification);

    return notification;
  }

  // Show toast notification
  showToast(notification) {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `notification-toast transform transition-all duration-300 translate-x-full opacity-0`;
    toast.innerHTML = `
      <div class="bg-white rounded-lg shadow-lg p-4 max-w-sm border-l-4 ${this.getBorderColor(notification.type)}">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            ${this.getIcon(notification.type)}
          </div>
          <div class="ml-3 flex-1">
            ${notification.title ? `<h3 class="text-sm font-medium text-gray-900">${notification.title}</h3>` : ''}
            <p class="text-sm text-gray-600 ${notification.title ? 'mt-1' : ''}">${notification.message}</p>
          </div>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" class="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
            </svg>
          </button>
        </div>
      </div>
    `;

    container.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.classList.remove('translate-x-full', 'opacity-0');
    }, 10);

    // Auto remove after 5 seconds
    setTimeout(() => {
      toast.classList.add('translate-x-full', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }

  // Get icon for notification type
  getIcon(type) {
    const icons = {
      success: '<svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>',
      error: '<svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>',
      warning: '<svg class="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>',
      info: '<svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>'
    };
    return icons[type] || icons.info;
  }

  // Get border color for notification type
  getBorderColor(type) {
    const colors = {
      success: 'border-green-500',
      error: 'border-red-500',
      warning: 'border-yellow-500',
      info: 'border-blue-500'
    };
    return colors[type] || colors.info;
  }

  // Get all notifications
  getAll(filters = {}) {
    let notifications = [...this.notifications];

    if (filters.unreadOnly) {
      notifications = notifications.filter(n => !n.read);
    }

    if (filters.type) {
      notifications = notifications.filter(n => n.type === filters.type);
    }

    if (filters.limit) {
      notifications = notifications.slice(0, filters.limit);
    }

    return notifications;
  }

  // Mark as read
  markAsRead(notificationId) {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      this.notifications[index].read = true;
      dataManager.setData('notifications', this.notifications);
      this.updateBadge();
      this.trigger('notification-read', this.notifications[index]);
    }
  }

  // Mark all as read
  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    dataManager.setData('notifications', this.notifications);
    this.updateBadge();
  }

  // Delete notification
  delete(notificationId) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    dataManager.setData('notifications', this.notifications);
    this.updateBadge();
  }

  // Clear all notifications
  clearAll() {
    this.notifications = [];
    dataManager.setData('notifications', this.notifications);
    this.updateBadge();
  }

  // Update notification badge
  updateBadge() {
    const badge = document.querySelector('.notification-badge');
    if (!badge) return;

    const unreadCount = this.notifications.filter(n => !n.read).length;
    
    if (unreadCount > 0) {
      badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  // Toggle notification center
  toggleCenter() {
    // This will be implemented in the dashboard
    console.log('Notification center toggled');
  }

  // Event system for modules to subscribe
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  trigger(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
}

// Global instance
window.notificationManager = new NotificationManager();
