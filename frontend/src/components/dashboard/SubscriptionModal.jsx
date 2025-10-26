/**
 * Subscription Management Modal
 * Allows users to upgrade/change their plan
 */

import { useState } from 'react';
import { X, Check, Zap } from 'lucide-react';
import { Button, Alert } from '../common';
import api from '../../services/api';

export default function SubscriptionModal({ isOpen, onClose, currentPlan, onSuccess }) {
  const [selectedPlan, setSelectedPlan] = useState(currentPlan);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '$99',
      period: '/month',
      description: 'Perfect for small projects',
      features: [
        '1,000 proxy requests/month',
        '5GB data transfer (future)',
        '50 concurrent connections',
        'Residential & Datacenter',
        'API Access',
        'Email Support',
      ],
      limits: {
        proxies: '1,000',
        connections: '50',
        data: '5GB',
      }
    },
    {
      id: 'professional',
      name: 'Professional',
      price: '$299',
      period: '/month',
      description: 'Best for growing businesses',
      popular: true,
      features: [
        '10,000 proxy requests/month',
        '25GB data transfer (future)',
        '500 concurrent connections',
        'All Proxy Types',
        'Priority API Access',
        '24/7 Priority Support',
        'Advanced Targeting',
      ],
      limits: {
        proxies: '10,000',
        connections: '500',
        data: '25GB',
      }
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large-scale operations',
      features: [
        '100,000+ proxy requests/month',
        '1TB+ data transfer (future)',
        '10,000+ concurrent connections',
        'All Proxy Types',
        'Dedicated Account Manager',
        '24/7 Premium Support',
        'Custom Solutions',
        'SLA Guarantee',
      ],
      limits: {
        proxies: '100,000+',
        connections: '10,000+',
        data: '1TB+',
      }
    },
  ];

  const handleUpgrade = async () => {
    if (selectedPlan === currentPlan) {
      setError('This is your current plan');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.updateSubscription({ plan: selectedPlan });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update subscription');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
      <div className="bg-slate-900 rounded-xl border border-slate-700 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Choose Your Plan</h2>
            <p className="text-slate-400 mt-1">
              Upgrade or change your subscription
              <span className="ml-2 text-xs bg-blue-600 bg-opacity-20 text-blue-400 px-2 py-1 rounded">
                MVP - Free for testing
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="p-6 pb-0">
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        {/* Plans Grid */}
        <div className="p-6 grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`
                relative cursor-pointer rounded-xl border-2 p-6 transition-all
                ${selectedPlan === plan.id
                  ? 'border-blue-500 bg-blue-600 bg-opacity-10'
                  : 'border-slate-700 hover:border-slate-600'
                }
                ${plan.popular ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900' : ''}
              `}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                    <Zap className="w-3 h-3" />
                    <span>Most Popular</span>
                  </span>
                </div>
              )}

              {/* Current Plan Badge */}
              {currentPlan === plan.id && (
                <div className="absolute top-4 right-4">
                  <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                    Current
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-4">
                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-sm text-slate-400">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-end">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-slate-400 ml-2 mb-1">{plan.period}</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Limits Summary */}
              <div className="border-t border-slate-700 pt-4 mt-4">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-slate-500">Proxies</p>
                    <p className="text-white font-semibold">{plan.limits.proxies}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Connections</p>
                    <p className="text-white font-semibold">{plan.limits.connections}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Data</p>
                    <p className="text-white font-semibold">{plan.limits.data}</p>
                  </div>
                </div>
              </div>

              {/* Selected Indicator */}
              {selectedPlan === plan.id && (
                <div className="absolute top-4 left-4">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 flex items-center justify-between">
          <div className="text-sm text-slate-400">
            {selectedPlan === currentPlan ? (
              <span>This is your current plan</span>
            ) : (
              <span>
                Switching to <strong className="text-white">{plans.find(p => p.id === selectedPlan)?.name}</strong>
              </span>
            )}
          </div>
          <div className="flex space-x-3">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUpgrade}
              loading={loading}
              disabled={selectedPlan === currentPlan}
            >
              {selectedPlan === currentPlan ? 'Current Plan' : 'Upgrade Plan'}
            </Button>
          </div>
        </div>

        {/* MVP Notice */}
        <div className="px-6 pb-6">
          <div className="bg-blue-900 bg-opacity-20 border border-blue-500 rounded-lg p-4 text-sm">
            <p className="text-blue-300">
              <strong>💡 MVP Note:</strong> Plan changes are instant and free for testing. 
              Billing integration coming soon!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}