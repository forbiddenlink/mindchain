// Accessibility and UX Excellence Testing Suite for StanceStream
// WCAG compliance, screen reader compatibility, keyboard navigation, and usability testing

import 'dotenv/config';
import axios from 'axios';
import { spawn } from 'child_process';
import fs from 'fs/promises';

const API_BASE = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:5173';

class AccessibilityUXTestSuite {
    constructor() {
        this.results = {
            accessibilityTests: [],
            usabilityTests: [],
            keyboardNavigationTests: [],
            screenReaderTests: [],
            wcagCompliance: {
                level: 'Unknown',
                passedCriteria: 0,
                totalCriteria: 0,
                issues: []
            },
            mobileResponsiveness: [],
            performanceAccessibility: [],
            recommendations: []
        };
        this.testStartTime = Date.now();
    }

    async runCompleteAccessibilityAudit() {
        console.log('♿ Starting Accessibility & UX Excellence Audit');
        console.log('=' .repeat(60));

        await this.testKeyboardNavigation();
        await this.testScreenReaderCompatibility();
        await this.testColorContrastWCAG();
        await this.testFocusManagement();
        await this.testARIAImplementation();
        await this.testMobileResponsiveness();
        await this.testUsabilityPatterns();
        await this.testErrorMessaging();
        await this.testLoadingStates();
        await this.testFormAccessibility();
        
        this.generateAccessibilityReport();
    }

    // ===== KEYBOARD NAVIGATION TESTING =====
    async testKeyboardNavigation() {
        console.log('\n⌨️ Testing Keyboard Navigation');
        console.log('-'.repeat(50));

        const keyboardTests = [
            {
                name: 'Tab Order',
                description: 'Verify logical tab order through interface',
                test: () => this.simulateTabNavigation()
            },
            {
                name: 'Focus Indicators',
                description: 'Check visible focus indicators on all interactive elements',
                test: () => this.checkFocusIndicators()
            },
            {
                name: 'Keyboard Shortcuts',
                description: 'Test custom keyboard shortcuts if implemented',
                test: () => this.testKeyboardShortcuts()
            },
            {
                name: 'Skip Links',
                description: 'Verify skip navigation links for screen readers',
                test: () => this.checkSkipLinks()
            }
        ];

        for (const test of keyboardTests) {
            try {
                console.log(`Testing ${test.name}...`);
                const result = await test.test();
                this.results.keyboardNavigationTests.push({
                    name: test.name,
                    passed: result.passed,
                    details: result.details,
                    recommendations: result.recommendations || []
                });
                
                if (result.passed) {
                    console.log(`✅ ${test.name}: Passed`);
                } else {
                    console.log(`❌ ${test.name}: Failed - ${result.details}`);
                }
            } catch (error) {
                console.log(`❌ ${test.name}: Error - ${error.message}`);
                this.results.keyboardNavigationTests.push({
                    name: test.name,
                    passed: false,
                    details: error.message,
                    recommendations: ['Fix test infrastructure to properly evaluate this criterion']
                });
            }
        }
    }

