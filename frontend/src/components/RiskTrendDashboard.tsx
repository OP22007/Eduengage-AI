'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';

interface RiskDistribution {
  date: string;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  totalLearners: number;
  geminiInsights?: {
    summary: string;
    recommendations: string[];
    trends: string[];
  };
}

interface RiskTrend {
  _id: string;
  date: string;
  riskDistribution: RiskDistribution;
  platformHealth: number;
  geminiAnalysis?: {
    overallHealth: string;
    keyMetrics: string[];
    actionItems: string[];
  };
}

export default function RiskTrendDashboard() {
  const [riskHistory, setRiskHistory] = useState<RiskTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  useEffect(() => {
    fetchRiskHistory();
  }, [selectedPeriod]);

  const fetchRiskHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/admin/risk-history?days=${selectedPeriod}`);
      
      if (response.data.success) {
        setRiskHistory(response.data.data);
      } else {
        throw new Error('Failed to fetch risk history');
      }
    } catch (err: any) {
      console.error('Error fetching risk history:', err);
      setError(err.response?.data?.message || 'Failed to load risk history');
    } finally {
      setLoading(false);
    }
  };

  const triggerRiskUpdate = async () => {
    try {
      setUpdating(true);
      setError(null);
      
      const response = await api.post('/admin/update-risk-scores');
      
      if (response.data.success) {
        // Refresh the history after update
        await fetchRiskHistory();
      } else {
        throw new Error(response.data.message || 'Failed to update risk scores');
      }
    } catch (err: any) {
      console.error('Error updating risk scores:', err);
      setError(err.response?.data?.message || 'Failed to update risk scores');
    } finally {
      setUpdating(false);
    }
  };

  const getRiskColor = (type: 'high' | 'medium' | 'low') => {
    switch (type) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculatePercentage = (value: number, total: number) => {
    return total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
  };

  const getHealthBadge = (health: number) => {
    if (health >= 0.8) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (health >= 0.6) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    if (health >= 0.4) return <Badge className="bg-orange-100 text-orange-800">Concerning</Badge>;
    return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Risk Distribution Trends</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Risk Distribution Trends</h2>
        <div className="flex gap-2">
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(Number(e.target.value))}
            className="px-3 py-2 border rounded-md"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <Button 
            onClick={triggerRiskUpdate}
            disabled={updating}
            className="min-w-[120px]"
          >
            {updating ? 'Updating...' : 'Update Risks'}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {riskHistory.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No risk history data available.</p>
            <Button onClick={triggerRiskUpdate} className="mt-4">
              Generate Initial Risk Data
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {riskHistory.map((trend, index) => (
            <Card key={trend._id} className={index === 0 ? "border-blue-200 bg-blue-50" : ""}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">
                    {formatDate(trend.date)}
                    {index === 0 && <Badge className="ml-2">Latest</Badge>}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Platform Health:</span>
                    {getHealthBadge(trend.platformHealth)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Risk Distribution</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded"></div>
                          High Risk
                        </span>
                        <span className="font-mono">
                          {trend.riskDistribution.highRisk} 
                          ({calculatePercentage(trend.riskDistribution.highRisk, trend.riskDistribution.totalLearners)}%)
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                          Medium Risk
                        </span>
                        <span className="font-mono">
                          {trend.riskDistribution.mediumRisk} 
                          ({calculatePercentage(trend.riskDistribution.mediumRisk, trend.riskDistribution.totalLearners)}%)
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded"></div>
                          Low Risk
                        </span>
                        <span className="font-mono">
                          {trend.riskDistribution.lowRisk} 
                          ({calculatePercentage(trend.riskDistribution.lowRisk, trend.riskDistribution.totalLearners)}%)
                        </span>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between items-center font-semibold">
                          <span>Total Learners</span>
                          <span>{trend.riskDistribution.totalLearners}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {trend.geminiAnalysis && (
                    <div>
                      <h4 className="font-semibold mb-3">AI Insights</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Overall Health:</p>
                          <p className="text-sm">{trend.geminiAnalysis.overallHealth}</p>
                        </div>
                        
                        {trend.geminiAnalysis.keyMetrics && trend.geminiAnalysis.keyMetrics.length > 0 && (
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Key Metrics:</p>
                            <ul className="text-sm space-y-1">
                              {trend.geminiAnalysis.keyMetrics.map((metric, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-1">•</span>
                                  <span>{metric}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {trend.geminiAnalysis.actionItems && trend.geminiAnalysis.actionItems.length > 0 && (
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Action Items:</p>
                            <ul className="text-sm space-y-1">
                              {trend.geminiAnalysis.actionItems.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-orange-500 mt-1">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
