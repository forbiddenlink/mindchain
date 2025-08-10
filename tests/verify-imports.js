import 'dotenv/config';
import { createClient } from 'redis';
import axios from 'axios';

console.log('🔍 Testing module imports...');

try {
    console.log('✅ ES modules loading correctly');
    console.log('📦 Testing Redis import:', typeof createClient);
    console.log('🌐 Testing Axios import:', typeof axios);
} catch (error) {
    console.error('❌ Import error:', error);
}
