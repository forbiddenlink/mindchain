import { PresentationOptimizer } from './presentationOptimizer.js';

console.log('✅ ES module import working correctly');
console.log('📝 PresentationOptimizer class available:', typeof PresentationOptimizer);

// Quick test without Redis connection
const optimizer = new PresentationOptimizer();
console.log('🎯 PresentationOptimizer instantiated successfully');
