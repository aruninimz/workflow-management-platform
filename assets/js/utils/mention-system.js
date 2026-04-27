
import supabase from '../config/supabase-client.js';

class MentionSystem {
    constructor() {
        this.teamMembers = [];
        this.mentionPattern = /@\[([^\]]+)\]\(([^)]+)\)/g; // @[Name](userId)
        this.typingPattern = /@(\w*)$/; // Detect @ while typing
        
        // Load team members
        this.loadTeamMembers();
    }
    
    // ========================================================================
    // TEAM MEMBERS
    // ========================================================================
    
    async loadTeamMembers() {
        try {
            this.teamMembers = await supabase.getAllTeamMembers();
            console.log(`✅ Loaded ${this.teamMembers.length} team members for mentions`);
        } catch (error) {
            console.error('Failed to load team members:', error);
            this.teamMembers = [];
        }
    }
    
    getTeamMembers() {
        return this.teamMembers;
    }
    
    searchTeamMembers(query) {
        if (!query) return this.teamMembers;
        
        const lowerQuery = query.toLowerCase();
        return this.teamMembers.filter(member => 
            member.full_name.toLowerCase().includes(lowerQuery) ||
            member.email.toLowerCase().includes(lowerQuery)
        );
    }
    
    // ========================================================================
    // AUTOCOMPLETE
    // ========================================================================
    
    /**
     * Initialize mention autocomplete on a text input/textarea
     * @param {HTMLElement} element - Input or textarea element
     * @param {Function} onMention - Callback when user selects a mention
     */
    initializeAutocomplete(element, onMention = null) {
        if (!element) return;
        
        // Create autocomplete dropdown
        const dropdown = this.createAutocompleteDropdown();
        element.parentElement.style.position = 'relative';
        element.parentElement.appendChild(dropdown);
        
        let isAutocompleteOpen = false;
        let currentQuery = '';
        let selectedIndex = 0;
        
        // Handle input
        element.addEventListener('input', (e) => {
            const cursorPos = element.selectionStart;
            const textBeforeCursor = element.value.substring(0, cursorPos);
            const match = textBeforeCursor.match(/@(\w*)$/);
            
            if (match) {
                currentQuery = match[1];
                const results = this.searchTeamMembers(currentQuery);
                this.showAutocomplete(dropdown, results, element);
                isAutocompleteOpen = true;
                selectedIndex = 0;
            } else {
                this.hideAutocomplete(dropdown);
                isAutocompleteOpen = false;
            }
        });
        
        // Handle keyboard navigation
        element.addEventListener('keydown', (e) => {
            if (!isAutocompleteOpen) return;
            
            const items = dropdown.querySelectorAll('.mention-item');
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
                this.updateSelection(items, selectedIndex);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, 0);
                this.updateSelection(items, selectedIndex);
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                if (items[selectedIndex]) {
                    e.preventDefault();
                    items[selectedIndex].click();
                }
            } else if (e.key === 'Escape') {
                this.hideAutocomplete(dropdown);
                isAutocompleteOpen = false;
            }
        });
        
        // Handle selection
        dropdown.addEventListener('click', (e) => {
            const item = e.target.closest('.mention-item');
            if (!item) return;
            
            const userId = item.dataset.userId;
            const userName = item.dataset.userName;
            
            // Insert mention into text
            this.insertMention(element, userName, userId);
            
            // Hide autocomplete
            this.hideAutocomplete(dropdown);
            isAutocompleteOpen = false;
            
            // Callback
            if (onMention) {
                onMention({ userId, userName });
            }
        });
        
        // Close on blur (with delay to allow clicks)
        element.addEventListener('blur', () => {
            setTimeout(() => {
                this.hideAutocomplete(dropdown);
                isAutocompleteOpen = false;
            }, 200);
        });
    }
    
    createAutocompleteDropdown() {
        const dropdown = document.createElement('div');
        dropdown.className = 'mention-autocomplete';
        dropdown.style.display = 'none';
        dropdown.innerHTML = '<div class="mention-list"></div>';
        return dropdown;
    }
    
    showAutocomplete(dropdown, results, inputElement) {
        const list = dropdown.querySelector('.mention-list');
        list.innerHTML = '';
        
        if (results.length === 0) {
            this.hideAutocomplete(dropdown);
            return;
        }
        
        results.slice(0, 5).forEach((member, index) => {
            const item = document.createElement('div');
            item.className = 'mention-item';
            if (index === 0) item.classList.add('selected');
            item.dataset.userId = member.id;
            item.dataset.userName = member.full_name;
            
            item.innerHTML = `
                <img src="${member.avatar_url || this.getDefaultAvatar(member.full_name)}" 
                     class="mention-avatar" alt="${member.full_name}">
                <div class="mention-info">
                    <div class="mention-name">${member.full_name}</div>
                    <div class="mention-email">${member.email}</div>
                </div>
            `;
            
            list.appendChild(item);
        });
        
        // Position dropdown below input
        const rect = inputElement.getBoundingClientRect();
        dropdown.style.display = 'block';
        dropdown.style.top = `${inputElement.offsetHeight}px`;
        dropdown.style.left = '0';
    }
    
    hideAutocomplete(dropdown) {
        dropdown.style.display = 'none';
    }
    
    updateSelection(items, selectedIndex) {
        items.forEach((item, index) => {
            if (index === selectedIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('selected');
            }
        });
    }
    
    insertMention(element, userName, userId) {
        const cursorPos = element.selectionStart;
        const textBefore = element.value.substring(0, cursorPos);
        const textAfter = element.value.substring(cursorPos);
        
        // Find the @ symbol position
        const atPos = textBefore.lastIndexOf('@');
        const beforeAt = textBefore.substring(0, atPos);
        
        // Insert mention in format: @[Name](userId)
        const mention = `@[${userName}](${userId})`;
        element.value = beforeAt + mention + ' ' + textAfter;
        
        // Move cursor after mention
        const newCursorPos = (beforeAt + mention + ' ').length;
        element.setSelectionRange(newCursorPos, newCursorPos);
        element.focus();
        
        // Trigger input event for any listeners
        element.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // ========================================================================
    // PARSING & EXTRACTION
    // ========================================================================
    
    /**
     * Parse mentions from text and return array of user IDs
     * @param {string} text - Text containing mentions
     * @returns {Array<string>} - Array of user IDs
     */
    parseMentions(text) {
        if (!text) return [];
        
        const mentions = [];
        const regex = /@\[([^\]]+)\]\(([^)]+)\)/g;
        let match;
        
        while ((match = regex.exec(text)) !== null) {
            const userId = match[2];
            if (userId && !mentions.includes(userId)) {
                mentions.push(userId);
            }
        }
        
        return mentions;
    }
    
    /**
     * Extract mention data (name and ID) from text
     * @param {string} text - Text containing mentions
     * @returns {Array<{name: string, id: string}>} - Array of mention objects
     */
    extractMentions(text) {
        if (!text) return [];
        
        const mentions = [];
        const regex = /@\[([^\]]+)\]\(([^)]+)\)/g;
        let match;
        
        while ((match = regex.exec(text)) !== null) {
            mentions.push({
                name: match[1],
                id: match[2]
            });
        }
        
        return mentions;
    }
    
    /**
     * Convert mentions to plain text for display
     * @param {string} text - Text with mention syntax
     * @returns {string} - Plain text with @names
     */
    mentionsToPlainText(text) {
        if (!text) return '';
        return text.replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1');
    }
    
    // ========================================================================
    // RENDERING & DISPLAY
    // ========================================================================
    
    /**
     * Render text with clickable mentions
     * @param {string} text - Text containing mentions
     * @param {HTMLElement} container - Container to render into
     */
    renderWithMentions(text, container) {
        if (!text) {
            container.textContent = '';
            return;
        }
        
        container.innerHTML = '';
        let lastIndex = 0;
        const regex = /@\[([^\]]+)\]\(([^)]+)\)/g;
        let match;
        
        while ((match = regex.exec(text)) !== null) {
            // Add text before mention
            if (match.index > lastIndex) {
                const textNode = document.createTextNode(text.substring(lastIndex, match.index));
                container.appendChild(textNode);
            }
            
            // Add mention as clickable link
            const mention = document.createElement('span');
            mention.className = 'mention-tag';
            mention.textContent = '@' + match[1];
            mention.dataset.userId = match[2];
            mention.onclick = () => this.onMentionClick(match[2], match[1]);
            container.appendChild(mention);
            
            lastIndex = regex.lastIndex;
        }
        
        // Add remaining text
        if (lastIndex < text.length) {
            const textNode = document.createTextNode(text.substring(lastIndex));
            container.appendChild(textNode);
        }
    }
    
    /**
     * Convert text with mentions to HTML
     * @param {string} text - Text containing mentions
     * @returns {string} - HTML string with styled mentions
     */
    mentionsToHTML(text) {
        if (!text) return '';
        
        return text.replace(
            /@\[([^\]]+)\]\(([^)]+)\)/g,
            '<span class="mention-tag" data-user-id="$2" onclick="mentionSystem.onMentionClick(\'$2\', \'$1\')">@$1</span>'
        );
    }
    
    onMentionClick(userId, userName) {
        console.log('Mention clicked:', { userId, userName });
        // Could show user profile modal, navigate to profile, etc.
        // window.location.href = `/profile/${userId}`;
    }
    
    // ========================================================================
    // UTILITIES
    // ========================================================================
    
    getDefaultAvatar(name) {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=40&background=random`;
    }
    
    /**
     * Validate if text contains valid mentions
     * @param {string} text - Text to validate
     * @returns {boolean} - True if all mentions are valid
     */
    validateMentions(text) {
        const mentions = this.extractMentions(text);
        const validUserIds = this.teamMembers.map(m => m.id);
        
        return mentions.every(mention => validUserIds.includes(mention.id));
    }
    
    /**
     * Count mentions in text
     * @param {string} text - Text to analyze
     * @returns {number} - Number of mentions
     */
    countMentions(text) {
        if (!text) return 0;
        const matches = text.match(/@\[([^\]]+)\]\(([^)]+)\)/g);
        return matches ? matches.length : 0;
    }
}

// ============================================================================
// CSS STYLES (to be added to your CSS file)
// ============================================================================

const mentionStyles = `
.mention-autocomplete {
    position: absolute;
    z-index: 1000;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    max-height: 200px;
    overflow-y: auto;
    width: 300px;
}

.mention-list {
    padding: 4px;
}

.mention-item {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    cursor: pointer;
    border-radius: 6px;
    transition: background 0.2s;
}

.mention-item:hover,
.mention-item.selected {
    background: #f0f7ff;
}

.mention-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    margin-right: 12px;
}

.mention-info {
    flex: 1;
}

.mention-name {
    font-weight: 500;
    font-size: 14px;
    color: #333;
}

.mention-email {
    font-size: 12px;
    color: #666;
}

.mention-tag {
    display: inline-block;
    background: #e3f2fd;
    color: #1976d2;
    padding: 2px 8px;
    border-radius: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.mention-tag:hover {
    background: #bbdefb;
    color: #0d47a1;
}
`;

// Add styles to document
if (typeof document !== 'undefined') {
    const styleEl = document.createElement('style');
    styleEl.textContent = mentionStyles;
    document.head.appendChild(styleEl);
}

// ============================================================================
// EXPORT
// ============================================================================

export const mentionSystem = new MentionSystem();
export default mentionSystem;

// Make it globally available for onclick handlers
if (typeof window !== 'undefined') {
    window.mentionSystem = mentionSystem;
}
