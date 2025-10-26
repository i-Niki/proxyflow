/**
 * Proxy Generator Component
 * UI for requesting and displaying proxies
 */

import { useState } from 'react';
import { Download, Copy, CheckCircle } from 'lucide-react';
import { Card, Button, Alert } from '../common';
import api from '../../services/api';

export default function ProxyGenerator({ onProxyGenerated }) {
  const [proxyType, setProxyType] = useState('residential');
  const [country, setCountry] = useState('US');
  const [quantity, setQuantity] = useState(1);
  const [proxies, setProxies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const proxyTypes = [
    { value: 'residential', label: 'Residential' },
    { value: 'datacenter', label: 'Datacenter' },
    { value: 'mobile', label: 'Mobile' },
    { value: 'isp', label: 'ISP' },
  ];

  const countries = [
    { value: 'US', label: 'United States' },
    { value: 'GB', label: 'United Kingdom' },
    { value: 'DE', label: 'Germany' },
    { value: 'FR', label: 'France' },
    { value: 'CA', label: 'Canada' },
    { value: 'AU', label: 'Australia' },
    { value: 'JP', label: 'Japan' },
  ];

  const handleGenerate = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await api.getProxies({
        proxy_type: proxyType,
        country: country,
        quantity: quantity,
      });
      
      setProxies(response);
    } catch (err) {
      setError(err.message || 'Failed to generate proxies');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatProxyString = (proxy) => {
    return `${proxy.ip_address}:${proxy.port}:${proxy.username}:${proxy.password}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyAllProxies = () => {
    const allProxies = proxies.map(formatProxyString).join('\n');
    copyToClipboard(allProxies);
  };

  const downloadProxies = () => {
    const allProxies = proxies.map(formatProxyString).join('\n');
    const blob = new Blob([allProxies], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proxies_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Generate Proxies</h3>
        {proxies.length > 0 && (
          <span className="text-sm text-slate-400">
            {proxies.length} {proxies.length === 1 ? 'proxy' : 'proxies'} generated
          </span>
        )}
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Proxy Type
          </label>
          <select
            value={proxyType}
            onChange={(e) => setProxyType(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {proxyTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Country
          </label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {countries.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Quantity
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            disabled={loading}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-end">
          <Button
            onClick={handleGenerate}
            loading={loading}
            className="w-full"
          >
            Generate
          </Button>
        </div>
      </div>

      {/* Proxies List */}
      {proxies.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-slate-300">Your Proxies</h4>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={copyAllProxies}
                className="flex items-center space-x-1"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy All</span>
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadProxies}
                className="flex items-center space-x-1"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </Button>
            </div>
          </div>

          <div className="bg-slate-950 rounded-lg p-4 max-h-64 overflow-y-auto">
            <div className="space-y-2 font-mono text-sm">
              {proxies.map((proxy, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0"
                >
                  <code className="text-green-400 text-xs">
                    {formatProxyString(proxy)}
                  </code>
                  <button
                    onClick={() => copyToClipboard(formatProxyString(proxy))}
                    className="ml-4 text-slate-400 hover:text-white transition"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-2">
            Format: IP:PORT:USERNAME:PASSWORD
          </p>
        </div>
      )}
    </Card>
  );
}