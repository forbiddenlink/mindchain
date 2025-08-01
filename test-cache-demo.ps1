# Test MindChain Enhanced Semantic Caching Display
# Quick demo script to showcase the business value features

# Test StanceStream Enhanced Semantic Caching Display
# PowerShell script to demonstrate cache hit celebrations

Write-Host "🎯 StanceStream Semantic Caching Business Value Demo" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

# Check if server is running
$serverRunning = $false
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/cache/metrics" -TimeoutSec 3
    $serverRunning = $true
    Write-Host "✅ Server is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Server not running. Please start the server first:" -ForegroundColor Red
    Write-Host "   npm start" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

if ($serverRunning) {
    Write-Host ""
    Write-Host "🚀 Testing Cache Hit Celebrations..." -ForegroundColor Cyan
    Write-Host ""
    
    # Test scenarios
    $scenarios = @(
        @{ similarity = 0.95; cost_saved = 0.003; desc = "High similarity match" },
        @{ similarity = 0.87; cost_saved = 0.002; desc = "Good similarity match" },
        @{ similarity = 0.92; cost_saved = 0.0025; desc = "Excellent similarity match" },
        @{ similarity = 0.89; cost_saved = 0.0018; desc = "Strong similarity match" },
        @{ similarity = 0.96; cost_saved = 0.0035; desc = "Near-perfect match" }
    )
    
    for ($i = 0; $i -lt $scenarios.Count; $i++) {
        $scenario = $scenarios[$i]
        $num = $i + 1
        
        Write-Host "📊 Scenario $num`: $($scenario.desc)" -ForegroundColor White
        Write-Host "   Similarity: $([math]::Round($scenario.similarity * 100, 1))%" -ForegroundColor Yellow
        Write-Host "   Cost Saved: `$$($scenario.cost_saved.ToString('F3'))" -ForegroundColor Green
        
        try {
            $body = @{
                similarity = $scenario.similarity
                cost_saved = $scenario.cost_saved
            } | ConvertTo-Json
            
            $response = Invoke-RestMethod -Uri "http://localhost:3000/api/demo/cache-hit" -Method POST -Body $body -ContentType "application/json"
            
            if ($response.success) {
                Write-Host "   ✅ Cache hit celebration triggered!" -ForegroundColor Green
                Write-Host "   🎯 Business Value: $($response.data.percentage) match, `$$($response.data.cost_saved.ToString('F3')) saved" -ForegroundColor Cyan
            } else {
                Write-Host "   ❌ Failed: $($response.message)" -ForegroundColor Red
            }
        } catch {
            Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        Write-Host ""
        Start-Sleep -Seconds 3  # Wait to show celebrations
    }
    
    Write-Host "🎯 Demo complete! Check your browser for the LivePerformanceOverlay celebrations." -ForegroundColor Green
    Write-Host ""
    Write-Host "💰 Enhanced Features Showcased:" -ForegroundColor Cyan
    Write-Host "   • Real-time cache hit celebrations with 🎯 emoji" -ForegroundColor White
    Write-Host "   • Live similarity score tracking and display" -ForegroundColor White
    Write-Host "   • Running cost savings counter with business metrics" -ForegroundColor White
    Write-Host "   • Traditional AI vs StanceStream comparison chart" -ForegroundColor White
    Write-Host "   • Enterprise projection displays for ROI analysis" -ForegroundColor White
    Write-Host "   • Mission control dashboard aesthetics" -ForegroundColor White
    Write-Host "   • Recent cache hits log with timestamps" -ForegroundColor White
    Write-Host ""
    Write-Host "🌐 Open your browser to http://localhost:3000 to see the enhanced display!" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
