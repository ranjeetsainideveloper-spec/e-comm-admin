import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, totalOrders: 0, totalProducts: 0, totalRevenue: 0 });
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/admin/dashboard');
        setStats(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to fetch dashboard');
      }
    };
    load();
  }, []);

  return (
    <div className="admin-panel-grid">
      <div className="card admin-hero-card">
        <div className="admin-page-header">
          <div>
            <p className="stat-label" style={{ color: 'rgba(255,255,255,0.75)' }}>Marketplace Snapshot</p>
            <h2 style={{ margin: 0 }}>Growth, catalog and customer trust in one ShopVa board</h2>
            <p style={{ margin: '10px 0 0' }}>Track revenue momentum, keep inventory fresh and move faster on order operations.</p>
          </div>
          <span className="admin-status" style={{ background: 'rgba(255,255,255,0.14)', color: '#fff' }}>Live Monitoring</span>
        </div>
      </div>
      {error && <p className="danger">{error}</p>}
      <section className="grid grid-4">
        <article className="card admin-kpi"><p className="stat-label">Total Users</p><p className="stat-value">{stats.totalUsers}</p><p className="hint">Registered buyers on the platform</p></article>
        <article className="card admin-kpi"><p className="stat-label">Total Orders</p><p className="stat-value">{stats.totalOrders}</p><p className="hint">Orders that need visibility and status updates</p></article>
        <article className="card admin-kpi"><p className="stat-label">Total Products</p><p className="stat-value">{stats.totalProducts}</p><p className="hint">Active catalog units across categories</p></article>
        <article className="card admin-kpi"><p className="stat-label">Total Revenue</p><p className="stat-value">Rs.{Math.round(stats.totalRevenue)}</p><p className="hint">Combined order value tracked by the backend</p></article>
      </section>
      <section className="grid grid-2">
        <article className="card admin-highlight">
          <h3>Quick Actions</h3>
          <p className="hint">Add fresh listings, review stock health, and push pending orders to the next status.</p>
          <div className="chip-row">
            <span className="chip">Add Catalog</span>
            <span className="chip">Approve Reviews</span>
            <span className="chip">Track Deliveries</span>
          </div>
        </article>
        <article className="card">
          <h3>Platform Health</h3>
          <p className="hint">Healthy stores keep prices current, stock synced, and review moderation quick.</p>
          <div className="chip-row">
            <span className="admin-status">Catalog Quality</span>
            <span className="admin-status">Payments Flow</span>
            <span className="admin-status">Support Ready</span>
          </div>
        </article>
      </section>
    </div>
  );
}
