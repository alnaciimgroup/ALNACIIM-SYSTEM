'use client';

import { useState } from 'react';
import { useApi } from '@/components/erp/useApi';
import Table from '@/components/erp/Table';
import client from '@/components/erp/client';
import { useAuth } from '@/components/erp/AuthContext';

const EMPTY_FORM = { name: '', customer_type: 'retail', phone: '', address: '', tank_number: '' };
const STATUS_BADGE = { active: 'ok', inactive: 'low', suspended: 'pending', closed: 'low' };

function StatementModal({ customerId, onClose }) {
  const { user } = useAuth();
  const canReverse = ['Admin', 'Sales Manager', 'Finance Officer'].includes(user?.role);
  const { rows, reload } = useApi(`/customers/${customerId}/statement`);
  if (!rows) return <div className="card"><p className="muted">Loading statement…</p></div>;

  async function reversePayment(r) {
    const reason = window.prompt(`Reverse payment ${r.reference}? This reinstates the receivable. Reason (optional):`);
    if (reason === null) return;
    try {
      await client.post(`/sales/orders/${r.sales_order_id}/payments/${r.payment_id}/reverse`, { reason: reason || undefined });
      reload();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reverse payment');
    }
  }

  return (
    <div className="card">
      <div className="toolbar" style={{ justifyContent: 'space-between' }}>
        <strong>Account Statement — {rows.customer.name} {rows.customer.hno ? `(${rows.customer.hno})` : ''}</strong>
        <button className="btn secondary" onClick={onClose}>Close</button>
      </div>
      <Table
        columns={[
          { key: 'entry_date', header: 'Date', render: (r) => String(r.entry_date).slice(0, 10) },
          { key: 'entry_type', header: 'Type', render: (r) => <span className={`badge badge--${r.entry_type === 'invoice' ? 'pending' : 'ok'}`}>{r.entry_type}</span> },
          { key: 'reference', header: 'Reference' },
          { key: 'amount', header: 'Amount', render: (r) => `${Number(r.amount) < 0 ? '-' : ''}$${Math.abs(Number(r.amount)).toFixed(2)}` },
          { key: 'running_balance', header: 'Running Balance', render: (r) => `$${Number(r.running_balance).toFixed(2)}` },
          canReverse && { key: 'actions', header: '', render: (r) => r.entry_type === 'payment' && <button className="btn secondary" onClick={() => reversePayment(r)}>Reverse</button> }
        ].filter(Boolean)}
        rows={rows.statement}
        emptyText="No invoices or payments recorded for this customer yet."
      />
      <p style={{ marginTop: 12, fontWeight: 600 }}>Closing Balance: ${Number(rows.closing_balance).toFixed(2)}</p>
    </div>
  );
}

function ActivityModal({ customerId, onClose }) {
  const { rows } = useApi(`/customers/${customerId}/activity`);
  if (!rows) return <div className="card"><p className="muted">Loading activity…</p></div>;

  const EVENT_BADGE = { order_created: 'pending', delivery: 'info', payment: 'ok' };

  return (
    <div className="card">
      <div className="toolbar" style={{ justifyContent: 'space-between' }}>
        <strong>Activity History — {rows.customer.name}</strong>
        <button className="btn secondary" onClick={onClose}>Close</button>
      </div>
      <Table
        columns={[
          { key: 'event_date', header: 'Date', render: (r) => r.event_date ? new Date(r.event_date).toLocaleString() : '—' },
          { key: 'event_type', header: 'Event', render: (r) => <span className={`badge badge--${EVENT_BADGE[r.event_type] || 'info'}`}>{r.event_type.replace('_', ' ')}</span> },
          { key: 'reference', header: 'Reference' },
          { key: 'details', header: 'Details' }
        ]}
        rows={rows.activity}
        emptyText="No activity recorded for this customer yet."
      />
    </div>
  );
}

export default function CustomersTab() {
  const { user } = useAuth();
  const canEdit = ['Admin', 'Sales Manager'].includes(user?.role);
  const { rows, reload } = useApi('/customers');
  const { rows: qaades } = useApi('/qaades');
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [statementCustomerId, setStatementCustomerId] = useState(null);
  const [activityCustomerId, setActivityCustomerId] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      await client.post('/customers', { ...form, qaade_id: form.qaade_id ? Number(form.qaade_id) : undefined });
      setForm(EMPTY_FORM);
      setShowForm(false);
      reload();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create customer');
    }
  }

  async function updateStatus(id, status) {
    await client.put(`/customers/${id}`, { status });
    reload();
  }

  return (
    <div>
      <div className="toolbar">
        {canEdit && <button className="btn" onClick={() => setShowForm((s) => !s)}>{showForm ? 'Cancel' : '+ New Customer'}</button>}
      </div>

      {showForm && (
        <form className="stacked-form card" onSubmit={handleSubmit}>
          {error && <div className="error-box" style={{ gridColumn: '1/-1' }}>{error}</div>}
          <label>Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label>Type
            <select value={form.customer_type} onChange={(e) => setForm({ ...form, customer_type: e.target.value })}>
              <option value="regular">Regular</option>
              <option value="irregular">Irregular</option>
            </select>
          </label>
          <label>Phone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          <label>Address<input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
          <label>Tank Number<input value={form.tank_number} onChange={(e) => setForm({ ...form, tank_number: e.target.value })} /></label>
          <div><button className="btn" type="submit">Save</button></div>
        </form>
      )}

      <div className="card table-wrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Type</th><th>Phone</th><th>Address</th><th>Tank #</th><th>Debt</th><th>Status</th><th style={{ minWidth: 180 }}>Actions</th></tr>
          </thead>
          <tbody>
            {rows?.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.customer_type}</td>
                <td>{c.phone || '—'}</td>
                <td>{c.address || '—'}</td>
                <td>{c.tank_number || '—'}</td>
                <td>${Number(c.debt || 0).toFixed(2)}</td>
                <td>
                  {canEdit ? (
                    <select value={c.status} onChange={(e) => updateStatus(c.id, e.target.value)} style={{ padding: '2px 6px' }}>
                      <option value="active">active</option>
                      <option value="inactive">inactive</option>
                      <option value="suspended">suspended</option>
                      <option value="closed">closed</option>
                    </select>
                  ) : (
                    <span className={`badge badge--${STATUS_BADGE[c.status]}`}>{c.status}</span>
                  )}
                </td>
                <td style={{ display: 'flex', gap: 6 }}>
                  <button className="btn secondary" onClick={() => setStatementCustomerId(c.id)}>Statement</button>
                  <button className="btn secondary" onClick={() => setActivityCustomerId(c.id)}>Activity</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows?.length && <p className="muted">No customers yet.</p>}
      </div>

      {statementCustomerId && <StatementModal customerId={statementCustomerId} onClose={() => setStatementCustomerId(null)} />}
      {activityCustomerId && <ActivityModal customerId={activityCustomerId} onClose={() => setActivityCustomerId(null)} />}
    </div>
  );
}
