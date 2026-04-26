import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../services/api';

const legalItems = [
  {
    title: 'Privacy Policy',
    summary: 'Customer data, payments, order details aur security practices ka clear overview yahin se manage ya review kiya ja sakta hai.',
    action: 'Customer data ko sirf order processing, support, fraud prevention aur service improvement ke liye use kiya jata hai.'
  },
  {
    title: 'Terms & Conditions',
    summary: 'Website use, pricing, order acceptance, cancellation aur account responsibility ke basic rules is section me covered hain.',
    action: 'Suspicious orders, misuse ya policy abuse par order hold, cancellation ya account restriction lag sakti hai.'
  },
  {
    title: 'Return & Refund',
    summary: 'Wrong item, damage, defect aur eligible size issues ke liye return-exchange workflow yahin clearly diya gaya hai.',
    action: 'Approved prepaid refunds normally original payment method me process hote hain after quality checks.'
  },
  {
    title: 'Shipping Policy',
    summary: 'Dispatch timelines, delivery delays, serviceability aur failed delivery handling ke points ek hi jagah milte hain.',
    action: 'Remote areas ya courier delays ki wajah se timelines change ho sakti hain, isliye customer contact details accurate honi chahiye.'
  }
];

export default function Settings() {
  const { admin, setAdmin, logout } = useOutletContext();
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    avatar: '',
    password: ''
  });
  const [locationForm, setLocationForm] = useState({ location: '' });
  const [deliveryChargeForm, setDeliveryChargeForm] = useState({ deliveryCharge: '50' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [savingDeliveryCharge, setSavingDeliveryCharge] = useState(false);

  useEffect(() => {
    if (!admin) {
      return;
    }

    setProfileForm({
      name: admin.name || '',
      phone: admin.phone || '',
      avatar: admin.avatar || '',
      password: ''
    });
    setLocationForm({
      location: admin.location || ''
    });
  }, [admin]);

  useEffect(() => {
    const loadStoreSettings = async () => {
      try {
        const { data } = await api.get('/admin/settings');
        setDeliveryChargeForm({
          deliveryCharge: String(data.deliveryCharge ?? 0)
        });
      } catch (_err) {
        setDeliveryChargeForm({ deliveryCharge: '50' });
      }
    };

    loadStoreSettings();
  }, []);

  const updateStoredAdmin = (updatedAdmin) => {
    const mergedAdmin = {
      ...admin,
      ...updatedAdmin,
      token: admin?.token || localStorage.getItem('admin_token')
    };
    localStorage.setItem('admin_user', JSON.stringify(mergedAdmin));
    setAdmin(mergedAdmin);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setStatus({ type: '', message: '' });

    try {
      const payload = {
        name: profileForm.name,
        phone: profileForm.phone,
        avatar: profileForm.avatar
      };

      if (profileForm.password.trim()) {
        payload.password = profileForm.password;
      }

      const { data } = await api.put('/auth/me', payload);
      updateStoredAdmin(data);
      setProfileForm((prev) => ({ ...prev, password: '' }));
      setStatus({ type: 'success', message: 'Profile details successfully update ho gayi hain.' });
    } catch (err) {
      setStatus({
        type: 'danger',
        message: err.response?.data?.message || 'Profile update nahi ho paya.'
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const saveLocation = async (e) => {
    e.preventDefault();
    setSavingLocation(true);
    setStatus({ type: '', message: '' });

    try {
      const { data } = await api.put('/auth/me', { location: locationForm.location });
      updateStoredAdmin(data);
      setStatus({ type: 'success', message: 'Location successfully save ho gayi hai.' });
    } catch (err) {
      setStatus({
        type: 'danger',
        message: err.response?.data?.message || 'Location update nahi ho paya.'
      });
    } finally {
      setSavingLocation(false);
    }
  };

  const saveDeliveryCharge = async (e) => {
    e.preventDefault();
    setSavingDeliveryCharge(true);
    setStatus({ type: '', message: '' });

    try {
      const { data } = await api.put('/admin/settings', {
        deliveryCharge: Number(deliveryChargeForm.deliveryCharge)
      });
      setDeliveryChargeForm({
        deliveryCharge: String(data.deliveryCharge ?? 0)
      });
      setStatus({ type: 'success', message: 'Delivery charge successfully save ho gaya hai.' });
    } catch (err) {
      setStatus({
        type: 'danger',
        message: err.response?.data?.message || 'Delivery charge update nahi ho paya.'
      });
    } finally {
      setSavingDeliveryCharge(false);
    }
  };

  return (
    <section className="admin-panel-grid">
      <div className="admin-page-header">
        <div>
          <h2>Settings</h2>
          <p className="admin-page-copy">Profile edit, location change, logout aur policy information sab ek hi jagah se manage karo.</p>
        </div>
        <span className={`admin-status ${admin?.location ? 'success' : 'warning'}`}>
          {admin?.location ? `Current location: ${admin.location}` : 'Location not added yet'}
        </span>
      </div>

      {status.message && (
        <div className="card">
          <p className={status.type === 'success' ? 'success' : 'danger'}>{status.message}</p>
        </div>
      )}

      <div className="admin-settings-grid">
        <div className="admin-settings-stack">
          <form className="card admin-settings-form" onSubmit={saveProfile}>
            <div>
              <h3>Profile Edit</h3>
              <p className="admin-page-copy">Admin account ka basic profile yahin se update kar sakte ho.</p>
            </div>
            <input
              value={profileForm.name}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Full name"
              required
            />
            <input value={admin?.email || ''} disabled placeholder="Email" />
            <input
              value={profileForm.phone}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="Phone number"
            />
            <input
              value={profileForm.avatar}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, avatar: e.target.value }))}
              placeholder="Avatar URL"
            />
            <input
              type="password"
              value={profileForm.password}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="New password (optional)"
            />
            <div className="admin-settings-form-actions">
              <button type="submit" disabled={savingProfile}>
                {savingProfile ? 'Saving...' : 'Update Profile'}
              </button>
            </div>
          </form>

          <form className="card admin-settings-form" onSubmit={saveLocation}>
            <div>
              <h3>Location Change</h3>
              <p className="admin-page-copy">Apna operating city, warehouse location ya service area yahan update karo.</p>
            </div>
            <input
              value={locationForm.location}
              onChange={(e) => setLocationForm({ location: e.target.value })}
              placeholder="Jaise: Jaipur, Rajasthan"
              required
            />
            <div className="admin-settings-form-actions">
              <button type="submit" disabled={savingLocation}>
                {savingLocation ? 'Saving...' : 'Save Location'}
              </button>
            </div>
          </form>

          <form className="card admin-settings-form" onSubmit={saveDeliveryCharge}>
            <div>
              <h3>Delivery Charge</h3>
              <p className="admin-page-copy">Yahan se website ka default delivery charge set karo. Maximum Rs.50 tak hi allowed rahega.</p>
            </div>
            <input
              type="number"
              min="0"
              max="50"
              step="1"
              value={deliveryChargeForm.deliveryCharge}
              onChange={(e) => setDeliveryChargeForm({ deliveryCharge: e.target.value })}
              placeholder="Jaise: 50"
              required
            />
            <div className="admin-settings-form-actions">
              <button type="submit" disabled={savingDeliveryCharge}>
                {savingDeliveryCharge ? 'Saving...' : 'Save Delivery Charge'}
              </button>
              <span className="admin-status success">Current: Rs.{Number(deliveryChargeForm.deliveryCharge || 0)}</span>
            </div>
          </form>
        </div>

        <div className="admin-settings-stack">
          <div className="card admin-logout-card">
            <h3>Account Access</h3>
            <p className="admin-page-copy">Agar aap session end karna chahte ho to yahin se secure logout kar sakte ho.</p>
            <div className="admin-settings-form-actions" style={{ marginTop: 14 }}>
              <button type="button" className="admin-logout-button" onClick={logout}>
                Log Out
              </button>
            </div>
          </div>

          <div className="card">
            <h3>Privacy, Terms & Formalities</h3>
            <p className="admin-page-copy">Important customer-facing policies ka short version yahan rakha gaya hai, taki sab kuch settings me hi mil jaye.</p>
            <div className="admin-legal-list" style={{ marginTop: 14 }}>
              {legalItems.map((item) => (
                <article key={item.title} className="admin-legal-item">
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                  <p className="admin-page-copy">{item.action}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
