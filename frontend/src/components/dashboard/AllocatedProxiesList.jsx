/**
 * Allocated Proxies List Component
 * Shows user's allocated gateway proxies with credentials
 */

import { useState, useEffect } from 'react';
import { Copy, CheckCircle, Download, Server, Globe } from 'lucide-react';
import { Card, Button, Alert, Spinner } from '../common';
import api from '../../services/api';

export default function AllocatedProxiesList({ onAllocate }) {
  const [proxies, setProxies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState(false);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);

  useEffect(() => {
    loadProxies();
  }, []);

  const loadProxies = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.listAllocatedProxies();
      setProxies(data);
    } catch (err) {
      setError(err.message || 'Failed to load proxies');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAllocate = async () => {
    try {
      setAllocating(true);
      setError('');
      const allocated = await api.allocateProxies();
      setProxies(allocated);
      if (onAllocate) onAllocate();
    } catch (err) {
      setError(err.message || 'Failed to allocate proxies');
      console.error(err);
    } finally {
      setAllocating(false);
    }
  };

  const formatProxyString = (proxy) => {
    return `${proxy.username}:${proxy.password}@${proxy.gateway_ip}:${proxy.gateway_port}`;
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAllProxies = () => {
    const allProxies = proxies.map(formatProxyString).join('\n');
    navigator.clipboard.writeText(allProxies);
    setCopiedIndex('all');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const downloadProxies = () => {
    const allProxies = proxies.map(formatProxyString).join('\n');
    const blob = new Blob([allProxies], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proxyflow_allocated_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </Card>
    );
  }

  if (proxies.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <Server className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No Proxies Allocated Yet
          </h3>
          <p className="text-slate-400 mb-6">
            Allocate proxies to start using ProxyFlow gateway
          </p>
          {error && (
            <Alert variant="error" className="mb-4">
              {error}
            </Alert>
          )}
          <Button
            onClick={handleAllocate}
            loading={allocating}
            className="mx-auto"
          >
            Allocate All Proxies
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
            <Globe className="w-5 h-5" />
            <span>Your Allocated Proxies</span>
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            {proxies.length} {proxies.length === 1 ? 'proxy' : 'proxies'} allocated
          </p>
        </div>

        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={copyAllProxies}
            className="flex items-center space-x-1"
          >
            {copiedIndex === 'all' ? (
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

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="bg-slate-950 rounded-lg p-4 max-h-96 overflow-y-auto">
        <div className="space-y-3">
          {proxies.map((proxy, index) => (
            <div
              key={proxy.id}
              className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800 hover:border-slate-700 transition"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-mono text-slate-500">
                    #{index + 1}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">
                    {proxy.original_proxy_type}
                  </span>
                  {proxy.original_proxy_country && (
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-400">
                      {proxy.original_proxy_country}
                    </span>
                  )}
                </div>
                <code className="text-sm text-green-400 break-all">
                  {formatProxyString(proxy)}
                </code>
                <div className="text-xs text-slate-500 mt-1">
                  Allocated: {new Date(proxy.allocated_at).toLocaleString()}
                </div>
              </div>

              <button
                onClick={() => copyToClipboard(formatProxyString(proxy), index)}
                className="ml-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
              >
                {copiedIndex === index ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
        <p className="text-xs text-blue-400">
          <strong>Usage:</strong> Use these credentials with any proxy-enabled application.
          Format: <code className="text-blue-300">username:password@host:port</code>
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Example: <code className="text-slate-400">curl -x {proxies[0] ? formatProxyString(proxies[0]) : 'username:password@host:port'} https://api.ipify.org</code>
        </p>
      </div>

      <div className="mt-4 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
        <p className="text-xs text-yellow-400">
          <strong>⚠️ MVP Notice:</strong> Gateway server is not yet implemented. These proxies will work when Go Gateway (Step 2) is deployed.
        </p>
      </div>
    </Card>
  );
}
