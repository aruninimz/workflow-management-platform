// Supabase Client for FlowBit SEP
import { SUPABASE_CONFIG } from './config.js';

class SupabaseClient {
    constructor() {
        this.url = SUPABASE_CONFIG.url;
        this.anonKey = SUPABASE_CONFIG.anonKey;
        this.authToken = null;
        this.currentUser = null;
        this.loadSession();
    }
    
    // ========================================================================
    // AUTHENTICATION
    // ========================================================================
    
    async signUp(email, password, fullName) {
        try {
            console.log('📝 Attempting signup for:', email);
            
            const response = await fetch(`${this.url}/auth/v1/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': this.anonKey
                },
                body: JSON.stringify({
                    email,
                    password,
                    data: {
                        full_name: fullName
                    }
                })
            });
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error.message);
            }
            
            if (!data.user) {
                throw new Error('Signup failed - no user returned');
            }
            
            console.log('✅ User created:', data.user.id);
            
            // Check if email confirmation is required
            if (!data.session || !data.session.access_token) {
                console.log('📧 Email confirmation required');
                return {
                    user: data.user,
                    session: null,
                    emailConfirmationRequired: true,
                    message: 'Please check your email to confirm your account before signing in.'
                };
            }
            
            // Save session
            this.authToken = data.session.access_token;
            this.currentUser = data.user;
            this.saveSession();
            
            console.log('✅ Signup complete - session saved');
            
            return { 
                user: data.user, 
                session: data.session, 
                emailConfirmationRequired: false 
            };
        } catch (error) {
            console.error('❌ Sign up error:', error);
            throw error;
        }
    }
    
    async signIn(email, password) {
        try {
            console.log('🔐 Attempting login for:', email);
            
            const response = await fetch(`${this.url}/auth/v1/token?grant_type=password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': this.anonKey
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error.message || 'Login failed');
            }
            
            if (!data.access_token) {
                throw new Error('No access token received');
            }
            
            this.authToken = data.access_token;
            this.currentUser = data.user;
            this.saveSession();
            
            console.log('✅ Login successful');
            
            return { user: data.user, session: data };
        } catch (error) {
            console.error('❌ Sign in error:', error);
            throw error;
        }
    }
    
    async signOut() {
        try {
            if (this.authToken) {
                await fetch(`${this.url}/auth/v1/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': this.anonKey,
                        'Authorization': `Bearer ${this.authToken}`
                    }
                });
            }
            
            this.authToken = null;
            this.currentUser = null;
            this.clearSession();
            
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            this.clearSession();
            throw error;
        }
    }
    
    async getCurrentUser() {
        if (!this.authToken) {
            return null;
        }
        
        // Return cached user if available
        if (this.currentUser) {
            return this.currentUser;
        }
        
        try {
            const response = await fetch(`${this.url}/auth/v1/user`, {
                headers: {
                    'apikey': this.anonKey,
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            
            const data = await response.json();
            
            // Check for JWT expired error
            if (data.error) {
                console.error('Auth error:', data.error);
                
                // If JWT expired, clear session and force re-login
                if (data.error.message && data.error.message.includes('JWT')) {
                    console.warn('⚠️ JWT token expired - clearing session');
                    this.clearSession();
                }
                
                return null;
            }
            
            this.currentUser = data;
            return data;
        } catch (error) {
            console.error('Get current user error:', error);
            return null;
        }
    }
    
    isAuthenticated() {
        return !!this.authToken;
    }
    
    saveSession() {
        localStorage.setItem('flowbit_auth_token', this.authToken);
        localStorage.setItem('flowbit_current_user', JSON.stringify(this.currentUser));
        console.log('💾 Session saved to localStorage');
    }
    
    loadSession() {
        this.authToken = localStorage.getItem('flowbit_auth_token');
        const userStr = localStorage.getItem('flowbit_current_user');
        this.currentUser = userStr ? JSON.parse(userStr) : null;
        
        if (this.authToken) {
            console.log('✅ Session loaded from localStorage');
        }
    }
    
    clearSession() {
        localStorage.removeItem('flowbit_auth_token');
        localStorage.removeItem('flowbit_current_user');
        console.log('🗑️ Session cleared');
    }
    
    // ========================================================================
    // USER PROFILES
    // ========================================================================
    
    async getUserProfile(userId) {
        try {
            const response = await fetch(`${this.url}/rest/v1/user_profiles?id=eq.${userId}`, {
                headers: {
                    'apikey': this.anonKey,
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            
            const data = await response.json();
            return data[0] || null;
        } catch (error) {
            console.error('Get user profile error:', error);
            return null;
        }
    }
    
    async updateUserProfile(userId, updates) {
        try {
            const response = await fetch(`${this.url}/rest/v1/user_profiles?id=eq.${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': this.anonKey,
                    'Authorization': `Bearer ${this.authToken}`,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(updates)
            });
            
            const data = await response.json();
            return data[0];
        } catch (error) {
            console.error('Update user profile error:', error);
            throw error;
        }
    }
    
    async getAllTeamMembers() {
        try {
            // Order by email instead of full_name (which might not exist)
            const response = await fetch(`${this.url}/rest/v1/user_profiles?order=email.asc`, {
                headers: {
                    'apikey': this.anonKey,
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Team members API error:', response.status, response.statusText);
                console.error('Error details:', errorText);
                return [];
            }
            
            const data = await response.json();
            console.log('Raw API response:', data);
            
            // Ensure we return an array
            if (Array.isArray(data)) {
                return data;
            } else if (data && typeof data === 'object') {
                console.warn('Team members response is not an array, wrapping:', data);
                return [data];
            }
            
            return [];
        } catch (error) {
            console.error('Get team members error:', error);
            return [];
        }
    }
    
    // ========================================================================
    // DATABASE OPERATIONS
    // ========================================================================
    
    async select(table, filter = null, options = {}) {
        try {
            let url = `${this.url}/rest/v1/${table}`;
            
            if (filter) {
                const [key, value] = Object.entries(filter)[0];
                url += `?${key}=eq.${value}`;
            }
            
            if (options.order) {
                url += `${filter ? '&' : '?'}order=${options.order}`;
            }
            
            if (options.limit) {
                url += `${filter || options.order ? '&' : '?'}limit=${options.limit}`;
            }
            
            const response = await fetch(url, {
                headers: {
                    'apikey': this.anonKey,
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Select error');
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Select from ${table} error:`, error);
            throw error;
        }
    }
    
    async insert(table, data) {
        try {
            const response = await fetch(`${this.url}/rest/v1/${table}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': this.anonKey,
                    'Authorization': `Bearer ${this.authToken}`,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Insert error');
            }
            
            const results = await response.json();
            return results[0];
        } catch (error) {
            console.error(`Insert into ${table} error:`, error);
            throw error;
        }
    }
    
    async update(table, id, updates) {
        try {
            const response = await fetch(`${this.url}/rest/v1/${table}?id=eq.${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': this.anonKey,
                    'Authorization': `Bearer ${this.authToken}`,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(updates)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Update error');
            }
            
            const results = await response.json();
            return results[0];
        } catch (error) {
            console.error(`Update ${table} error:`, error);
            throw error;
        }
    }
    
    async delete(table, id) {
        try {
            const response = await fetch(`${this.url}/rest/v1/${table}?id=eq.${id}`, {
                method: 'DELETE',
                headers: {
                    'apikey': this.anonKey,
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Delete error');
            }
            
            return { success: true };
        } catch (error) {
            console.error(`Delete from ${table} error:`, error);
            throw error;
        }
    }
}

// Create and export a single instance
const supabase = new SupabaseClient();
export default supabase;

// Also export the class for pages that need to create their own instance
export { SupabaseClient };
