import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState({});
  const navigate = useNavigate();

  const fetchLogs = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:3001/api/admin/logs', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/admin/login');
        return;
      }

      const data = await response.json();
      setLogs(data.logs || []);
    } catch (err) {
      setError('Failed to load chat logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }
    fetchLogs();
  }, [navigate, fetchLogs]);

  const updateStatus = async (chatId, newStatus) => {
    setUpdating(prev => ({ ...prev, [chatId]: true }));
    
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:3001/api/admin/update-status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: chatId,
          status: newStatus
        })
      });

      if (response.ok) {
        // Update local state
        setLogs(prev => prev.map(log => 
          log.id === chatId ? { ...log, status: newStatus } : log
        ));
      } else {
        setError('Failed to update status');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setUpdating(prev => ({ ...prev, [chatId]: false }));
    }
  };

  const getRowClass = (riskLevel, status) => {
    if (riskLevel === 'high_risk') return 'table-row-critical';
    if (status === 'critical') return 'table-row-critical';
    if (status === 'normal') return 'table-row-normal';
    if (status === 'reviewed') return 'table-row-reviewed';
    return 'table-row-normal';
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': 'badge-warning',
      'critical': 'badge-danger',
      'normal': 'badge-success',
      'reviewed': 'badge-info'
    };
    return badges[status] || 'badge-secondary';
  };

  const getRiskBadge = (riskLevel) => {
    const badges = {
      'high_risk': 'badge-danger',
      'low_risk': 'badge-success'
    };
    return badges[riskLevel] || 'badge-secondary';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading chat logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div className="header-actions">
          <span className="admin-user">
            Logged in as: {localStorage.getItem('adminUser')}
          </span>
          <button className="btn btn-secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
          <button className="btn btn-sm btn-outline-danger ms-2" onClick={fetchLogs}>
            Retry
          </button>
        </div>
      )}

      <div className="stats-container">
        <div className="stat-card">
          <h3>{logs.length}</h3>
          <p>Total Chats</p>
        </div>
        <div className="stat-card">
          <h3>{logs.filter(log => log.status === 'critical').length}</h3>
          <p>Critical Cases</p>
        </div>
        <div className="stat-card">
          <h3>{logs.filter(log => log.status === 'pending').length}</h3>
          <p>Pending Review</p>
        </div>
        <div className="stat-card">
          <h3>{logs.filter(log => log.status === 'reviewed').length}</h3>
          <p>Reviewed</p>
        </div>
      </div>

      <div className="table-container">
        <h2>Chat Logs</h2>
        <div className="table-responsive">
          <table className="chat-logs-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>User Message</th>
                <th>AI Response</th>
                <th>Detected Emotion</th>
                <th>Risk Level</th>
                <th>Risk Score</th>
                <th>Review Status</th>
                <th>Timestamp</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className={getRowClass(log.risk_level, log.status)}>
                  <td>{log.id}</td>
                  <td>{log.user_name || 'Unknown'}</td>
                  <td>{log.user_message || 'No user message'}</td>
                  <td className="response-cell">
                    <div className="response-content">
                      {log.ai_response}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadge(log.emotion)}`}>
                      {log.emotion}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getRiskBadge(log.risk_level)}`}>
                      {log.risk_level}
                    </span>
                  </td>
                  <td>{log.risk_score?.toFixed(2) || 'N/A'}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(log.status)}`}>
                      {log.status}
                    </span>
                  </td>
                  <td>{formatDate(log.timestamp)}</td>
                  <td>
                    {log.status !== 'reviewed' && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => updateStatus(log.id, 'reviewed')}
                        disabled={updating[log.id]}
                      >
                        {updating[log.id] ? 'Updating...' : 'Mark as Reviewed'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
