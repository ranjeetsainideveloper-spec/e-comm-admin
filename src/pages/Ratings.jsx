import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function Ratings() {
  const [ratings, setRatings] = useState([]);
  const [stats, setStats] = useState({ total: 0, averageRating: 0 });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/ratings/admin');
      setRatings(data.ratings || []);
      setStats({ total: data.total || 0, averageRating: data.averageRating || 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!confirm('Delete this rating?')) return;
    await api.delete(`/ratings/${id}`);
    load();
  };

  const exportCsv = () => {
    window.location.href = api.defaults.baseURL.replace('/api','') + '/api/ratings/admin/export';
  };

  return (
    <div>
      <h2 className="text-2xl font-bold">Customer Ratings</h2>
      <div className="mt-4 mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm">Total ratings: <strong>{stats.total}</strong></p>
          <p className="text-sm">Average rating: <strong>{Number(stats.averageRating).toFixed(2)}</strong> / 5</p>
        </div>
        <div>
          <button onClick={exportCsv} className="rounded bg-slate-900 px-4 py-2 text-white">Export CSV</button>
        </div>
      </div>

      {loading && <p>Loading...</p>}
      {!loading && ratings.length === 0 && <p>No ratings yet.</p>}
      <div className="space-y-3">
        {ratings.map((r) => (
          <div key={r._id} className="card p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{r.user?.name || 'Customer'}</p>
                <p className="text-xs text-slate-500">{r.user?.email}</p>
              </div>
              <div className="text-sm text-slate-600">{new Date(r.createdAt).toLocaleString()}</div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <p>Order: {String(r.order?._id || '').slice(-8)}</p>
                <p>Rating: {'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</p>
                {r.feedback && <p className="mt-2 text-sm">Feedback: {r.feedback}</p>}
              </div>
              <div>
                <button onClick={() => remove(r._id)} className="rounded border px-3 py-1">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
