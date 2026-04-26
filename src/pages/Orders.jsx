import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const statusOptions = [
  'PLACED',
  'CONFIRMED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'RETURN_REQUESTED',
  'RETURNED',
  'CANCELLED'
];

const sectionConfig = [
  {
    key: 'newOrders',
    title: 'New Orders',
    description: 'Naye orders jo abhi fresh aaye hain aur processing start karni hai.',
    statuses: ['PLACED']
  },
  {
    key: 'deliveryPipeline',
    title: 'Delivery Pipeline',
    description: 'Pending, confirmed aur delivery wale orders ek jagah.',
    statuses: ['CONFIRMED', 'SHIPPED', 'OUT_FOR_DELIVERY']
  },
  {
    key: 'deliveredOrders',
    title: 'Delivered',
    description: 'Safely delivered orders yahan move ho jayenge.',
    statuses: ['DELIVERED']
  },
  {
    key: 'returnOrders',
    title: 'Returns',
    description: 'Return request aur returned orders alag track honge.',
    statuses: ['RETURN_REQUESTED', 'RETURNED']
  },
  {
    key: 'cancelledOrders',
    title: 'Cancelled',
    description: 'Cancelled orders ko alag se monitor karne ke liye.',
    statuses: ['CANCELLED']
  }
];

const adminTabs = [
  { key: 'newOrders', label: 'New Orders' },
  { key: 'deliveryPipeline', label: 'Delivery' },
  { key: 'deliveredOrders', label: 'Delivered' },
  { key: 'returnOrders', label: 'Returns' },
  { key: 'cancelledOrders', label: 'Cancelled' }
];

const formatStatus = (status = '') =>
  status
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');

const buildMediaUrl = (url = '') => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const base = (api.defaults.baseURL || '').replace('/api', '');
  return `${base}${url}`;
};

const isVideoFile = (url = '') => /\.(mp4|mov|webm|mkv|avi)$/i.test(url);
const barcodeAlphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%';

