// Minimal edge case test orchestrator
import 'dotenv/config';
import AdvancedEdgeCaseTestSuite from './advanced-edge-case-tests.js';

console.log('🔍 Running minimal test orchestrator...');

async function runEdgeCaseTests() {
    try {
        console.log('\n🔬 Starting Edge Case Tests');
        console.log('=' .repeat(60));
        
        const testSuite = new AdvancedEdgeCaseTestSuite();
        await testSuite.runAllTests();
        
        console.log('\n✅ Edge case testing completed!');
        console.log(`Tests Run: ${testSuite.results.totalTestsRun}`);
        console.log(`Passed: ${testSuite.results.totalPassed}`);
        console.log(`Failed: ${testSuite.results.totalFailed}`);
        
        if (testSuite.results.criticalIssues.length > 0) {
            console.log('\n🚨 Critical Issues:');
            testSuite.results.criticalIssues.forEach((issue, i) => {
                console.log(`${i + 1}. ${issue}`);
            });
        }
        
        if (testSuite.results.warnings.length > 0) {
            console.log('\n⚠️ Warnings:');
            testSuite.results.warnings.forEach((warning, i) => {
                console.log(`${i + 1}. ${warning}`);
            });
        }
    } catch (error) {
        console.error('\n❌ Edge case testing failed:', error.message);
        console.error('\nError stack:');
        console.error(error.stack);
        process.exit(1);
    }
}

runEdgeCaseTests();
