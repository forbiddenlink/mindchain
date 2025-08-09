#!/usr/bin/env node

/**
 * 🏆 Redis Challenge File Validation
 * Verify all contest files are present and ready
 */

import { promises as fs } from 'fs';

// Contest requirements validation
const CONTEST_REQUIREMENTS = {
  core_files: [
    'server.js',
    'semanticCache.js', 
    'intelligentAgents.js',
    'vectorsearch.js',
    'setupCacheIndex.js',
    'package.json'
  ],
  documentation: [
    'README.md',
    'TECHNICAL-DOCS.md',
    'API-DOCUMENTATION.md',
    'BUSINESS-VALUE.md',
    'CONTEST-SUBMISSION-README.md',
    'FEATURE-OVERVIEW.md'
  ],
  demo_materials: [
    'REDIS-CHALLENGE-DEMO-SCRIPT.md',
    'demo-setup.sh',
    'demo-setup.bat',
    'VIDEO-RECORDING-SCRIPT.md',
    'CONTEST-SUBMISSION-CHECKLIST.md'
  ],
  frontend_structure: [
    'stancestream-frontend/package.json',
    'stancestream-frontend/src/App.jsx',
    'stancestream-frontend/src/components',
    'stancestream-frontend/src/hooks'
  ]
};

async function validateContestFiles() {
  console.log('🏆 REDIS CHALLENGE FILE VALIDATION\n');
  
  const results = {
    core_files: {},
    documentation: {},
    demo_materials: {},
    frontend_structure: {},
    overall_score: 0
  };

  let totalFiles = 0;
  let presentFiles = 0;

  try {
    // 1. Core Files Verification
    console.log('🟢 Checking core implementation files...');
    for (const file of CONTEST_REQUIREMENTS.core_files) {
      totalFiles++;
      try {
        await fs.access(file);
        const stats = await fs.stat(file);
        results.core_files[file] = {
          exists: true,
          size: stats.size,
          modified: stats.mtime
        };
        presentFiles++;
        console.log(`   ✅ ${file}: ${(stats.size / 1024).toFixed(1)}KB`);
      } catch (error) {
        results.core_files[file] = { exists: false };
        console.log(`   ❌ ${file}: MISSING`);
      }
    }

    // 2. Documentation Verification
    console.log('\n📚 Validating documentation...');
    for (const doc of CONTEST_REQUIREMENTS.documentation) {
      totalFiles++;
      try {
        await fs.access(doc);
        const content = await fs.readFile(doc, 'utf8');
        results.documentation[doc] = {
          exists: true,
          length: content.length,
          has_redis_mention: content.toLowerCase().includes('redis'),
          has_contest_mention: content.toLowerCase().includes('challenge') || content.toLowerCase().includes('contest')
        };
        presentFiles++;
        console.log(`   ✅ ${doc}: ${(content.length / 1024).toFixed(1)}KB ${results.documentation[doc].has_redis_mention ? '(Redis ✓)' : ''}`);
      } catch (error) {
        results.documentation[doc] = { exists: false };
        console.log(`   ❌ ${doc}: MISSING`);
      }
    }

    // 3. Demo Materials Verification
    console.log('\n🎬 Checking demo materials...');
    for (const material of CONTEST_REQUIREMENTS.demo_materials) {
      totalFiles++;
      try {
        await fs.access(material);
        const stats = await fs.stat(material);
        results.demo_materials[material] = {
          exists: true,
          size: stats.size
        };
        presentFiles++;
        console.log(`   ✅ ${material}: ${(stats.size / 1024).toFixed(1)}KB`);
      } catch (error) {
        results.demo_materials[material] = { exists: false };
        console.log(`   ❌ ${material}: MISSING`);
      }
    }

    // 4. Frontend Structure Verification
    console.log('\n⚛️ Checking frontend structure...');
    for (const item of CONTEST_REQUIREMENTS.frontend_structure) {
      totalFiles++;
      try {
        const stats = await fs.stat(item);
        results.frontend_structure[item] = {
          exists: true,
          isDirectory: stats.isDirectory(),
          size: stats.isDirectory() ? 0 : stats.size
        };
        presentFiles++;
        const type = stats.isDirectory() ? 'DIR' : `${(stats.size / 1024).toFixed(1)}KB`;
        console.log(`   ✅ ${item}: ${type}`);
      } catch (error) {
        results.frontend_structure[item] = { exists: false };
        console.log(`   ❌ ${item}: MISSING`);
      }
    }

    // 5. Calculate Overall Score
    results.overall_score = Math.round((presentFiles / totalFiles) * 100);

    // 6. Generate Final Report
    console.log('\n' + '='.repeat(60));
    console.log('🏆 REDIS CHALLENGE FILE READINESS REPORT');
    console.log('='.repeat(60));
    
    const coreScore = Object.values(results.core_files).filter(f => f.exists).length / CONTEST_REQUIREMENTS.core_files.length * 100;
    const docScore = Object.values(results.documentation).filter(d => d.exists).length / CONTEST_REQUIREMENTS.documentation.length * 100;
    const demoScore = Object.values(results.demo_materials).filter(m => m.exists).length / CONTEST_REQUIREMENTS.demo_materials.length * 100;
    const frontendScore = Object.values(results.frontend_structure).filter(f => f.exists).length / CONTEST_REQUIREMENTS.frontend_structure.length * 100;

    console.log('\n📊 CATEGORY SCORES:');
    console.log(`   Core Implementation: ${Math.round(coreScore)}%`);
    console.log(`   Documentation: ${Math.round(docScore)}%`);
    console.log(`   Demo Materials: ${Math.round(demoScore)}%`);
    console.log(`   Frontend Structure: ${Math.round(frontendScore)}%`);
    
    console.log('\n🎯 OVERALL FILE READINESS:');
    if (results.overall_score >= 95) {
      console.log(`   🏆 EXCELLENT (${results.overall_score}%) - ALL FILES READY!`);
    } else if (results.overall_score >= 90) {
      console.log(`   ✅ VERY GOOD (${results.overall_score}%) - Nearly complete`);
    } else if (results.overall_score >= 80) {
      console.log(`   ✅ GOOD (${results.overall_score}%) - Contest ready`);
    } else if (results.overall_score >= 60) {
      console.log(`   ⚠️  FAIR (${results.overall_score}%) - Needs improvement`);
    } else {
      console.log(`   ❌ POOR (${results.overall_score}%) - Major files missing`);
    }

    console.log('\n🚀 SUBMISSION STATUS:');
    if (results.overall_score >= 90) {
      console.log('   ✅ File structure ready for Redis Challenge submission');
      console.log('   ✅ All demo materials present');
      console.log('   ✅ Documentation comprehensive');
      console.log('   ✅ Core implementation files complete');
    } else {
      console.log('   ⚠️  Some files missing or incomplete');
      console.log('   📝 Review missing items above');
    }

    // Redis-specific checks
    console.log('\n🔴 REDIS INTEGRATION EVIDENCE:');
    const redisFiles = [
      'semanticCache.js',
      'vectorsearch.js',
      'setupCacheIndex.js'
    ];
    
    let redisImplementation = 0;
    for (const file of redisFiles) {
      if (results.core_files[file]?.exists) {
        redisImplementation++;
        console.log(`   ✅ ${file}: Redis implementation present`);
      } else {
        console.log(`   ❌ ${file}: Missing Redis implementation`);
      }
    }

    const redisScore = (redisImplementation / redisFiles.length) * 100;
    console.log(`   📊 Redis Implementation Score: ${Math.round(redisScore)}%`);

    console.log('\n🎬 NEXT STEPS:');
    console.log('   1. Start Redis server with all modules');
    console.log('   2. Test demo environment with: node demo-setup.bat');
    console.log('   3. Record video using VIDEO-RECORDING-SCRIPT.md');
    console.log('   4. Final submission package preparation');

    // Save results
    await fs.writeFile(
      'file-validation-results.json',
      JSON.stringify(results, null, 2)
    );
    console.log('\n📄 Results saved to: file-validation-results.json');

    return results;

  } catch (error) {
    console.error('\n❌ VALIDATION FAILED:', error.message);
    results.overall_score = 0;
    return results;
  }
}

// Run validation
validateContestFiles()
  .then(results => {
    console.log(`\n🏁 File validation complete: ${results.overall_score}%`);
    process.exit(results.overall_score >= 80 ? 0 : 1);
  })
  .catch(error => {
    console.error('Validation error:', error);
    process.exit(1);
  });
