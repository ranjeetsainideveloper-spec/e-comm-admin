import React, { useEffect, useState } from 'react';
import api from '../services/api';

const buildMediaUrl = (url = '') => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${(api.defaults.baseURL || '').replace('/api', '')}${url}`;
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setError('');
      const { data } = await api.get('/admin/users');
      setUsers(data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Users fetch failed');
    }
  };

  useEffect(() => { load(); }, []);

  const updateRole = async (id, role) => {
    try {
      setError('');
      await api.put(`/admin/users/${id}/role`, { role });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Role update failed');
    }
  };

  return (
    <div className="card">
      <div className="admin-page-header">
        <div>
          <h2>User Management</h2>
          <p className="admin-page-copy">Customer ka full profile, DP, contact, bank details aur wallet yahin se dekh sakte ho.</p>
        </div>
      </div>
      {error && <p className="danger">{error}</p>}
      <div className="table-wrap">
        <table style={{ minWidth: 1280 }}>
          <thead><tr><th>Customer</th><th>Email</th><th>Phone</th><th>Refund Details</th><th>Wallet</th><th>Role</th><th>Action</th></tr></thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {user.avatar ? (
                      <img
                        src={buildMediaUrl(user.avatar)}
                        alt={user.name}
                        style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: '999px', border: '1px solid var(--border)' }}
                      />
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: '999px', background: 'var(--accent-soft)', display: 'grid', placeItems: 'center', fontWeight: 700 }}>
                        {(user.name || 'U').slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <strong>{user.name}</strong>
                      <div style={{ color: 'var(--muted)', fontSize: 12 }}>{user.location || 'Location not added'}</div>
                    </div>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>{user.phone || '-'}</td>
                <td>
                  <div style={{ display: 'grid', gap: 4, fontSize: 12 }}>
                    <span>UPI: {user.refundDetails?.upiId || '-'}</span>
                    <span>A/C: {user.refundDetails?.accountNumber || '-'}</span>
                    <span>IFSC: {user.refundDetails?.ifscCode || '-'}</span>
                    <span>Bank: {user.refundDetails?.bankName || '-'}</span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'grid', gap: 4 }}>
                    <strong>Rs.{Math.round(user.wallet?.balance || 0)}</strong>
                    <span style={{ color: 'var(--muted)', fontSize: 12 }}>{user.wallet?.entries?.length || 0} wallet entries</span>
                  </div>
                </td>
                <td><span className="admin-status">{user.role}</span></td>
                <td>
                  <select value={user.role} onChange={(e) => updateRole(user._id, e.target.value)}>
                    <option value="user">user</option>
                    <option value="vendor">vendor</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
