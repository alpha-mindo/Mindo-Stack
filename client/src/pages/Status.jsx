import { useState, useEffect } from 'react';
import './Auth.css';
import './Status.css';

const Status = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/status');
      if (!response.ok) throw new Error('Failed to fetch status');
      const data = await response.json();
      setStatus(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-container parsec-style">
        <div className="auth-background">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
        </div>
        <div className="status-loading">Loading system status...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="auth-container parsec-style">
        <div className="auth-background">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
        </div>
        <div className="auth-content-wrapper">
          <div className="auth-card parsec-card">
            <div className="error-message parsec-error">
              <h2>⚠️ Error</h2>
              <p>{error}</p>
              <button onClick={fetchStatus} className="auth-button">Retry</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (dbStatus) => {
    return dbStatus === 'Connected' ? '#10b981' : '#ef4444';
  };

  return (
    <div className="auth-container parsec-style">
      <div className="auth-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>
      
      <div className="status-full-page">
        <div className="status-header">
          <h1>🚀 System Status</h1>
          <p className="subtitle">Backend API Monitoring Dashboard</p>
          <div className="system-info-grid">
            <div className="info-item">
              <span className="info-label">Status</span>
              <span className="info-value operational">✓ {status.system.status}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Database</span>
              <span 
                className="info-value" 
                style={{ color: getStatusColor(status.system.database) }}
              >
                {status.system.database}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Environment</span>
              <span className="info-value">{status.system.environment}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Last Check</span>
              <span className="info-value">{new Date(status.system.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        <div className="status-section">
            <h2>✨ Features Status</h2>
            <div className="features-grid">
              {Object.entries(status.features).map(([key, value]) => (
                <div key={key} className="feature-item">
                  <span className="feature-name">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className="feature-status">
                    {typeof value === 'boolean' ? (value ? '✓' : '✗') : value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="status-section">
            <h2>📦 Database Models</h2>
            <div className="models-grid">
              {status.models.implemented.map((model, index) => (
                <div key={index} className="model-badge">
                  <span className="model-check">✓</span>
                  {model}
                </div>
              ))}
            </div>
          </div>

          <div className="status-section">
            <h2>🛣️ API Routes</h2>
            {Object.entries(status.routes).map(([category, data]) => (
              <div key={category} className="route-category-section">
                <div className="category-title">
                  <h3>{category.charAt(0).toUpperCase() + category.slice(1)}</h3>
                  <span className="category-base">{data.base}</span>
                  <span className="category-count">{data.endpoints.length} endpoints</span>
                </div>
                <div className="endpoints-container">
                  {data.endpoints.map((endpoint, index) => (
                    <div key={index} className="endpoint-row">
                      <span className={`http-method method-${endpoint.method.toLowerCase()}`}>
                        {endpoint.method}
                      </span>
                      <div className="endpoint-details">
                        <code className="endpoint-path">{data.base}{endpoint.path}</code>
                        <span className="endpoint-desc">{endpoint.description}</span>
                        <div className="endpoint-badges">
                          {endpoint.auth && <span className="badge-auth">Auth</span>}
                          {endpoint.permission && <span className="badge-permission">{endpoint.permission}</span>}
                          {endpoint.role && <span className="badge-role">{endpoint.role}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="stats-summary">
            <div className="stat-box">
              <div className="stat-number">{Object.values(status.routes).reduce((sum, cat) => sum + cat.endpoints.length, 0)}</div>
              <div className="stat-text">Total Endpoints</div>
            </div>
            <div className="stat-box">
              <div className="stat-number">{Object.keys(status.routes).length}</div>
              <div className="stat-text">Route Categories</div>
            </div>
            <div className="stat-box">
              <div className="stat-number">{status.models.implemented.length}</div>
              <div className="stat-text">Database Models</div>
            </div>
          </div>

          <button className="auth-button refresh-button" onClick={fetchStatus}>
            🔄 Refresh Status
          </button>
        </div>
      </div>
  );
};

export default Status;
