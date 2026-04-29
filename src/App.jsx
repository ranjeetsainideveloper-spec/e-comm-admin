import React, { useEffect, useState } from 'react';
import { Navigate, NavLink, Outlet, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import AddProduct from './pages/AddProduct';
import EditProduct from './pages/EditProduct';
import Orders from './pages/Orders';
import Users from './pages/Users';
import Categories from './pages/Categories';
import Reviews from './pages/Reviews';
import Ratings from './pages/Ratings';
import Settings from './pages/Settings';
import api from './services/api';

const navItems = [
  { to: '/', label: 'Overview' },
  { to: '/products', label: 'Catalog' },
  { to: '/categories', label: 'Categories' },
  { to: '/orders', label: 'Orders' },
  { to: '/users', label: 'Users' },
  { to: '/reviews', label: 'Reviews' },
  { to: '/ratings', label: 'Ratings' },
  { to: '/settings', label: 'Settings' }
];

function AdminLayout({ children }) {
  const [admin, setAdmin] = useState(() => JSON.parse(localStorage.getItem('admin_user') || 'null'));
  const [loginForm, setLoginForm] = useState({ email: 'admin@example.com', password: 'Admin@123' });
  const [loginError, setLoginError] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const verifyAdminSession = async () => {
      const storedToken = localStorage.getItem('admin_token') || localStorage.getItem('token');
      const storedUser = JSON.parse(localStorage.getItem('admin_user') || 'null');

      if (!storedToken || !storedUser) {
        setAdmin(null);
        setCheckingSession(false);
        return;
      }

      try {
        const { data } = await api.get('/auth/me');
        if (data.role !== 'admin') {
          throw new Error('Admin access required');
        }
        const mergedAdmin = { ...storedUser, ...data, token: storedToken };
        localStorage.setItem('admin_token', storedToken);
        localStorage.setItem('admin_user', JSON.stringify(mergedAdmin));
        setAdmin(mergedAdmin);
      } catch (err) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        setAdmin(null);
        setLoginError(err.response?.data?.message || err.message || 'Admin login required');
      } finally {
        setCheckingSession(false);
      }
    };

    verifyAdminSession();
  }, []);

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/';
  };

  const login = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const { data } = await api.post('/auth/login', loginForm);
      if (data.role !== 'admin') {
        setLoginError('Admin access required');
        return;
      }
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(data));
      setAdmin(data);
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Login failed');
    }
  };

  const forgotPassword = async () => {
    try {
      await api.post('/auth/forgot-password', { email: loginForm.email });
      alert('If account exists, reset link printed to server console (demo).');
    } catch (err) {
      alert('Unable to request reset: ' + (err.response?.data?.message || err.message));
    }
  };

  if (checkingSession) {
    return (
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <div className="admin-brand-card">
            <p className="admin-eyebrow">Marketplace Admin</p>
            <h1 className="admin-logo">ShopVa Studio</h1>
            <p className="admin-brand-copy">Checking admin session and reconnecting your control room.</p>
          </div>
        </aside>
        <div className="admin-main">
          <main className="admin-page">
            <div className="card admin-empty-state">
              <h2 style={{ marginTop: 0 }}>Loading admin workspace</h2>
              <p>Please wait while we verify your admin access.</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand-card">
          <p className="admin-eyebrow">Marketplace Admin</p>
          <h1 className="admin-logo">ShopVa Studio</h1>
          <p className="admin-brand-copy">ShopVa seller control room for catalog, orders and growth tracking.</p>
        </div>
        <nav className="admin-nav-vertical">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        {admin ? (
          <div className="admin-user-block">
            <p className="admin-user-label">Signed in as</p>
            <strong>{admin.name || 'Admin'}</strong>
            <p>{admin.email}</p>
            <button onClick={logout}>Logout</button>
          </div>
        ) : (
          <form onSubmit={login} className="admin-user-block" style={{ display: 'grid', gap: 8 }}>
            <p className="admin-user-label">Login from here</p>
            <input
              value={loginForm.email}
              onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="Admin email"
            />
            <input
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Password"
            />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit">Login</button>
                  <button type="button" onClick={forgotPassword} className="muted">Forgot password?</button>
                </div>
            {loginError && <p className="danger" style={{ margin: 0 }}>{loginError}</p>}
          </form>
        )}
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-inner">
            <div>
              <p className="admin-topbar-label">Operations board</p>
              <h2 className="admin-topbar-title">{admin ? 'Realtime marketplace control center' : 'Login required to manage the storefront'}</h2>
            </div>
            {admin && (
              <div className="admin-topbar-stat-row">
                <span className="admin-topbar-pill">Catalog Ops</span>
                <span className="admin-topbar-pill">Order Tracking</span>
                <span className="admin-topbar-pill">Customer Trust</span>
              </div>
            )}
          </div>
        </header>
        <main className="admin-page">
          {admin ? (children || <Outlet context={{ admin, setAdmin, logout }} />) : (
            <div className="card admin-empty-state">
              <h2 style={{ marginTop: 0 }}>Website Control Panel</h2>
              <p>Left sidebar se login karo, phir products, orders, users aur reviews ko ek jagah se manage kar sakte ho.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<AdminLayout />}
      >
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="products/add" element={<AddProduct />} />
        <Route path="products/:id/edit" element={<EditProduct />} />
        <Route path="categories" element={<Categories />} />
        <Route path="orders" element={<Orders />} />
        <Route path="users" element={<Users />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="ratings" element={<Ratings />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
