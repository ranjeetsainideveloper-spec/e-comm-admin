import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setError('');
      const { data } = await api.get('/admin/reviews');
      setReviews(data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Reviews fetch failed');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleApproval = async (review) => {
    try {
      setError('');
      await api.put(`/admin/reviews/${review._id}`, { isApproved: !review.isApproved });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Review update failed');
    }
  };

  const remove = async (id) => {
    try {
      setError('');
      await api.delete(`/admin/reviews/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Review delete failed');
    }
  };

  return (
    <div className="card">
      <div className="admin-page-header">
        <div>
          <h2>Review Moderation</h2>
          <p className="admin-page-copy">Approve, hide and remove reviews so public trust signals stay clean.</p>
        </div>
      </div>
      {error && <p className="danger">{error}</p>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>User</th>
              <th>Rating</th>
              <th>Comment</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review._id}>
                <td>{review.product?.name || '-'}</td>
                <td>{review.user?.name || '-'}</td>
                <td>{review.rating}</td>
                <td>{review.comment}</td>
                <td><span className="admin-status">{review.isApproved ? 'Approved' : 'Hidden'}</span></td>
                <td>
                  <button onClick={() => toggleApproval(review)}>{review.isApproved ? 'Hide' : 'Approve'}</button>
                  <button onClick={() => remove(review._id)} style={{ marginLeft: 8 }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