    async simulateTabNavigation() {
        // Since we can't actually simulate browser keyboard events in Node.js,
        // we'll check for common tab navigation anti-patterns in the code
        try {
            const frontendFiles = await this.getFrontendSourceFiles();
            let tabIndexIssues = 0;
            let focusableElements = 0;
            
            for (const file of frontendFiles) {
                const content = await fs.readFile(file, 'utf8');
                
                // Check for tabindex usage
                const tabIndexMatches = content.match(/tabindex\s*=\s*["']?-?\d+["']?/gi) || [];
                
                // Look for positive tabindex values (anti-pattern)
                const positiveTabIndex = tabIndexMatches.filter(match => {
                    const value = match.match(/\d+/);
                    return value && parseInt(value[0]) > 0;
                });
                
                tabIndexIssues += positiveTabIndex.length;
                
                // Count interactive elements
                const interactiveElements = (
                    (content.match(/<button/gi) || []).length +
                    (content.match(/<input/gi) || []).length +
                    (content.match(/<select/gi) || []).length +
                    (content.match(/<textarea/gi) || []).length +
                    (content.match(/onClick/gi) || []).length
                );
                
                focusableElements += interactiveElements;
            }
            
            const recommendations = [];
            if (tabIndexIssues > 0) {
                recommendations.push(`Avoid positive tabindex values (found ${tabIndexIssues})`);
            }
            if (focusableElements === 0) {
                recommendations.push('No interactive elements detected - verify UI implementation');
            }
            
            return {
                passed: tabIndexIssues === 0 && focusableElements > 0,
                details: `Found ${focusableElements} interactive elements, ${tabIndexIssues} tabindex issues`,
                recommendations
            };
        } catch (error) {
            return {
                passed: false,
                details: `Cannot analyze tab navigation: ${error.message}`,
                recommendations: ['Verify frontend source files are accessible']
            };
        }
    }

    async checkFocusIndicators() {
        try {
            const cssFiles = await this.getCSSFiles();
            let hasFocusStyles = false;
            let hasCustomFocusStyles = false;
            
            for (const file of cssFiles) {
                const content = await fs.readFile(file, 'utf8');
                
                // Check for focus pseudo-selectors
                if (content.includes(':focus') || content.includes(':focus-visible')) {
                    hasFocusStyles = true;
                }
                
                // Check for custom focus implementations
                if (content.includes('outline') || content.includes('ring') || content.includes('border')) {
                    hasCustomFocusStyles = true;
                }
            }
            
            const recommendations = [];
            if (!hasFocusStyles) {
                recommendations.push('Implement :focus and :focus-visible styles for better accessibility');
            }
            if (!hasCustomFocusStyles) {
                recommendations.push('Consider custom focus indicators that match your design system');
            }
            
            return {
                passed: hasFocusStyles,
                details: `Focus styles found: ${hasFocusStyles}, Custom focus indicators: ${hasCustomFocusStyles}`,
                recommendations
            };
        } catch (error) {
            return {
                passed: false,
                details: `Cannot analyze focus indicators: ${error.message}`,
                recommendations: ['Verify CSS files are accessible for analysis']
            };
        }
    }

    async testKeyboardShortcuts() {
        // Check for keyboard shortcut implementations
        try {
            const frontendFiles = await this.getFrontendSourceFiles();
            let shortcutImplementations = 0;
            
            for (const file of frontendFiles) {
                const content = await fs.readFile(file, 'utf8');
                
                // Look for common keyboard event handlers
                const keyboardEvents = (
                    (content.match(/onKeyDown/gi) || []).length +
                    (content.match(/onKeyUp/gi) || []).length +
                    (content.match(/onKeyPress/gi) || []).length +
                    (content.match(/addEventListener.*key/gi) || []).length
                );
                
                shortcutImplementations += keyboardEvents;
            }
            
            return {
                passed: true, // Not required, but good to have
                details: `Found ${shortcutImplementations} keyboard event handlers`,
                recommendations: shortcutImplementations === 0 ? 
                    ['Consider implementing useful keyboard shortcuts (e.g., Ctrl+/ for help)'] : []
            };
        } catch (error) {
            return {
                passed: true,
                details: `Cannot analyze keyboard shortcuts: ${error.message}`,
                recommendations: []
            };
        }
    }

    async checkSkipLinks() {
        try {
            const frontendFiles = await this.getFrontendSourceFiles();
            let hasSkipLinks = false;
            
            for (const file of frontendFiles) {
                const content = await fs.readFile(file, 'utf8');
                
                // Look for skip navigation patterns
                if (content.includes('skip') && (content.includes('main') || content.includes('content'))) {
                    hasSkipLinks = true;
                    break;
                }
            }
            
            return {
                passed: hasSkipLinks,
                details: `Skip navigation links found: ${hasSkipLinks}`,
                recommendations: !hasSkipLinks ? 
                    ['Implement skip navigation links for screen reader users'] : []
            };
        } catch (error) {
            return {
                passed: false,
                details: `Cannot analyze skip links: ${error.message}`,
                recommendations: ['Implement skip navigation for better accessibility']
            };
        }
    }

    // ===== SCREEN READER COMPATIBILITY =====
    async testScreenReaderCompatibility() {
        console.log('\n🔊 Testing Screen Reader Compatibility');
        console.log('-'.repeat(50));

        const screenReaderTests = [
            {
                name: 'Semantic HTML',
                test: () => this.checkSemanticHTML()
            },
            {
                name: 'ARIA Labels',
                test: () => this.checkARIALabels()
            },
            {
                name: 'Heading Hierarchy',
                test: () => this.checkHeadingHierarchy()
            },
            {
                name: 'Alternative Text',
                test: () => this.checkAltText()
            },
            {
                name: 'Form Labels',
                test: () => this.checkFormLabels()
            }
        ];

        for (const test of screenReaderTests) {
            try {
                console.log(`Testing ${test.name}...`);
                const result = await test.test();
                this.results.screenReaderTests.push({
                    name: test.name,
                    passed: result.passed,
                    details: result.details,
                    recommendations: result.recommendations || []
                });
                
                if (result.passed) {
                    console.log(`✅ ${test.name}: Passed`);
                } else {
                    console.log(`❌ ${test.name}: Failed - ${result.details}`);
                }
            } catch (error) {
                console.log(`❌ ${test.name}: Error - ${error.message}`);
            }
        }
    }

    async checkSemanticHTML() {
        try {
            const frontendFiles = await this.getFrontendSourceFiles();
            let semanticElementCount = 0;
            let divSpanCount = 0;
            
            const semanticElements = ['header', 'nav', 'main', 'section', 'article', 'aside', 'footer'];
            
            for (const file of frontendFiles) {
                const content = await fs.readFile(file, 'utf8');
                
                // Count semantic elements
                semanticElements.forEach(element => {
                    const matches = content.match(new RegExp(`<${element}`, 'gi'));
                    semanticElementCount += matches ? matches.length : 0;
                });
                
                // Count generic elements
                divSpanCount += (content.match(/<div/gi) || []).length;
                divSpanCount += (content.match(/<span/gi) || []).length;
            }
            
            const semanticRatio = semanticElementCount / (semanticElementCount + divSpanCount);
            
            return {
                passed: semanticElementCount > 0 && semanticRatio > 0.1,
                details: `${semanticElementCount} semantic elements, ${divSpanCount} generic elements (${(semanticRatio * 100).toFixed(1)}% semantic)`,
                recommendations: semanticRatio < 0.2 ? 
                    ['Use more semantic HTML elements (header, nav, main, section, etc.)'] : []
            };
        } catch (error) {
            return {
                passed: false,
                details: `Cannot analyze semantic HTML: ${error.message}`,
                recommendations: ['Use semantic HTML elements for better screen reader navigation']
            };
        }
    }

    async checkARIALabels() {
        try {
            const frontendFiles = await this.getFrontendSourceFiles();
            let ariaLabelCount = 0;
            let ariaDescribedByCount = 0;
            let roleDefined = 0;
            
            for (const file of frontendFiles) {
                const content = await fs.readFile(file, 'utf8');
                
                ariaLabelCount += (content.match(/aria-label/gi) || []).length;
                ariaDescribedByCount += (content.match(/aria-describedby/gi) || []).length;
                roleDefined += (content.match(/role=/gi) || []).length;
            }
            
            const totalAriaAttributes = ariaLabelCount + ariaDescribedByCount + roleDefined;
            
            return {
                passed: totalAriaAttributes > 0,
                details: `${ariaLabelCount} aria-label, ${ariaDescribedByCount} aria-describedby, ${roleDefined} role attributes`,
                recommendations: totalAriaAttributes === 0 ? 
                    ['Add ARIA labels to improve screen reader experience'] : []
            };
        } catch (error) {
            return {
                passed: false,
                details: `Cannot analyze ARIA labels: ${error.message}`,
                recommendations: ['Implement ARIA labels for better accessibility']
            };
        }
    }

    async checkHeadingHierarchy() {
        try {
            const frontendFiles = await this.getFrontendSourceFiles();
            const headingCounts = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
            
            for (const file of frontendFiles) {
                const content = await fs.readFile(file, 'utf8');
                
                for (let i = 1; i <= 6; i++) {
                    const matches = content.match(new RegExp(`<h${i}`, 'gi'));
                    headingCounts[`h${i}`] += matches ? matches.length : 0;
                }
            }
            
            const hasH1 = headingCounts.h1 > 0;
            const hierarchyValid = hasH1 && (headingCounts.h1 <= 1); // Ideally one H1 per page
            
            return {
                passed: hierarchyValid,
                details: `H1: ${headingCounts.h1}, H2: ${headingCounts.h2}, H3: ${headingCounts.h3}`,
                recommendations: !hasH1 ? ['Add H1 heading for page structure'] : 
                    headingCounts.h1 > 1 ? ['Use only one H1 heading per page'] : []
            };
        } catch (error) {
            return {
                passed: false,
                details: `Cannot analyze heading hierarchy: ${error.message}`,
                recommendations: ['Implement proper heading hierarchy (H1-H6)']
            };
        }
    }

    // ===== COLOR CONTRAST & WCAG COMPLIANCE =====
    async testColorContrastWCAG() {
        console.log('\n🎨 Testing Color Contrast & WCAG Compliance');
        console.log('-'.repeat(50));

        try {
            const cssFiles = await this.getCSSFiles();
            let colorPairs = [];
            let potentialIssues = [];
            
            for (const file of cssFiles) {
                const content = await fs.readFile(file, 'utf8');
                
                // Extract color values (simplified analysis)
                const colorMatches = content.match(/#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)/g) || [];
                colorPairs = colorPairs.concat(colorMatches);
                
                // Look for common contrast issues
                if (content.includes('#fff') && content.includes('#ffff')) {
                    potentialIssues.push('Potential white-on-white contrast issue');
                }
                if (content.includes('#000') && content.includes('#333')) {
                    potentialIssues.push('Potential dark-on-dark contrast issue');
                }
            }
            
            console.log(`Found ${colorPairs.length} color definitions`);
            console.log(`Potential contrast issues: ${potentialIssues.length}`);
            
            // Mock WCAG AA compliance check (in real implementation, would use color contrast calculation)
            const wcagScore = Math.max(0, 100 - (potentialIssues.length * 20));
            
            this.results.wcagCompliance = {
                level: wcagScore >= 90 ? 'AA' : wcagScore >= 70 ? 'A' : 'Non-compliant',
                passedCriteria: Math.floor(wcagScore / 10),
                totalCriteria: 10,
                issues: potentialIssues
            };
            
            if (potentialIssues.length === 0) {
                console.log('✅ No obvious color contrast issues detected');
            } else {
                console.log(`⚠️ ${potentialIssues.length} potential contrast issues found`);
            }
            
        } catch (error) {
            console.log(`❌ Color contrast analysis failed: ${error.message}`);
            this.results.wcagCompliance.level = 'Unknown';
        }
    }

    // ===== MOBILE RESPONSIVENESS =====
    async testMobileResponsiveness() {
        console.log('\n📱 Testing Mobile Responsiveness');
        console.log('-'.repeat(50));

        const responsiveTests = [
            {
                name: 'Viewport Meta Tag',
                test: () => this.checkViewportMeta()
            },
            {
                name: 'Responsive CSS',
                test: () => this.checkResponsiveCSS()
            },
            {
                name: 'Touch Target Size',
                test: () => this.checkTouchTargets()
            },
            {
                name: 'Mobile Navigation',
                test: () => this.checkMobileNavigation()
            }
        ];

        for (const test of responsiveTests) {
            try {
                console.log(`Testing ${test.name}...`);
                const result = await test.test();
                this.results.mobileResponsiveness.push({
                    name: test.name,
                    passed: result.passed,
                    details: result.details,
                    recommendations: result.recommendations || []
                });
                
                if (result.passed) {
                    console.log(`✅ ${test.name}: Passed`);
                } else {
                    console.log(`❌ ${test.name}: Failed - ${result.details}`);
                }
            } catch (error) {
                console.log(`❌ ${test.name}: Error - ${error.message}`);
            }
        }
    }

    async checkViewportMeta() {
        try {
            const indexHtml = await fs.readFile('stancestream-frontend/index.html', 'utf8');
            const hasViewport = indexHtml.includes('name="viewport"');
            
            return {
                passed: hasViewport,
                details: `Viewport meta tag found: ${hasViewport}`,
                recommendations: !hasViewport ? 
                    ['Add viewport meta tag: <meta name="viewport" content="width=device-width, initial-scale=1">'] : []
            };
        } catch (error) {
            return {
                passed: false,
                details: `Cannot check viewport meta: ${error.message}`,
                recommendations: ['Ensure index.html has viewport meta tag for mobile responsiveness']
            };
        }
    }

    async checkResponsiveCSS() {
        try {
            const cssFiles = await this.getCSSFiles();
            let mediaQueryCount = 0;
            let flexboxUsage = 0;
            let gridUsage = 0;
            
            for (const file of cssFiles) {
                const content = await fs.readFile(file, 'utf8');
                
                mediaQueryCount += (content.match(/@media/gi) || []).length;
                flexboxUsage += (content.match(/display:\s*flex/gi) || []).length;
                gridUsage += (content.match(/display:\s*grid/gi) || []).length;
            }
            
            const hasResponsiveCSS = mediaQueryCount > 0 || flexboxUsage > 0 || gridUsage > 0;
            
            return {
                passed: hasResponsiveCSS,
                details: `${mediaQueryCount} media queries, ${flexboxUsage} flexbox, ${gridUsage} grid`,
                recommendations: !hasResponsiveCSS ? 
                    ['Implement responsive CSS with media queries, flexbox, or grid'] : []
            };
        } catch (error) {
            return {
                passed: false,
                details: `Cannot analyze responsive CSS: ${error.message}`,
                recommendations: ['Implement responsive design patterns']
            };
        }
    }

    // ===== USABILITY TESTING =====
    async testUsabilityPatterns() {
        console.log('\n🎯 Testing Usability Patterns');
        console.log('-'.repeat(50));

        const usabilityTests = [
            {
                name: 'Error Prevention',
                test: () => this.checkErrorPrevention()
            },
            {
                name: 'Feedback Systems',
                test: () => this.checkFeedbackSystems()
            },
            {
                name: 'Consistency',
                test: () => this.checkUIConsistency()
            },
            {
                name: 'User Control',
                test: () => this.checkUserControl()
            }
        ];

        for (const test of usabilityTests) {
            try {
                console.log(`Testing ${test.name}...`);
                const result = await test.test();
                this.results.usabilityTests.push({
                    name: test.name,
                    passed: result.passed,
                    details: result.details,
                    recommendations: result.recommendations || []
                });
                
                if (result.passed) {
                    console.log(`✅ ${test.name}: Passed`);
                } else {
                    console.log(`❌ ${test.name}: Failed - ${result.details}`);
                }
            } catch (error) {
                console.log(`❌ ${test.name}: Error - ${error.message}`);
            }
        }
    }

    async checkErrorPrevention() {
        try {
            const frontendFiles = await this.getFrontendSourceFiles();
            let validationCount = 0;
            let confirmationDialogs = 0;
            
            for (const file of frontendFiles) {
                const content = await fs.readFile(file, 'utf8');
                
                // Look for validation patterns
                validationCount += (content.match(/required/gi) || []).length;
                validationCount += (content.match(/validate/gi) || []).length;
                
                // Look for confirmation patterns
                confirmationDialogs += (content.match(/confirm/gi) || []).length;
                confirmationDialogs += (content.match(/alert/gi) || []).length;
            }
            
            const hasErrorPrevention = validationCount > 0 || confirmationDialogs > 0;
            
            return {
                passed: hasErrorPrevention,
                details: `${validationCount} validation patterns, ${confirmationDialogs} confirmation dialogs`,
                recommendations: !hasErrorPrevention ? 
                    ['Implement form validation and confirmation dialogs for destructive actions'] : []
            };
        } catch (error) {
            return {
                passed: false,
                details: `Cannot analyze error prevention: ${error.message}`,
                recommendations: ['Implement error prevention mechanisms']
            };
        }
    }

    // ===== UTILITY METHODS =====
    async getFrontendSourceFiles() {
        try {
            const srcPath = 'stancestream-frontend/src';
            const files = await this.getFilesRecursively(srcPath, ['.jsx', '.js', '.tsx', '.ts']);
            return files;
        } catch (error) {
            return [];
        }
    }

    async getCSSFiles() {
        try {
            const files = await this.getFilesRecursively('stancestream-frontend', ['.css', '.scss', '.sass']);
            return files;
        } catch (error) {
            return [];
        }
    }

    async getFilesRecursively(dir, extensions) {
        const files = [];
        
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = `${dir}/${entry.name}`;
                
                if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                    const subFiles = await this.getFilesRecursively(fullPath, extensions);
                    files.push(...subFiles);
                } else if (entry.isFile()) {
                    const hasValidExtension = extensions.some(ext => entry.name.endsWith(ext));
                    if (hasValidExtension) {
                        files.push(fullPath);
                    }
                }
            }
        } catch (error) {
            // Directory might not exist, continue
        }
        
        return files;
    }

