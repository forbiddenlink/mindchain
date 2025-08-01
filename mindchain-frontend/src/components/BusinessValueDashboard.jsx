// Business Value Dashboard - Real-time ROI and Performance Analytics
import { useState, useEffect } from 'react';
import api from '../services/api';
import Icon from './Icon';

export default function BusinessValueDashboard() {
    const [businessData, setBusinessData] = useState(null);
    const [cacheMetrics, setCacheMetrics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshInterval, setRefreshInterval] = useState(null);

    useEffect(() => {
        fetchBusinessMetrics();

        // Auto-refresh every 10 seconds for live metrics
        const interval = setInterval(fetchBusinessMetrics, 10000);
        setRefreshInterval(interval);

        return () => {
            if (interval) clearInterval(interval);
        };
    }, []);

    const fetchBusinessMetrics = async () => {
        try {
            setError(null);

            // Get business summary and cache metrics
            const [businessResponse, cacheResponse] = await Promise.all([
                api.getBusinessSummary(),
                api.getCacheMetrics()
            ]);

            if (businessResponse.success) {
                setBusinessData(businessResponse);
            }

            if (cacheResponse.success) {
                setCacheMetrics(cacheResponse);
            }

        } catch (error) {
            console.error('Business metrics fetch error:', error);
            setError('Failed to load business metrics');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex items-center justify-center">
                    <Icon name="loader-2" className="w-8 h-8 animate-spin text-blue-500" />
                    <span className="ml-3 text-gray-600">Loading business analytics...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-center">
                    <Icon name="alert-circle" className="w-6 h-6 text-red-500" />
                    <span className="ml-3 text-red-700">{error}</span>
                </div>
            </div>
        );
    }

    const businessMetrics = businessData?.detailed_metrics;
    const executiveSummary = businessData?.executive_summary;
    const currentUsage = businessMetrics?.current_usage;
    const performance = businessMetrics?.performance_impact;
    const enterpriseProjections = businessMetrics?.enterprise_projections;

    return (
        <div className="space-y-6">
            {/* Executive Summary Header */}
            {executiveSummary && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Icon name="trending-up" className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-gray-900 mb-2">
                                Business Impact Summary
                            </h2>
                            <p className="text-lg text-blue-800 font-medium mb-3">
                                {executiveSummary.headline}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {executiveSummary.key_benefits?.map((benefit, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Icon name="check-circle" className="w-4 h-4 text-green-600 flex-shrink-0" />
                                        <span className="text-gray-700 text-sm">{benefit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Current Performance Metrics */}
            {currentUsage && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                        <div className="flex items-center justify-between mb-2">
                            <Icon name="dollar-sign" className="w-6 h-6 text-green-600" />
                            <span className="text-sm text-gray-500">Monthly Savings</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            ${currentUsage.monthly_savings}
                        </div>
                        <div className="text-sm text-green-600 mt-1">
                            ${currentUsage.annual_savings}/year projected
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between mb-2">
                            <Icon name="zap" className="w-6 h-6 text-blue-600" />
                            <span className="text-sm text-gray-500">Cache Efficiency</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {currentUsage.cache_efficiency}
                        </div>
                        <div className="text-sm text-blue-600 mt-1">
                            API cost reduction
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                        <div className="flex items-center justify-between mb-2">
                            <Icon name="cpu" className="w-6 h-6 text-purple-600" />
                            <span className="text-sm text-gray-500">Tokens Saved</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {currentUsage.daily_tokens_saved?.toLocaleString() || '0'}
                        </div>
                        <div className="text-sm text-purple-600 mt-1">
                            Daily processing saved
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                        <div className="flex items-center justify-between mb-2">
                            <Icon name="activity" className="w-6 h-6 text-orange-600" />
                            <span className="text-sm text-gray-500">System Status</span>
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                            {performance?.system_efficiency || 'Optimizing'}
                        </div>
                        <div className="text-sm text-orange-600 mt-1">
                            {performance?.production_readiness || 'Scaling'}
                        </div>
                    </div>
                </div>
            )}

            {/* Enterprise Scaling Projections */}
            {enterpriseProjections && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Icon name="building" className="w-6 h-6 text-blue-600" />
                        <h3 className="text-xl font-bold text-gray-900">Enterprise Scaling Projections</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {Object.entries(enterpriseProjections).map(([scale, data]) => (
                            <div key={scale} className="bg-gray-50 rounded-lg p-4">
                                <div className="text-sm font-medium text-gray-600 mb-2">
                                    {data.description}
                                </div>
                                <div className="text-lg font-bold text-gray-900 mb-1">
                                    {data.requests_per_day} requests/day
                                </div>
                                <div className="text-green-600 font-semibold">
                                    ${data.annual_savings?.toLocaleString()}/year savings
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Real-time Performance Indicators */}
            {cacheMetrics?.dashboard && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <Icon name="monitor" className="w-6 h-6 text-blue-600" />
                            <h3 className="text-xl font-bold text-gray-900">Real-Time Operations</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm text-gray-600">Live</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(cacheMetrics.dashboard.primary_kpis).map(([key, value]) => (
                            <div key={key} className="text-center">
                                <div className="text-lg font-bold text-gray-900">{value}</div>
                                <div className="text-sm text-gray-600">{key}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Business Case Highlight */}
            {executiveSummary?.business_case && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <Icon name="briefcase" className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-3">Business Case</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-semibold text-gray-800 mb-2">Immediate Value</h4>
                                    <p className="text-gray-700 text-sm">
                                        {executiveSummary.business_case.immediate_value}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-800 mb-2">Scalability</h4>
                                    <p className="text-gray-700 text-sm">
                                        {executiveSummary.business_case.scalability}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-800 mb-2">Competitive Advantage</h4>
                                    <p className="text-gray-700 text-sm">
                                        {executiveSummary.business_case.competitive_advantage}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-800 mb-2">Technical Moat</h4>
                                    <p className="text-gray-700 text-sm">
                                        {executiveSummary.business_case.technical_moat}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Last Updated */}
            <div className="text-center text-sm text-gray-500">
                Last updated: {new Date().toLocaleTimeString()} •
                <button
                    onClick={fetchBusinessMetrics}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                >
                    Refresh
                </button>
            </div>
        </div>
    );
}
