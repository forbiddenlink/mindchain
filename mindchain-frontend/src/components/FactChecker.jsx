import React from 'react';
import Icon from './Icon';
import { Card, CardHeader, CardContent, StatusBadge, Stack } from './ui';

const FactChecker = ({ factChecks = [] }) => {
    const getFactCheckConfig = (score) => {
        if (score >= 0.8) {
            return {
                variant: 'success',
                label: 'HIGH CONFIDENCE',
                icon: 'check-circle',
                cardClass: 'border-green-500/30 bg-gradient-to-r from-green-900/20 to-emerald-900/20'
            };
        } else if (score >= 0.6) {
            return {
                variant: 'warning',
                label: 'MODERATE CONFIDENCE',
                icon: 'alert-triangle',
                cardClass: 'border-yellow-500/30 bg-gradient-to-r from-yellow-900/20 to-orange-900/20'
            };
        } else {
            return {
                variant: 'error',
                label: 'LOW CONFIDENCE',
                icon: 'x-circle',
                cardClass: 'border-red-500/30 bg-gradient-to-r from-red-900/20 to-pink-900/20'
            };
        }
    };

    return (
        <Card className="h-full flex flex-col overflow-hidden">
            <CardHeader className="flex-shrink-0">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                        <Icon name="shield-check" size={20} className="text-blue-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">Fact Checker</h3>
                        <p className="text-slate-400 text-sm">Real-time verification</p>
                    </div>
                    <StatusBadge
                        status={factChecks.length > 0 ? "success" : "neutral"}
                        label={`${factChecks.length} checks`}
                    />
                </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden p-4">
                {factChecks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-slate-700/50 to-slate-600/50 flex items-center justify-center mb-4">
                            <Icon name="search" size={24} className="text-slate-400" />
                        </div>
                        <h4 className="text-white font-medium mb-2">Ready for Fact-Checking</h4>
                        <p className="text-slate-400 text-sm mb-1">Monitoring agent statements</p>
                        <p className="text-slate-500 text-xs">Vector-powered verification system active</p>
                    </div>
                ) : (
                    <div className="space-y-3 h-full overflow-y-auto">
                        {factChecks.slice(-5).map((check) => {
                            const config = getFactCheckConfig(check.score);

                            return (
                                <div key={check.id || check.timestamp} className={`glass-card p-4 rounded-xl ${config.cardClass}`}>
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0 mt-1">
                                            <Icon name={config.icon} size={18} className={
                                                config.variant === 'success' ? 'text-green-400' :
                                                    config.variant === 'warning' ? 'text-yellow-400' :
                                                        'text-red-400'
                                            } />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <StatusBadge status={config.variant} label={config.label} />
                                                <span className="text-xs text-slate-400">
                                                    {(check.score * 100).toFixed(1)}%
                                                </span>
                                            </div>

                                            <p className="text-sm text-slate-300 leading-relaxed mb-3">
                                                {check.fact}
                                            </p>

                                            {check.source && (
                                                <div className="flex items-center space-x-2 text-xs text-slate-400">
                                                    <Icon name="external-link" size={12} />
                                                    <span>Source verified</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default FactChecker;
