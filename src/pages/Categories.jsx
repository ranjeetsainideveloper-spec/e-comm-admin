import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const { data } = await api.get('/categories');
    setCategories(data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/categories', { name, image });
      setName('');
      setImage('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Create failed');
    }
  };

  const remove = async (id) => {
    await api.delete(`/categories/${id}`);
    load();
  };

  return (
    <div className="grid grid-2">
      <article className="card">
        <div className="admin-page-header">
          <div>
            <h2>Category Management</h2>
            <p className="admin-page-copy">Keep storefront navigation neat with strong, shopper-friendly category buckets.</p>
          </div>
        </div>
        <form onSubmit={add} className="admin-form-grid">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" required />
          <input value={image} onChange={(e) => setImage(e.target.value)} placeholder="Category image URL" />
          <button type="submit">Add category</button>
        </form>
        {error && <p className="danger">{error}</p>}
      </article>
      <article className="card">
        <h3>All Categories</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Slug</th><th>Action</th></tr></thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat._id}>
                  <td>{cat.name}</td>
                  <td>{cat.slug}</td>
                  <td><button onClick={() => remove(cat._id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}