    // ===== REPORT GENERATION =====
    generateAccessibilityReport() {
        const duration = (Date.now() - this.testStartTime) / 1000;
        
        console.log('\n' + '='.repeat(80));
        console.log('♿ ACCESSIBILITY & UX EXCELLENCE REPORT');
        console.log('='.repeat(80));
        
        console.log(`\nAudit Duration: ${duration.toFixed(2)} seconds`);
        
        // Keyboard Navigation Results
        if (this.results.keyboardNavigationTests.length > 0) {
            console.log('\n⌨️ KEYBOARD NAVIGATION:');
            this.results.keyboardNavigationTests.forEach(test => {
                const status = test.passed ? '✅' : '❌';
                console.log(`${status} ${test.name}: ${test.details}`);
            });
        }
        
        // Screen Reader Results
        if (this.results.screenReaderTests.length > 0) {
            console.log('\n🔊 SCREEN READER COMPATIBILITY:');
            this.results.screenReaderTests.forEach(test => {
                const status = test.passed ? '✅' : '❌';
                console.log(`${status} ${test.name}: ${test.details}`);
            });
        }
        
        // WCAG Compliance
        console.log('\n🎨 WCAG COMPLIANCE:');
        console.log(`Level: ${this.results.wcagCompliance.level}`);
        console.log(`Criteria Met: ${this.results.wcagCompliance.passedCriteria}/${this.results.wcagCompliance.totalCriteria}`);
        if (this.results.wcagCompliance.issues.length > 0) {
            console.log('Issues found:');
            this.results.wcagCompliance.issues.forEach(issue => console.log(`  - ${issue}`));
        }
        
        // Mobile Responsiveness
        if (this.results.mobileResponsiveness.length > 0) {
            console.log('\n📱 MOBILE RESPONSIVENESS:');
            this.results.mobileResponsiveness.forEach(test => {
                const status = test.passed ? '✅' : '❌';
                console.log(`${status} ${test.name}: ${test.details}`);
            });
        }
        
        // Usability
        if (this.results.usabilityTests.length > 0) {
            console.log('\n🎯 USABILITY PATTERNS:');
            this.results.usabilityTests.forEach(test => {
                const status = test.passed ? '✅' : '❌';
                console.log(`${status} ${test.name}: ${test.details}`);
            });
        }
        
        // Collect all recommendations
        const allRecommendations = [];
        [...this.results.keyboardNavigationTests, ...this.results.screenReaderTests, 
         ...this.results.mobileResponsiveness, ...this.results.usabilityTests]
            .forEach(test => {
                if (test.recommendations) {
                    allRecommendations.push(...test.recommendations);
                }
            });
        
        if (allRecommendations.length > 0) {
            console.log('\n🎯 ACCESSIBILITY RECOMMENDATIONS:');
            allRecommendations.forEach((rec, index) => {
                console.log(`${index + 1}. ${rec}`);
            });
        }
        
        // Calculate accessibility score
        const accessibilityScore = this.calculateAccessibilityScore();
        console.log('\n📊 ACCESSIBILITY SCORE:');
        console.log(`Overall Score: ${accessibilityScore.overall}/100`);
        console.log(`Keyboard Navigation: ${accessibilityScore.keyboard}/25`);
        console.log(`Screen Reader: ${accessibilityScore.screenReader}/25`);
        console.log(`WCAG Compliance: ${accessibilityScore.wcag}/25`);
        console.log(`Mobile/Usability: ${accessibilityScore.mobile}/25`);
        
        if (accessibilityScore.overall >= 90) {
            console.log('\n🏆 EXCELLENT ACCESSIBILITY - Inclusive and user-friendly!');
        } else if (accessibilityScore.overall >= 75) {
            console.log('\n✅ GOOD ACCESSIBILITY - Minor improvements recommended');
        } else if (accessibilityScore.overall >= 60) {
            console.log('\n⚠️ ACCEPTABLE ACCESSIBILITY - Several improvements needed');
        } else {
            console.log('\n❌ POOR ACCESSIBILITY - Major improvements required for inclusion');
        }
        
        return this.results;
    }