const canDownloadLabel = (status = '') => ['CONFIRMED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED'].includes(status);

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildBarcodeSvg = (value = '') => {
  const encoded = `*${String(value || '').toUpperCase().replace(/[^0-9A-Z\-.\ $/+%]/g, '') || 'ORDER'}*`;
  let x = 0;
  const bars = [];

  Array.from(encoded).forEach((char, charIndex) => {
    const lookupIndex = Math.max(0, barcodeAlphabet.indexOf(char));
    const binary = lookupIndex.toString(2).padStart(6, '0');
    const pattern = `${binary}${binary.split('').reverse().join('')}`;

    Array.from(pattern).forEach((bit, bitIndex) => {
      const width = bit === '1' ? 3 : 1.4;
      if (bitIndex % 2 === 0) {
        bars.push(`<rect x="${x}" y="0" width="${width}" height="72" fill="#111827" />`);
      }
      x += width;
    });

    if (charIndex < encoded.length - 1) {
      x += 2;
    }
  });

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${x + 8}" height="110" viewBox="0 0 ${x + 8} 110" role="img" aria-label="Barcode">
      <rect width="100%" height="100%" fill="#ffffff" />
      <g transform="translate(4,10)">
        ${bars.join('')}
      </g>
      <text x="50%" y="102" text-anchor="middle" font-size="14" font-family="Arial, sans-serif" fill="#111827">${escapeHtml(value)}</text>
    </svg>
  `;
};

const openLabelWindow = (order) => {
  if (!order) return;

  const shipping = order.shippingAddress || {};
  const lineItems = (order.products || []).map((item) => ({
    keyId: item.productKeyId || item.product?._id || '-',
    productId: item.product?._id || item.product || '-',
    name: item.name || 'Product',
    qty: item.quantity || 1
  }));

  const labelRows = lineItems.map((item) => `
    <div class="label-item-row">
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <div>Key ID: ${escapeHtml(item.keyId)}</div>
        <div>Product ID: ${escapeHtml(String(item.productId).slice(-10))}</div>
      </div>
      <div>Qty: ${escapeHtml(item.qty)}</div>
    </div>
  `).join('');

  const barcodeValue = `ORD-${String(order._id).slice(-8)}`;
  const labelHtml = `
    <html>
      <head>
        <title>Order Label ${escapeHtml(barcodeValue)}</title>
        <style>
          body { margin: 0; font-family: Arial, sans-serif; background: #f3f4f6; }
          .sheet { width: 4in; min-height: 6in; margin: 16px auto; background: #fff; color: #111827; padding: 18px; box-sizing: border-box; border: 1px dashed #94a3b8; }
          .top { display: flex; justify-content: space-between; gap: 8px; font-size: 14px; font-weight: 700; }
          .to { margin-top: 14px; font-size: 14px; line-height: 1.5; }
          .meta { margin-top: 12px; font-size: 13px; display: grid; gap: 5px; }
          .label-item-row { display: flex; justify-content: space-between; gap: 10px; padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
          .barcode { margin-top: 14px; text-align: center; }
          .cut { margin-top: 16px; padding-top: 10px; text-align: center; font-size: 13px; border-top: 1px dashed #111827; }
          .actions { display: flex; justify-content: center; gap: 10px; padding: 16px; }
          .actions button { border: 0; border-radius: 999px; padding: 10px 16px; background: #111827; color: #fff; cursor: pointer; }
          @media print { .actions { display: none; } body { background: #fff; } .sheet { margin: 0 auto; border: 0; } }
        </style>
      </head>
      <body>
        <div class="actions">
          <button onclick="window.print()">Print / Save PDF</button>
        </div>
        <div class="sheet">
          <div class="top">
            <span>ORDER: #${escapeHtml(String(order._id).slice(-8))}</span>
            <span>${escapeHtml(formatStatus(order.orderStatus))}</span>
          </div>
          <div class="to">
            <strong>TO:</strong> ${escapeHtml(shipping.fullName || order.user?.name || '-')}<br/>
            ${escapeHtml(shipping.addressLine || '-')}<br/>
            ${escapeHtml(shipping.city || '-')}, ${escapeHtml(shipping.state || '-')} - ${escapeHtml(shipping.postalCode || '-')}<br/>
            Mobile: ${escapeHtml(shipping.mobile || order.user?.phone || '-')}
          </div>
          <div class="meta">
            <div>Payment: ${escapeHtml(order.paymentMethod || '-')} | ${escapeHtml(order.paymentStatus || '-')}</div>
            <div>Total Amount: Rs.${escapeHtml(Math.round(order.totalAmount || 0))}</div>
          </div>
          <div class="meta">${labelRows}</div>
          <div class="barcode">${buildBarcodeSvg(barcodeValue)}</div>
          <div class="cut">Cut here</div>
        </div>
      </body>
    </html>
  `;

  const labelWindow = window.open('', '_blank', 'width=500,height=800');
  if (!labelWindow) return;
  labelWindow.document.write(labelHtml);
  labelWindow.document.close();
};

function OrderTable({ title, description, orders, onStatusChange, emptyText, onOpenReturnChat, isReturnSection, onDownloadLabel }) {
  return (
    <div className="card">
      <div className="admin-page-header">
        <div>
          <h3>{title}</h3>
          <p className="admin-page-copy">{description}</p>
        </div>
        <span className="admin-status">{orders.length} Orders</span>
      </div>

      {orders.length === 0 ? (
        <p className="hint">{emptyText}</p>
      ) : (
        <div className="table-wrap">
          <table style={{ minWidth: 1040 }}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Delivery</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Address</th>
                <th>Move To</th>
                <th>Label</th>
                <th>Support</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td>{order._id.slice(-8)}</td>
                  <td>
                    <strong>{order.user?.name || '-'}</strong>
                    <div style={{ color: 'var(--muted)', fontSize: 12 }}>{order.user?.email || '-'}</div>
                  </td>
                  <td>{order.products?.length || 0}</td>
                  <td>Rs.{Math.round(order.deliveryCharge || 0)}</td>
                  <td>Rs.{Math.round(order.totalAmount || 0)}</td>
                  <td><span className="admin-status">{formatStatus(order.paymentStatus)}</span></td>
                  <td><span className="admin-status">{formatStatus(order.orderStatus)}</span></td>
                  <td>
                    {order.shippingAddress?.city || '-'}
                    {order.shippingAddress?.state ? `, ${order.shippingAddress.state}` : ''}
                  </td>
                  <td>
                    <select value={order.orderStatus} onChange={(e) => onStatusChange(order._id, e.target.value)}>
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {formatStatus(status)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {canDownloadLabel(order.orderStatus) ? (
                      <button type="button" onClick={() => onDownloadLabel(order)}>
                        Download Label
                      </button>
                    ) : (
                      <span style={{ color: 'var(--muted)', fontSize: 12 }}>After confirm</span>
                    )}
                  </td>
                  <td>
                    {order.returnMessages?.length > 0 || isReturnSection ? (
                      <div style={{ display: 'grid', gap: 8 }}>
                        <span className="admin-status">
                          {formatStatus(order.returnRequest?.type || 'OTHER')}
                        </span>
                        <button type="button" onClick={() => onOpenReturnChat(order._id)}>
                          Open Support
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--muted)', fontSize: 12 }}>No chat</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [activeReturnOrder, setActiveReturnOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('newOrders');
  const [replyText, setReplyText] = useState('');
  const [replyFiles, setReplyFiles] = useState([]);
  const [sendingReply, setSendingReply] = useState(false);
  const [processingWalletRefund, setProcessingWalletRefund] = useState(false);

  const load = async () => {
    try {
      setError('');
      const { data } = await api.get('/admin/orders');
      setOrders(data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Orders fetch failed');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id, orderStatus) => {
    try {
      setError('');
      await api.put(`/orders/${id}/status`, { orderStatus });
      await load();
      if (activeReturnOrder?._id === id) {
        const { data } = await api.get(`/orders/${id}/return-chat`);
        setActiveReturnOrder(data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Status update failed');
    }
  };

  const openReturnChat = async (orderId) => {
    try {
      setError('');
      const { data } = await api.get(`/orders/${orderId}/return-chat`);
      setActiveReturnOrder(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load return chat');
    }
  };

  const sendReply = async () => {
    if (!activeReturnOrder?._id) return;
    try {
      setSendingReply(true);
      setError('');
      const formData = new FormData();
      formData.append('text', replyText);
      replyFiles.forEach((file) => formData.append('media', file));
      const { data } = await api.post(`/orders/${activeReturnOrder._id}/return-chat/message`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setActiveReturnOrder(data);
      setReplyText('');
      setReplyFiles([]);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Reply send failed');
    } finally {
      setSendingReply(false);
    }
  };

  const refundToWallet = async () => {
    if (!activeReturnOrder?._id) return;
    try {
      setProcessingWalletRefund(true);
      setError('');
      const { data } = await api.post(`/orders/${activeReturnOrder._id}/refund-wallet`);
      setActiveReturnOrder(data.order);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Wallet refund failed');
    } finally {
      setProcessingWalletRefund(false);
    }
  };

  const groupedOrders = useMemo(() => {
    const groups = {
      newOrders: [],
      deliveryPipeline: [],
      deliveredOrders: [],
      returnOrders: [],
      cancelledOrders: []
    };

    orders.forEach((order) => {
      if (sectionConfig[0].statuses.includes(order.orderStatus)) groups.newOrders.push(order);
      else if (sectionConfig[1].statuses.includes(order.orderStatus)) groups.deliveryPipeline.push(order);
      else if (sectionConfig[2].statuses.includes(order.orderStatus)) groups.deliveredOrders.push(order);
      else if (sectionConfig[3].statuses.includes(order.orderStatus)) groups.returnOrders.push(order);
      else if (sectionConfig[4].statuses.includes(order.orderStatus)) groups.cancelledOrders.push(order);
    });

    return groups;
  }, [orders]);

  const supportInboxOrders = useMemo(
    () => orders.filter((order) => (order.returnMessages?.length || 0) > 0 || order.returnRequest?.status === 'REQUESTED' || order.returnRequest?.status === 'UNDER_REVIEW' || order.returnRequest?.status === 'RETURNED' || order.returnRequest?.status === 'REFUNDED_TO_WALLET'),
    [orders]
  );

  const activeSection = sectionConfig.find((section) => section.key === activeTab) || sectionConfig[0];

  return (
    <div className="admin-panel-grid">
      <div className="card admin-highlight">
        <div className="admin-page-header">
          <div>
            <h2>Order Operations</h2>
            <p className="admin-page-copy">
              Orders aur support inbox ab alag rakhe gaye hain, taki customer messages mix hokar miss na ho.
            </p>
          </div>
        </div>
        <div className="chip-row">
          <span className="chip">New: {groupedOrders.newOrders.length}</span>
          <span className="chip">Pipeline: {groupedOrders.deliveryPipeline.length}</span>
          <span className="chip">Delivered: {groupedOrders.deliveredOrders.length}</span>
          <span className="chip">Returns: {groupedOrders.returnOrders.length}</span>
          <span className="chip">Cancelled: {groupedOrders.cancelledOrders.length}</span>
          <span className="chip">Support Inbox: {supportInboxOrders.length}</span>
        </div>
      </div>

      {error && <p className="danger">{error}</p>}

      <div className="card">
        <div className="admin-page-header">
          <div>
            <h3>Order Buckets</h3>
            <p className="admin-page-copy">New, delivery, delivered aur cancelled orders ko tab-wise dekho.</p>
          </div>
          <div className="admin-tab-row">
            {adminTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`admin-tab-button ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <OrderTable
          title={activeSection.title}
          description={activeSection.description}
          orders={groupedOrders[activeSection.key]}
          onStatusChange={updateStatus}
          onOpenReturnChat={openReturnChat}
          onDownloadLabel={openLabelWindow}
          isReturnSection={activeSection.key === 'returnOrders'}
          emptyText={`Abhi ${activeSection.title.toLowerCase()} me koi order nahi hai.`}
        />
      </div>

      <div className="admin-support-layout">
        <div className="card admin-support-list">
          <div className="admin-page-header">
            <div>
              <h3>Support Inbox</h3>
              <p className="admin-page-copy">Yahan sirf wahi orders aayenge jahan customer ne message ya return/support request bheji ho.</p>
            </div>
            <span className="admin-status">{supportInboxOrders.length} Threads</span>
          </div>

          <div className="admin-support-stack">
            {supportInboxOrders.length === 0 && (
              <p className="hint">Abhi support inbox me koi customer thread nahi hai.</p>
            )}
            {supportInboxOrders.map((order) => (
              <button
                key={order._id}
                type="button"
                className={`admin-support-item ${activeReturnOrder?._id === order._id ? 'active' : ''}`}
                onClick={() => openReturnChat(order._id)}
              >
                <div className="admin-support-item-top">
                  <strong>Order #{order._id.slice(-8)}</strong>
                  <span className="admin-status">{formatStatus(order.orderStatus)}</span>
                </div>
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                  {order.user?.name || 'Customer'} | {formatStatus(order.returnRequest?.type || 'OTHER')}
                </div>
                <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                  Messages: {order.returnMessages?.length || 0}
                  {order.supportExpired ? ' | 3-day window closed' : ' | Support open'}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="admin-page-header">
            <div>
              <h3>Support Conversation</h3>
              <p className="admin-page-copy">
                {activeReturnOrder
                  ? `Order #${activeReturnOrder._id.slice(-8)} | Customer: ${activeReturnOrder.user?.name || '-'} | Type: ${formatStatus(activeReturnOrder.returnRequest?.type || 'OTHER')}`
                  : 'Inbox me kisi support thread par click karo.'}
              </p>
            </div>
            {activeReturnOrder && (
              <span className="admin-status">
                {formatStatus(activeReturnOrder.returnRequest?.status || 'REQUESTED')}
              </span>
            )}
          </div>

          {!activeReturnOrder ? (
            <div className="admin-empty-state">
              <p className="hint">Customer ka message select karoge to yahin full chat, proof files aur refund action dikhenge.</p>
            </div>
          ) : (
          <div className="grid admin-support-chat-grid">
            <div className="card" style={{ padding: 16 }}>
              <h3 style={{ marginBottom: 12 }}>Order Items</h3>
              <div className="grid">
                {(activeReturnOrder.products || []).map((item, index) => (
                  <div key={`${item.product}-${index}`} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <img
                      src={buildMediaUrl(item.image || item.product?.thumbnail || '')}
                      alt={item.name}
                      style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border)' }}
                    />
                    <div>
                      <strong>{item.name}</strong>
                      <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                        Qty: {item.quantity} {item.size ? `| Size: ${item.size}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, fontSize: 14, color: 'var(--muted)' }}>
                Customer reason: {activeReturnOrder.returnRequest?.reason || 'No reason added'}
              </div>
              <div style={{ marginTop: 10, fontSize: 13, color: 'var(--muted)' }}>
                Support Window: {activeReturnOrder.supportExpired ? 'Closed after 3 days' : 'Open for 3 days from delivery'}
              </div>
              <div style={{ marginTop: 14, display: 'grid', gap: 6, fontSize: 13 }}>
                <strong>Customer Details</strong>
                <span>Name: {activeReturnOrder.user?.name || '-'}</span>
                <span>Email: {activeReturnOrder.user?.email || '-'}</span>
                <span>Phone: {activeReturnOrder.user?.phone || '-'}</span>
                <span>UPI: {activeReturnOrder.user?.refundDetails?.upiId || '-'}</span>
                <span>Account: {activeReturnOrder.user?.refundDetails?.accountNumber || '-'}</span>
                <span>IFSC: {activeReturnOrder.user?.refundDetails?.ifscCode || '-'}</span>
                <span>Wallet Balance: Rs.{Math.round(activeReturnOrder.user?.wallet?.balance || 0)}</span>
              </div>
              <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
                <button
                  type="button"
                  onClick={refundToWallet}
                  disabled={processingWalletRefund || activeReturnOrder.returnRequest?.status === 'REFUNDED_TO_WALLET'}
                >
                  {processingWalletRefund
                    ? 'Processing Wallet Refund...'
                    : activeReturnOrder.returnRequest?.status === 'REFUNDED_TO_WALLET'
                      ? 'Refunded To Wallet'
                      : 'Refund To Shopva Wallet'}
                </button>
                <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                  Agar customer ne bank details nahi di hain, to refund Shopva wallet me bhej do. Wallet credit 4 months me expire ho jayega.
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid" style={{ gap: 12 }}>
                {(activeReturnOrder.returnMessages || []).map((message) => (
                  <div key={message._id} className="card" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <strong>{message.sender?.role === 'admin' ? 'Admin' : message.sender?.name || 'Customer'}</strong>
                      <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                        {new Date(message.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {message.text && <p style={{ marginBottom: 0 }}>{message.text}</p>}
                    {!!message.attachments?.length && (
                      <div className="grid" style={{ marginTop: 12, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                        {message.attachments.map((attachment) => {
                          const mediaUrl = buildMediaUrl(attachment);
                          return isVideoFile(attachment) ? (
                            <video key={attachment} src={mediaUrl} controls style={{ width: '100%', borderRadius: 12, border: '1px solid var(--border)' }} />
                          ) : (
                            <img key={attachment} src={mediaUrl} alt="Return proof" style={{ width: '100%', borderRadius: 12, border: '1px solid var(--border)' }} />
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="card" style={{ padding: 16 }}>
                <h3 style={{ marginBottom: 12 }}>Reply To Customer</h3>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                  placeholder="Customer se product verification ya return proof ke baare me poochho"
                />
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={(e) => setReplyFiles(Array.from(e.target.files || []))}
                  style={{ marginTop: 10 }}
                />
                <button type="button" onClick={sendReply} disabled={sendingReply} style={{ marginTop: 12 }}>
                  {sendingReply ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
