import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState('');

  const load = async () => {
    try {
      setError('');
      const { data } = await api.get('/products?limit=200');
      setProducts(data.docs || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Products fetch failed');
    }
  };

  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this product?');
    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError('');
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((product) => product._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeletingId('');
    }
  };

  return (
    <div className="card">
      <div className="admin-page-header">
        <div>
          <h2>Catalog Management</h2>
          <p className="admin-page-copy">Manage listings, pricing, featured inventory and cleanup from one place.</p>
        </div>
        <Link to="/products/add" className="admin-action-link">Add Product</Link>
      </div>
      {error && <p className="danger">{error}</p>}
      <div className="table-wrap">
        <table style={{ minWidth: 1100 }}>
          <thead>
            <tr><th>Image</th><th>Name</th><th>Key ID</th><th>Category</th><th>Brand</th><th>Price</th><th>Stock</th><th>Action</th></tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id}>
                <td>
                  <img
                    src={p.thumbnail || p.images?.[0]}
                    alt={p.name}
                    style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8 }}
                  />
                </td>
                <td>{p.name}</td>
                <td><span className="admin-status">{p.productKeyId || '-'}</span></td>
                <td>{p.category?.name || '-'}</td>
                <td>{p.brand}</td>
                <td>Rs.{p.price}</td>
                <td><span className="admin-status">{p.stock}</span></td>
                <td>
                  <Link to={`/products/${p._id}/edit`}>Edit</Link>
                  <button
                    type="button"
                    onClick={() => remove(p._id)}
                    disabled={deletingId === p._id}
                    style={{ marginLeft: 8 }}
                  >
                    {deletingId === p._id ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
