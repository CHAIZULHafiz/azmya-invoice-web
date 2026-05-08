import { Check, Clock, Send, AlertTriangle } from 'lucide-react';

export default function StatusBadge({ status, isOverdue, overdueDays, daysLeft }) {
  if (isOverdue && status !== 'LUNAS') {
    return (
      <span className="badge badge-overdue">
        <AlertTriangle size={12} />
        OVERDUE {overdueDays ? `(${overdueDays} hr)` : ''}
      </span>
    );
  }

  const config = {
    PENDING: { className: 'badge-pending', icon: Clock, label: 'PENDING' },
    'MENUNGGU PO': { className: 'badge-pending', icon: Clock, label: 'MENUNGGU PO' },
    DIKIRIM: { className: 'badge-dikirim', icon: Send, label: 'DIKIRIM' },
    LUNAS: { className: 'badge-lunas', icon: Check, label: 'LUNAS' },
  };

  const c = config[status] || config.PENDING;

  // Show days left for DIKIRIM status
  let label = c.label;
  if (status === 'DIKIRIM' && !isOverdue && daysLeft !== undefined && daysLeft !== null) {
    label = `DIKIRIM (${daysLeft} hr)`;
  }

  return (
    <span className={`badge ${c.className}`}>
      <c.icon size={12} />
      {label}
    </span>
  );
}
