/**
 * Common UI Components
 * Reusable components used throughout the app
 */

import { forwardRef } from 'react';

// ============================================
// BUTTON COMPONENT
// ============================================

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  ...props 
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-slate-700 text-white hover:bg-slate-600 focus:ring-slate-500',
    outline: 'border border-slate-700 text-slate-200 hover:bg-slate-800 focus:ring-slate-500',
    ghost: 'text-slate-300 hover:bg-slate-800 focus:ring-slate-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </>
      ) : children}
    </button>
  );
}

// ============================================
// INPUT COMPONENT
// ============================================

export const Input = forwardRef(({ 
  label,
  error,
  helperText,
  className = '',
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-2">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`
          w-full px-4 py-2 
          bg-slate-900 border rounded-lg
          text-white placeholder-slate-500
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500' : 'border-slate-700'}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-slate-400">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// ============================================
// CARD COMPONENT
// ============================================

export function Card({ 
  children, 
  className = '',
  hover = false,
  ...props 
}) {
  return (
    <div 
      className={`
        bg-slate-900 rounded-xl border border-slate-700 p-6
        ${hover ? 'hover:border-blue-500 transition-colors' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

// ============================================
// ALERT COMPONENT
// ============================================

export function Alert({ 
  children, 
  variant = 'info',
  onClose,
  className = '' 
}) {
  const variants = {
    info: 'bg-blue-900 bg-opacity-20 border-blue-500 text-blue-300',
    success: 'bg-green-900 bg-opacity-20 border-green-500 text-green-300',
    warning: 'bg-yellow-900 bg-opacity-20 border-yellow-500 text-yellow-300',
    error: 'bg-red-900 bg-opacity-20 border-red-500 text-red-300',
  };

  return (
    <div className={`rounded-lg border p-4 flex items-start justify-between ${variants[variant]} ${className}`}>
      <div className="flex-1">{children}</div>
      {onClose && (
        <button 
          onClick={onClose}
          className="ml-4 text-current opacity-70 hover:opacity-100 transition"
        >
          ×
        </button>
      )}
    </div>
  );
}

// ============================================
// SPINNER COMPONENT
// ============================================

export function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex items-center justify-center">
      <svg 
        className={`animate-spin ${sizes[size]} ${className}`}
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4" 
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
        />
      </svg>
    </div>
  );
}

// ============================================
// BADGE COMPONENT
// ============================================

export function Badge({ 
  children, 
  variant = 'default',
  className = '' 
}) {
  const variants = {
    default: 'bg-slate-700 text-slate-200',
    primary: 'bg-blue-600 text-white',
    success: 'bg-green-600 text-white',
    warning: 'bg-yellow-600 text-white',
    danger: 'bg-red-600 text-white',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}