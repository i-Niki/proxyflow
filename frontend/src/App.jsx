import React, { useState } from 'react';
import { Globe, Zap, Shield, Code, TrendingUp, Search, DollarSign, BarChart, CheckCircle, ArrowRight, Menu, X } from 'lucide-react';

export default function ProxyServiceWebsite() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('professional');

  const proxyTypes = [
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Residential Proxies",
      description: "Real residential IPs from ISPs worldwide. Perfect for web scraping and data collection.",
      features: ["40M+ IPs", "195+ Countries", "99.9% Success Rate"]
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Datacenter Proxies",
      description: "Lightning-fast dedicated IPs from premium datacenters. Ideal for high-speed operations.",
      features: ["100K+ IPs", "Unlimited Bandwidth", "1ms Response Time"]
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Mobile Proxies",
      description: "4G/5G mobile IPs for accessing mobile-specific content and bypassing restrictions.",
      features: ["Real Mobile IPs", "Carrier Grade", "Auto Rotation"]
    },
    {
      icon: <Code className="w-8 h-8" />,
      title: "ISP Proxies",
      description: "Static residential IPs hosted in datacenters. Best of both worlds for stability.",
      features: ["Static IPs", "High Speed", "Long Sessions"]
    }
  ];

  const useCases = [
    { icon: <Search />, title: "Web Scraping", description: "Extract data at scale without blocks" },
    { icon: <TrendingUp />, title: "SEO Monitoring", description: "Track rankings from any location" },
    { icon: <DollarSign />, title: "Price Intelligence", description: "Monitor competitor pricing globally" },
    { icon: <BarChart />, title: "Ad Verification", description: "Verify ad placements worldwide" }
  ];

  const features = [
    "99.9% Uptime Guarantee",
    "24/7 Expert Support",
    "Easy API Integration",
    "Pay As You Go",
    "Unlimited Concurrent Sessions",
    "Advanced Targeting Options"
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "$99",
      period: "/month",
      description: "Perfect for small projects",
      features: [
        "5GB Data Transfer",
        "Residential & Datacenter",
        "API Access",
        "Basic Support",
        "50 Concurrent Connections"
      ]
    },
    {
      name: "Professional",
      price: "$299",
      period: "/month",
      description: "Best for growing businesses",
      features: [
        "25GB Data Transfer",
        "All Proxy Types",
        "Priority API Access",
        "24/7 Priority Support",
        "500 Concurrent Connections",
        "Advanced Targeting"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large-scale operations",
      features: [
        "Unlimited Data Transfer",
        "All Proxy Types",
        "Dedicated Account Manager",
        "24/7 Premium Support",
        "Unlimited Connections",
        "Custom Solutions"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-slate-900 bg-opacity-95 backdrop-blur-sm z-50 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Globe className="w-8 h-8 text-blue-500" />
              <span className="text-xl font-bold">ProxyFlow</span>
            </div>
            
            <div className="hidden md:flex space-x-8">
              <a href="#features" className="hover:text-blue-400 transition">Features</a>
              <a href="#proxies" className="hover:text-blue-400 transition">Proxy Types</a>
              <a href="#pricing" className="hover:text-blue-400 transition">Pricing</a>
              <a href="#docs" className="hover:text-blue-400 transition">Docs</a>
            </div>
            
            <div className="hidden md:flex space-x-4">
              <button className="px-4 py-2 text-sm hover:text-blue-400 transition">Sign In</button>
              <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition">
                Get Started
              </button>
            </div>

            <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-slate-800 border-t border-slate-700">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block hover:text-blue-400 transition">Features</a>
              <a href="#proxies" className="block hover:text-blue-400 transition">Proxy Types</a>
              <a href="#pricing" className="block hover:text-blue-400 transition">Pricing</a>
              <a href="#docs" className="block hover:text-blue-400 transition">Docs</a>
              <button className="w-full px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition mt-4">
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block px-4 py-2 bg-blue-600 bg-opacity-20 rounded-full text-blue-400 text-sm mb-6">
            Trusted by 10,000+ developers worldwide
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Premium Proxies for Developers
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
            Access 40M+ residential and datacenter IPs worldwide. Built for web scraping, data collection, and automation at scale.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-lg transition flex items-center justify-center space-x-2">
              <span>Start Free Trial</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="px-8 py-4 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium text-lg transition">
              View Documentation
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 max-w-4xl mx-auto">
            <div>
              <div className="text-4xl font-bold text-blue-400">40M+</div>
              <div className="text-slate-400 mt-2">IP Addresses</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-400">195+</div>
              <div className="text-slate-400 mt-2">Countries</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-400">99.9%</div>
              <div className="text-slate-400 mt-2">Uptime</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-400">10K+</div>
              <div className="text-slate-400 mt-2">Happy Clients</div>
            </div>
          </div>
        </div>
      </section>

      {/* Proxy Types Section */}
      <section id="proxies" className="py-20 px-4 bg-slate-800 bg-opacity-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Choose Your Proxy Type</h2>
            <p className="text-slate-300 text-lg">Multiple proxy solutions for every use case</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {proxyTypes.map((proxy, index) => (
              <div key={index} className="bg-slate-900 p-6 rounded-xl border border-slate-700 hover:border-blue-500 transition">
                <div className="text-blue-500 mb-4">{proxy.icon}</div>
                <h3 className="text-xl font-bold mb-3">{proxy.title}</h3>
                <p className="text-slate-400 mb-4 text-sm">{proxy.description}</p>
                <ul className="space-y-2">
                  {proxy.features.map((feature, i) => (
                    <li key={i} className="text-sm text-slate-300 flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose ProxyFlow?</h2>
            <p className="text-slate-300 text-lg">Enterprise-grade infrastructure for your projects</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3 bg-slate-800 bg-opacity-50 p-4 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                <span className="text-slate-200">{feature}</span>
              </div>
            ))}
          </div>

          {/* Code Example */}
          <div className="mt-16 bg-slate-900 p-8 rounded-xl border border-slate-700">
            <h3 className="text-2xl font-bold mb-4 flex items-center space-x-2">
              <Code className="w-6 h-6 text-blue-500" />
              <span>Simple Integration</span>
            </h3>
            <pre className="bg-slate-950 p-6 rounded-lg overflow-x-auto text-sm">
              <code className="text-green-400">
{`// JavaScript Example
const axios = require('axios');

const proxy = {
  host: 'proxy.proxyflow.io',
  port: 8080,
  auth: {
    username: 'your_username',
    password: 'your_password'
  }
};

axios.get('https://api.example.com/data', { proxy })
  .then(response => console.log(response.data))
  .catch(error => console.error(error));`}
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4 bg-slate-800 bg-opacity-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Built for Developers</h2>
            <p className="text-slate-300 text-lg">Power your applications with reliable proxies</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase, index) => (
              <div key={index} className="bg-slate-900 p-6 rounded-xl text-center hover:transform hover:scale-105 transition">
                <div className="inline-block p-3 bg-blue-600 bg-opacity-20 rounded-full text-blue-400 mb-4">
                  {useCase.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{useCase.title}</h3>
                <p className="text-slate-400 text-sm">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-slate-300 text-lg">Choose the plan that fits your needs</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div 
                key={index} 
                className={`bg-slate-900 p-8 rounded-xl border ${
                  plan.popular ? 'border-blue-500 relative' : 'border-slate-700'
                } hover:border-blue-500 transition`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-slate-400 text-sm mb-4">{plan.description}</p>
                  <div className="flex items-end justify-center">
                    <span className="text-5xl font-bold">{plan.price}</span>
                    <span className="text-slate-400 ml-2">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 rounded-lg font-medium transition ${
                  plan.popular 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}>
                  {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of developers using ProxyFlow for their projects
          </p>
          <button className="px-8 py-4 bg-white text-blue-600 hover:bg-slate-100 rounded-lg font-medium text-lg transition">
            Start Your Free Trial
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Globe className="w-6 h-6 text-blue-500" />
                <span className="text-lg font-bold">ProxyFlow</span>
              </div>
              <p className="text-slate-400 text-sm">Premium proxy services for developers worldwide</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-blue-400 transition">Pricing</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">Proxy Types</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">Use Cases</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-blue-400 transition">Documentation</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">Blog</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">Support</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-blue-400 transition">About</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">Contact</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">Privacy</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-slate-400 text-sm">
            © 2025 ProxyFlow. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}