import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

const normalizeProductForm = (product) => ({
  name: product.name || '',
  productKeyId: product.productKeyId || '',
  description: product.description || '',
  price: product.price ?? 0,
  discount: product.discount ?? 0,
  category: product.category?._id || product.category || '',
  brand: product.brand || '',
  sizes: Array.isArray(product.sizes) ? product.sizes.join(',') : '',
  stock: product.stock ?? 0,
  thumbnail: product.thumbnail || '',
  images: Array.isArray(product.images) ? product.images.join(',') : '',
  isFeatured: Boolean(product.isFeatured)
});

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setError('');
      try {
        const [{ data: product }, { data: categoryList }] = await Promise.all([
          api.get(`/products/${id}`),
          api.get('/categories')
        ]);

        setCategories(categoryList || []);
        setForm(normalizeProductForm(product));
      } catch (err) {
        setError(err.response?.data?.message || 'Product load failed');
      }
    };
    load();
  }, [id]);

  if (!form) return <div>{error || 'Loading...'}</div>;

  const uploadLocalImages = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0 || !form) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('images', file));
      const { data } = await api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const backendHost = (api.defaults.baseURL || '').replace('/api', '');
      const uploaded = (data.urls || []).map((url) => (url.startsWith('http') ? url : `${backendHost}${url}`));
      const merged = [...new Set([...form.images.split(',').map((s) => s.trim()).filter(Boolean), ...uploaded])];
      setForm((prev) => ({
        ...prev,
        images: merged.join(','),
        thumbnail: prev.thumbnail || uploaded[0] || ''
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const images = form.images.split(',').map((s) => s.trim()).filter(Boolean);
      if (images.length < 4) {
        setError('Minimum 4 images required');
        return;
      }

      await api.put(`/products/${id}`, {
        name: form.name,
        productKeyId: form.productKeyId,
        description: form.description,
        category: form.category,
        brand: form.brand,
        thumbnail: form.thumbnail,
        isFeatured: form.isFeatured,
        sizes: form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
        images,
        price: Number(form.price),
        discount: Number(form.discount),
        stock: Number(form.stock)
      });

      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div className="card">
      <div className="admin-page-header">
        <div>
          <h2>Edit Product</h2>
          <p className="admin-page-copy">Refresh listing details, featured visibility and image quality without breaking product history.</p>
        </div>
      </div>
      <form onSubmit={submit} className="admin-form-grid">
        <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
        <input
          value={form.productKeyId}
          onChange={(e) => setForm((prev) => ({ ...prev, productKeyId: e.target.value.toUpperCase() }))}
          placeholder="Product Key ID (auto-generate if blank)"
        />
        <textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} rows={4} required />
        <input type="number" value={form.price} onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))} required />
        <input type="number" value={form.discount} onChange={(e) => setForm((prev) => ({ ...prev, discount: e.target.value }))} />
        <select value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}>
          {categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
        </select>
        <input value={form.brand} onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))} />
        <input value={form.sizes} onChange={(e) => setForm((prev) => ({ ...prev, sizes: e.target.value }))} />
        <input type="number" value={form.stock} onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))} />
        <input value={form.thumbnail} onChange={(e) => setForm((prev) => ({ ...prev, thumbnail: e.target.value }))} />
        <input value={form.images} onChange={(e) => setForm((prev) => ({ ...prev, images: e.target.value }))} />
        <label>Upload more images</label>
        <input type="file" accept="image/*" multiple onChange={uploadLocalImages} />
        {uploading && <p>Uploading images...</p>}
        {error && <p className="danger">{error}</p>}
        <label><input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm((prev) => ({ ...prev, isFeatured: e.target.checked }))} /> Featured</label>
        <button type="submit">Save</button>
      </form>
    </div>
  );
}
