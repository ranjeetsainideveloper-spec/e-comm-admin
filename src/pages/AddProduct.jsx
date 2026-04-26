import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const initial = {
  name: '',
  productKeyId: '',
  description: '',
  price: 0,
  discount: 0,
  category: '',
  brand: '',
  sizes: 'S,M,L',
  stock: 0,
  thumbnail: '',
  images: '',
  isFeatured: true
};

const starterCategories = [
  { name: 'Women Fashion', image: '' },
  { name: 'Men Fashion', image: '' },
  { name: 'Kids Wear', image: '' },
  { name: 'Footwear', image: '' },
  { name: 'Beauty', image: '' },
  { name: 'Accessories', image: '' }
];

export default function AddProduct() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [creatingCategories, setCreatingCategories] = useState(false);

  const loadCategories = async () => {
    const { data } = await api.get('/categories');
    setCategories(data || []);
    setForm((prev) => ({
      ...prev,
      category: prev.category || data?.[0]?._id || ''
    }));
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const createStarterCategories = async () => {
    setCreatingCategories(true);
    setError('');
    try {
      await Promise.all(
        starterCategories.map((category) =>
          api.post('/categories', category).catch((err) => {
            if (err.response?.data?.message === 'Category already exists') return null;
            throw err;
          })
        )
      );
      await loadCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Category create failed');
    } finally {
      setCreatingCategories(false);
    }
  };

  const uploadLocalImages = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
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
      if (!form.category) {
        setError('Please add or select a category first');
        return;
      }

      const images = form.images.split(',').map((s) => s.trim()).filter(Boolean);
      if (images.length < 4) {
        setError('Minimum 4 images required');
        return;
      }
      await api.post('/products', {
        ...form,
        sizes: form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
        images,
        price: Number(form.price),
        discount: Number(form.discount),
        stock: Number(form.stock)
      });
      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.message || 'Create failed');
    }
  };

  return (
    <div className="card">
      <div className="admin-page-header">
        <div>
          <h2>Add Product</h2>
          <p className="admin-page-copy">Create a conversion-ready listing with clean images, pricing and variants.</p>
        </div>
      </div>
      <form onSubmit={submit} className="admin-form-grid">
        <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Name" required />
        <input
          value={form.productKeyId}
          onChange={(e) => setForm((prev) => ({ ...prev, productKeyId: e.target.value.toUpperCase() }))}
          placeholder="Product Key ID (optional, auto-generate if blank)"
        />
        <textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Description" rows={4} required />
        <input type="number" value={form.price} onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))} placeholder="Price" required />
        <input type="number" value={form.discount} onChange={(e) => setForm((prev) => ({ ...prev, discount: e.target.value }))} placeholder="Discount %" />
        <div>
          <label htmlFor="category" className="mb-2 block text-sm font-semibold text-slate-700">Category</label>
          <select
            id="category"
            value={form.category}
            onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
            required
            disabled={categories.length === 0}
          >
            <option value="">
              {categories.length === 0 ? 'No category available. Add category first.' : 'Select category'}
            </option>
            {categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
          </select>
          {categories.length === 0 && (
            <div className="mt-2 space-y-2">
              <p className="text-sm text-amber-700">
                Abhi category list empty hai. Neeche click karke ready-made category options bana lo.
              </p>
              <button type="button" onClick={createStarterCategories} disabled={creatingCategories}>
                {creatingCategories ? 'Creating categories...' : 'Create starter categories'}
              </button>
            </div>
          )}
        </div>
        <input value={form.brand} onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))} placeholder="Brand" />
        <input value={form.sizes} onChange={(e) => setForm((prev) => ({ ...prev, sizes: e.target.value }))} placeholder="Sizes comma separated" />
        <input type="number" value={form.stock} onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))} placeholder="Stock" />
        <input value={form.thumbnail} onChange={(e) => setForm((prev) => ({ ...prev, thumbnail: e.target.value }))} placeholder="Thumbnail URL" />
        <input value={form.images} onChange={(e) => setForm((prev) => ({ ...prev, images: e.target.value }))} placeholder="Image URLs comma separated" />
        <label>Upload images from system (min 4)</label>
        <input type="file" accept="image/*" multiple onChange={uploadLocalImages} />
        {uploading && <p>Uploading images...</p>}
        <label><input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm((prev) => ({ ...prev, isFeatured: e.target.checked }))} /> Featured</label>
        {error && <p className="danger">{error}</p>}
        <button type="submit">Create Product</button>
      </form>
    </div>
  );
}
