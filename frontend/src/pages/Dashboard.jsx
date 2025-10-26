/**
 * Dashboard Page (Proxy Count Tracking)
 * Shows proxy request usage instead of data GB
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Globe, LogOut, Key, Settings, BarChart3, 
  Zap, Database, Activity 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { Card, Button, Spinner, Alert, Badge } from '../components/common';
import ProxyGenerator from '../components/dashboard/ProxyGenerator';
import StatsCard from '../components/dashboard/StatsCard';
import SubscriptionModal from '../components/dashboard/SubscriptionModal';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [subscription, setSubscription] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const subData = await api.getSubscription();
      setSubscription(subData);
      
      const statsData = await api.getStats();
      setStats(statsData);
      
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Spinner size="lg" className="text-blue-500" />
      </div>
    );
  }

  const proxyUsagePercent = subscription 
    ? (subscription.proxy_requests_used / subscription.proxy_requests_limit) * 100 
    : 0;

  const remainingProxies = subscription 
    ? subscription.proxy_requests_limit - subscription.proxy_requests_used 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900 bg-opacity-95 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Globe className="w-8 h-8 text-blue-500" />
              <span className="text-xl font-bold text-white">ProxyFlow</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-slate-300 text-sm">
                {user?.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user?.username}!
          </h1>
          <p className="text-slate-400">
            Manage your proxies and monitor your usage
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            icon={<Database className="w-6 h-6" />}
            title="Proxies Used"
            value={subscription?.proxy_requests_used || 0}
            subtitle={`of ${subscription?.proxy_requests_limit || 0} limit`}
            color="blue"
          />
          
          <StatsCard
            icon={<Zap className="w-6 h-6" />}
            title="Plan"
            value={subscription?.plan.toUpperCase()}
            subtitle="Current subscription"
            color="purple"
          />
          
          <StatsCard
            icon={<Activity className="w-6 h-6" />}
            title="Remaining"
            value={remainingProxies}
            subtitle="Proxies available"
            color="green"
          />
          
          <StatsCard
            icon={<BarChart3 className="w-6 h-6" />}
            title="Status"
            value={subscription?.is_active ? "Active" : "Inactive"}
            subtitle="Account status"
            color={subscription?.is_active ? "green" : "red"}
          />
        </div>

        {/* Proxy Usage Progress */}
        <Card className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Proxy Usage</h3>
            <Badge variant={proxyUsagePercent > 80 ? "danger" : "primary"}>
              {proxyUsagePercent.toFixed(1)}% used
            </Badge>
          </div>
          
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${
                proxyUsagePercent > 80 ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(proxyUsagePercent, 100)}%` }}
            />
          </div>
          
          <div className="flex justify-between mt-2 text-sm text-slate-400">
            <span>{subscription?.proxy_requests_used || 0} proxies used</span>
            <span>{remainingProxies} remaining</span>
          </div>
          
          {proxyUsagePercent > 80 && (
            <Alert variant="warning" className="mt-4">
              You're running low on proxies. Consider upgrading your plan.
            </Alert>
          )}
        </Card>

        {/* Subscription Info */}
        <Card className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Subscription Details</h3>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowUpgradeModal(true)}
            >
              Upgrade Plan
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-400 mb-1">Plan</p>
              <p className="text-white font-semibold">{subscription?.plan.toUpperCase()}</p>
            </div>
            <div>
              <p className="text-slate-400 mb-1">Proxy Limit</p>
              <p className="text-white font-semibold">{subscription?.proxy_requests_limit}/month</p>
            </div>
            <div>
              <p className="text-slate-400 mb-1">Expires</p>
              <p className="text-white font-semibold">
                {subscription?.expires_at 
                  ? new Date(subscription.expires_at).toLocaleDateString()
                  : 'N/A'
                }
              </p>
            </div>
            <div>
              <p className="text-slate-400 mb-1">Unique Proxies</p>
              <p className="text-white font-semibold">{stats?.unique_proxies_used || 0}</p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-700">
            <p className="text-xs text-slate-500">
              💡 <strong>Future:</strong> Data usage (GB) will be tracked when Proxy Gateway is implemented. 
              Currently counting proxy requests only.
            </p>
          </div>
        </Card>

        {/* API Key Section */}
        <Card className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Key className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-white">Your API Key</h3>
          </div>
          
          <div className="bg-slate-950 rounded-lg p-4 font-mono text-sm">
            <div className="flex items-center justify-between">
              <code className="text-green-400">{user?.api_key}</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(user?.api_key);
                  alert('API key copied to clipboard!');
                }}
              >
                Copy
              </Button>
            </div>
          </div>
          
          <p className="text-sm text-slate-400 mt-2">
            Use this API key for authenticating proxy requests
          </p>
        </Card>

        {/* Proxy Generator */}
        <ProxyGenerator 
          onProxyGenerated={loadDashboardData}
          remainingProxies={remainingProxies}
        />

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card hover className="cursor-pointer" onClick={() => alert('Coming soon!')}>
            <Settings className="w-8 h-8 text-blue-500 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Settings</h3>
            <p className="text-sm text-slate-400">Manage your account settings</p>
          </Card>
          
          <Card hover className="cursor-pointer" onClick={() => alert('Coming soon!')}>
            <BarChart3 className="w-8 h-8 text-purple-500 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Analytics</h3>
            <p className="text-sm text-slate-400">View detailed usage statistics</p>
          </Card>
          
          <Card hover className="cursor-pointer" onClick={() => setShowUpgradeModal(true)}>
            <Zap className="w-8 h-8 text-green-500 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Upgrade</h3>
            <p className="text-sm text-slate-400">Upgrade to a higher plan</p>
          </Card>
        </div>

        {/* Subscription Modal */}
        <SubscriptionModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          currentPlan={subscription?.plan}
          onSuccess={loadDashboardData}
        />
      </div>
    </div>
  );
}