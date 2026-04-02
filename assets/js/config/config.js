/**
 * FlowBit SEP - Configuration
 * ⚠️ This file contains sensitive credentials - DO NOT commit to GitHub!
 */

export const SUPABASE_CONFIG = {
    url: 'https://qbqvgmiujpwifwkdcdtp.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFicXZnbWl1anB3aWZ3a2RjZHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3ODMwMTAsImV4cCI6MjA4NzM1OTAxMH0.aJOBXD8DxJZpy12IZEEQ54zRRlgoyJgG7_pujPeeTO4'
};

export const APP_CONFIG = {
    appName: 'FlowBit SEP',
    version: '1.0.0',
    environment: 'development',
    features: {
        notifications: true,
        mentions: true,
        comments: true,
        activityFeed: true,
        riskEngine: true,
        insights: true
    },
    notifications: {
        pollInterval: 30,
        desktop: false,
        autoMarkReadDelay: 5
    },
    ui: {
        theme: 'light',
        pageSize: 20,
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm'
    },
    api: {
        timeout: 30000,
        retry: true,
        retries: 3
    }
};

export function validateConfig() {
    const errors = [];
    if (!SUPABASE_CONFIG.url || SUPABASE_CONFIG.url === 'YOUR_SUPABASE_URL_HERE') {
        errors.push('Supabase URL is not configured');
    }
    if (!SUPABASE_CONFIG.anonKey || SUPABASE_CONFIG.anonKey === 'YOUR_SUPABASE_ANON_KEY_HERE') {
        errors.push('Supabase anon key is not configured');
    }
    if (errors.length > 0) {
        console.error('❌ Configuration errors:', errors);
        console.error('📝 Please update src/js/config.js with your Supabase credentials');
        return false;
    }
    console.log('✅ Configuration validated');
    return true;
}
