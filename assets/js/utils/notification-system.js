

import supabase from '../config/supabase-client.js';
import { APP_CONFIG } from '../config/config.js';

class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.pollInterval = null;
        this.listeners = [];
        
        // Start polling for notifications
        this.startPolling();
    }
    
    // ========================================================================
    // POLLING & REAL-TIME UPDATES
    // ========================================================================
    
    startPolling() {
        // Initial load
        this.loadNotifications();
        
        // Poll every X seconds
        const intervalSeconds = APP_CONFIG.notifications?.pollInterval || 30;
        this.pollInterval = setInterval(() => {
            this.loadNotifications();
        }, intervalSeconds * 1000);
        
        console.log(`✅ Notification polling started (every ${intervalSeconds}s)`);
    }
    
    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
            console.log('⏹️  Notification polling stopped');
        }
    }
    
    async loadNotifications() {
        try {
            const notifications = await supabase.getNotifications();
            const unreadCount = await supabase.getUnreadNotificationCount();
            
            this.notifications = notifications;
            this.unreadCount = unreadCount;
            
            // Notify listeners
            this.notifyListeners('update', { notifications, unreadCount });
            
            // Update UI
            this.updateBadge(unreadCount);
            
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    }
    
    // ========================================================================
    // EVENT LISTENERS
    // ========================================================================
    
    on(event, callback) {
        this.listeners.push({ event, callback });
    }
    
    off(event, callback) {
        this.listeners = this.listeners.filter(
            listener => listener.event !== event || listener.callback !== callback
        );
    }
    
    notifyListeners(event, data) {
        this.listeners
            .filter(listener => listener.event === event)
            .forEach(listener => listener.callback(data));
    }
    
    // ========================================================================
    // NOTIFICATION ACTIONS
    // ========================================================================
    
    async markAsRead(notificationId) {
        try {
            await supabase.markNotificationAsRead(notificationId);
            
            // Update local state
            const notification = this.notifications.find(n => n.id === notificationId);
            if (notification && !notification.is_read) {
                notification.is_read = true;
                this.unreadCount = Math.max(0, this.unreadCount - 1);
                this.updateBadge(this.unreadCount);
                this.notifyListeners('read', { notificationId });
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    }
    
    async markAllAsRead() {
        try {
            await supabase.markAllNotificationsAsRead();
            
            // Update local state
            this.notifications.forEach(n => n.is_read = true);
            this.unreadCount = 0;
            this.updateBadge(0);
            this.notifyListeners('allRead', {});
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    }
    
    async deleteNotification(notificationId) {
        try {
            await supabase.deleteNotification(notificationId);
            
            // Update local state
            const notification = this.notifications.find(n => n.id === notificationId);
            if (notification && !notification.is_read) {
                this.unreadCount = Math.max(0, this.unreadCount - 1);
            }
            
            this.notifications = this.notifications.filter(n => n.id !== notificationId);
            this.updateBadge(this.unreadCount);
            this.notifyListeners('delete', { notificationId });
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    }
    
    // ========================================================================
    // UI UPDATES
    // ========================================================================
    
    updateBadge(count) {
        const badge = document.querySelector('#notification-badge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }
    
    renderNotificationPanel(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="notification-panel">
                <div class="notification-header">
                    <h3>Notifications</h3>
                    <div class="notification-actions">
                        <button onclick="notificationSystem.markAllAsRead()" class="btn-text" title="Mark all as read">
                            <i class="fas fa-check-double"></i>
                        </button>
                        <button onclick="notificationSystem.loadNotifications()" class="btn-text" title="Refresh">
                            <i class="fas fa-sync"></i>
                        </button>
                    </div>
                </div>
                <div class="notification-body">
                    ${this.renderNotificationList()}
                </div>
            </div>
        `;
    }
    
    renderNotificationList() {
        if (this.notifications.length === 0) {
            return `
                <div class="notification-empty">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications</p>
                </div>
            `;
        }
        
        return this.notifications.map(notification => this.renderNotification(notification)).join('');
    }
    
    renderNotification(notification) {
        const icon = this.getNotificationIcon(notification.type);
        const timeAgo = this.getTimeAgo(notification.created_at);
        const isUnread = !notification.is_read;
        
        return `
            <div class="notification-item ${isUnread ? 'unread' : ''}" 
                 data-notification-id="${notification.id}">
                <div class="notification-icon ${notification.type.toLowerCase()}">
                    <i class="${icon}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-meta">
                        ${notification.from_user_name ? `
                            <span class="notification-sender">
                                <img src="${notification.from_user_avatar || this.getDefaultAvatar(notification.from_user_name)}" 
                                     class="avatar-xs" alt="${notification.from_user_name}">
                                ${notification.from_user_name}
                            </span>
                        ` : ''}
                        <span class="notification-time">${timeAgo}</span>
                    </div>
                </div>
                <div class="notification-actions-menu">
                    ${notification.action_url ? `
                        <button onclick="window.location.href='${notification.action_url}'" 
                                class="btn-text" title="View">
                            <i class="fas fa-external-link-alt"></i>
                        </button>
                    ` : ''}
                    ${isUnread ? `
                        <button onclick="notificationSystem.markAsRead('${notification.id}')" 
                                class="btn-text" title="Mark as read">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                    <button onclick="notificationSystem.deleteNotification('${notification.id}')" 
                            class="btn-text" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    // ========================================================================
    // UTILITIES
    // ========================================================================
    
    getNotificationIcon(type) {
        const icons = {
            MENTION: 'fas fa-at',
            ASSIGNMENT: 'fas fa-user-tag',
            COMMENT: 'fas fa-comment',
            STATUS_CHANGE: 'fas fa-exchange-alt',
            DEADLINE_REMINDER: 'fas fa-clock',
            RISK_ALERT: 'fas fa-exclamation-triangle',
            COMPLETION: 'fas fa-check-circle',
            REPLY: 'fas fa-reply'
        };
        return icons[type] || 'fas fa-bell';
    }
    
    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return date.toLocaleDateString();
    }
    
    getDefaultAvatar(name) {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=32&background=random`;
    }
    
    // ========================================================================
    // DESKTOP NOTIFICATIONS (Optional)
    // ========================================================================
    
    async requestPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return Notification.permission === 'granted';
    }
    
    showDesktopNotification(notification) {
        if (!APP_CONFIG.notifications?.desktop) return;
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.message,
                icon: '/assets/icon.svg',
                tag: notification.id
            });
        }
    }
}

// ============================================================================
// CSS STYLES (to be added to your CSS file)
// ============================================================================

const notificationStyles = `
.notification-panel {
    width: 400px;
    max-height: 600px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    display: flex;
    flex-direction: column;
}

.notification-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #e0e0e0;
}

.notification-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
}

.notification-actions {
    display: flex;
    gap: 8px;
}

.notification-body {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
}

.notification-empty {
    text-align: center;
    padding: 60px 20px;
    color: #999;
}

.notification-empty i {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
}

.notification-item {
    display: flex;
    gap: 12px;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 8px;
    transition: background 0.2s;
    cursor: pointer;
}

.notification-item:hover {
    background: #f5f5f5;
}

.notification-item.unread {
    background: #f0f7ff;
}

.notification-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.notification-icon.mention { background: #e3f2fd; color: #1976d2; }
.notification-icon.assignment { background: #f3e5f5; color: #7b1fa2; }
.notification-icon.comment { background: #e8f5e9; color: #388e3c; }
.notification-icon.status_change { background: #fff3e0; color: #f57c00; }
.notification-icon.deadline_reminder { background: #ffe0b2; color: #e65100; }
.notification-icon.risk_alert { background: #ffebee; color: #c62828; }
.notification-icon.completion { background: #e8f5e9; color: #2e7d32; }

.notification-content {
    flex: 1;
}

.notification-title {
    font-weight: 600;
    font-size: 14px;
    color: #333;
    margin-bottom: 4px;
}

.notification-message {
    font-size: 13px;
    color: #666;
    line-height: 1.4;
    margin-bottom: 8px;
}

.notification-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
    color: #999;
}

.notification-sender {
    display: flex;
    align-items: center;
    gap: 6px;
}

.notification-actions-menu {
    display: flex;
    flex-direction: column;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s;
}

.notification-item:hover .notification-actions-menu {
    opacity: 1;
}

#notification-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background: #f44336;
    color: white;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
}
`;

// Add styles to document
if (typeof document !== 'undefined') {
    const styleEl = document.createElement('style');
    styleEl.textContent = notificationStyles;
    document.head.appendChild(styleEl);
}

// ============================================================================
// EXPORT
// ============================================================================

export const notificationSystem = new NotificationSystem();
export default notificationSystem;

// Make it globally available
if (typeof window !== 'undefined') {
    window.notificationSystem = notificationSystem;
}