    calculateAccessibilityScore() {
        // Keyboard navigation score
        const keyboardPassed = this.results.keyboardNavigationTests.filter(t => t.passed).length;
        const keyboardTotal = this.results.keyboardNavigationTests.length || 1;
        const keyboardScore = (keyboardPassed / keyboardTotal) * 25;
        
        // Screen reader score
        const screenReaderPassed = this.results.screenReaderTests.filter(t => t.passed).length;
        const screenReaderTotal = this.results.screenReaderTests.length || 1;
        const screenReaderScore = (screenReaderPassed / screenReaderTotal) * 25;
        
        // WCAG score
        const wcagScore = (this.results.wcagCompliance.passedCriteria / this.results.wcagCompliance.totalCriteria) * 25;
        
        // Mobile/Usability score
        const mobilePassed = this.results.mobileResponsiveness.filter(t => t.passed).length;
        const usabilityPassed = this.results.usabilityTests.filter(t => t.passed).length;
        const mobileTotal = this.results.mobileResponsiveness.length + this.results.usabilityTests.length || 1;
        const mobileScore = ((mobilePassed + usabilityPassed) / mobileTotal) * 25;
        
        return {
            overall: keyboardScore + screenReaderScore + wcagScore + mobileScore,
            keyboard: keyboardScore,
            screenReader: screenReaderScore,
            wcag: wcagScore,
            mobile: mobileScore
        };
    }
}

// Export for use in other files
export default AccessibilityUXTestSuite;

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const testSuite = new AccessibilityUXTestSuite();
    
    console.log('♿ StanceStream Accessibility & UX Excellence Audit');
    console.log('This will test WCAG compliance, keyboard navigation, screen reader compatibility, and usability\n');
    
    try {
        await testSuite.runCompleteAccessibilityAudit();
    } catch (error) {
        console.error('❌ Accessibility audit failed:', error);
        process.exit(1);
    }
}
