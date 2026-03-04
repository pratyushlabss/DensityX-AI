import React, { useState } from 'react';
import { apiClient } from '../services/apiClient';

export function LoginRegister({ onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState('register');
  const [formData, setFormData] = useState({
    ticketId: '',
    name: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [validTickets] = useState([
    'DX-005491', 'DX-010437', 'DX-019018', 'DX-028903', 'DX-059948',
    'DX-071234', 'DX-084567', 'DX-091823', 'DX-102934', 'DX-115678'
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (!formData.ticketId.trim()) {
        throw new Error('❌ Please enter a valid ticket ID (e.g., DX-005491)');
      }
      if (!formData.name.trim()) {
        throw new Error('❌ Please enter your name');
      }
      if (!formData.phone.trim() || formData.phone.length < 10) {
        throw new Error('❌ Please enter a valid phone number (at least 10 digits)');
      }

      const response = await apiClient.registerUser(
        formData.ticketId.toUpperCase(),
        formData.name,
        formData.phone
      );

      setMessageType('success');
      setMessage(`✅ ${response.message || 'Registration successful!'}`);
      
      // Store user in localStorage
      localStorage.setItem('userTicketId', formData.ticketId.toUpperCase());
      localStorage.setItem('userName', formData.name);

      // Trigger login after 2 seconds
      setTimeout(() => {
        onLoginSuccess(formData.ticketId.toUpperCase());
      }, 2000);

    } catch (error) {
      setMessageType('error');
      setMessage(`❌ ${error.message || 'Registration failed'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (ticketId) => {
    setFormData(prev => ({
      ...prev,
      ticketId: ticketId
    }));
    localStorage.setItem('userTicketId', ticketId);
    onLoginSuccess(ticketId);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        width: '100%',
        maxWidth: '450px',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '30px 20px',
          textAlign: 'center'
        }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '28px' }}>🎯 DensityX</h1>
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Crowd Monitoring System</p>
        </div>

        {/* Content */}
        <div style={{ padding: '30px' }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '30px',
            borderBottom: '2px solid #f0f0f0'
          }}>
            <button
              onClick={() => setActiveTab('register')}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === 'register' ? '600' : '400',
                color: activeTab === 'register' ? '#667eea' : '#999',
                borderBottom: activeTab === 'register' ? '3px solid #667eea' : 'none',
                transition: 'all 0.3s'
              }}
            >
              📝 Register
            </button>
            <button
              onClick={() => setActiveTab('quickstart')}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === 'quickstart' ? '600' : '400',
                color: activeTab === 'quickstart' ? '#667eea' : '#999',
                borderBottom: activeTab === 'quickstart' ? '3px solid #667eea' : 'none',
                transition: 'all 0.3s'
              }}
            >
              ⚡ Quick Start
            </button>
          </div>

          {/* Register Tab */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#333'
                }}>
                  🎫 Ticket ID
                </label>
                <input
                  type="text"
                  name="ticketId"
                  placeholder="e.g., DX-005491"
                  value={formData.ticketId}
                  onChange={handleInputChange}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    fontFamily: 'monospace',
                    transition: 'border-color 0.3s',
                    backgroundColor: '#fafafa'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
                <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
                  Format: DX-XXXXXX (6 digits)
                </small>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#333'
                }}>
                  👤 Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.3s',
                    backgroundColor: '#fafafa'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#333'
                }}>
                  📱 Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="10+ digits"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.3s',
                    backgroundColor: '#fafafa'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>

              {message && (
                <div style={{
                  padding: '12px',
                  borderRadius: '6px',
                  backgroundColor: messageType === 'success' ? '#d4edda' : '#f8d7da',
                  color: messageType === 'success' ? '#155724' : '#721c24',
                  fontSize: '13px',
                  textAlign: 'center'
                }}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'transform 0.2s, opacity 0.2s',
                  opacity: loading ? 0.7 : 1,
                  transform: loading ? 'scale(0.98)' : 'scale(1)'
                }}
              >
                {loading ? '⏳ Registering...' : '✅ Register & Enter'}
              </button>

              <small style={{ color: '#999', textAlign: 'center', marginTop: '10px' }}>
                Need help? Check the Quick Start tab for test credentials
              </small>
            </form>
          )}

          {/* Quick Start Tab */}
          {activeTab === 'quickstart' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                background: '#f5f5f5',
                padding: '12px',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#333'
              }}>
                <strong>📌 Test Instructions:</strong>
                <ol style={{ margin: '10px 0 0 0', paddingLeft: '20px' }}>
                  <li>Click a ticket below to auto-fill</li>
                  <li>Enter your name and phone (any valid number)</li>
                  <li>Click "Register & Enter"</li>
                  <li>You'll see live crowd data on the map</li>
                </ol>
              </div>

              <div style={{ marginTop: '10px' }}>
                <strong style={{ fontSize: '13px', color: '#333' }}>Available Test Tickets:</strong>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  marginTop: '12px'
                }}>
                  {validTickets.map((ticket) => (
                    <button
                      key={ticket}
                      onClick={() => handleQuickLogin(ticket)}
                      style={{
                        padding: '10px',
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        fontFamily: 'monospace',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#764ba2';
                        e.target.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = '#667eea';
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      {ticket}
                    </button>
                  ))}
                </div>
              </div>

              <small style={{ color: '#999', textAlign: 'center', marginTop: '20px' }}>
                💡 Tip: Click any ticket button above to quick-login
              </small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
