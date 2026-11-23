import PDFDocument from 'pdfkit';
import prisma from '../lib/prisma.js';
import { createXlsx } from '../utils/xlsx.js';

const TIME_ZONE = 'Asia/Kolkata';
const dateTime = (value) => value ? new Intl.DateTimeFormat('en-IN', {
  timeZone: TIME_ZONE, dateStyle: 'medium', timeStyle: 'medium', hour12: true,
}).format(new Date(value)) : '';
const dateOnly = (value) => new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(value);
const rupees = (paise) => (Number(paise || 0) / 100).toFixed(2);
const displayName = (user) => user?.fullName || '';

const reports = {
  requests: {
    title: 'Requests', description: 'All service requests, customer details, statuses, fees, and timestamps.',
    columns: ['Tracking number', 'Customer name', 'Customer email', 'Customer mobile', 'Service', 'Status', 'Fee (INR)', 'Payment status', 'Submitted at (IST)', 'Last updated at (IST)'],
    async rows() {
      const items = await prisma.request.findMany({
        select: {
          trackingNumber: true, status: true, amountPaise: true, createdAt: true, updatedAt: true, paidAt: true,
          user: { select: { fullName: true, email: true, phone: true } },
          service: { select: { name: true } }, payment: { select: { status: true } },
        }, orderBy: { createdAt: 'desc' },
      });
      return items.map((item) => ({
        'Tracking number': item.trackingNumber, 'Customer name': displayName(item.user), 'Customer email': item.user.email,
        'Customer mobile': item.user.phone || '', Service: item.service.name, Status: item.status,
        'Fee (INR)': Number(rupees(item.amountPaise)), 'Payment status': item.payment?.status || 'NOT CREATED',
        'Submitted at (IST)': dateTime(item.createdAt), 'Last updated at (IST)': dateTime(item.updatedAt),
      }));
    },
  },
  users: {
    title: 'Users', description: 'Customer and staff accounts with contact and account timestamps; credentials are excluded.',
    columns: ['User ID', 'Name', 'Email', 'Mobile', 'Role', 'Email verified at (IST)', 'Account created at (IST)', 'Last updated at (IST)'],
    async rows() {
      const items = await prisma.user.findMany({
        select: { id: true, fullName: true, email: true, phone: true, role: true, emailVerifiedAt: true, createdAt: true, updatedAt: true },
        orderBy: { createdAt: 'desc' },
      });
      return items.map((item) => ({
        'User ID': item.id, Name: displayName(item), Email: item.email, Mobile: item.phone || '', Role: item.role,
        'Email verified at (IST)': dateTime(item.emailVerifiedAt), 'Account created at (IST)': dateTime(item.createdAt),
        'Last updated at (IST)': dateTime(item.updatedAt),
      }));
    },
  },
  payments: {
    title: 'Payments', description: 'Payment records linked to requests and customers, including payment time.',
    columns: ['Receipt number', 'Tracking number', 'Customer name', 'Customer email', 'Service', 'Amount (INR)', 'Currency', 'Method', 'Status', 'Paid at (IST)', 'Payment created at (IST)'],
    async rows() {
      const items = await prisma.payment.findMany({
        select: {
          receiptNumber: true, amountPaise: true, currency: true, method: true, status: true, createdAt: true,
          request: { select: { trackingNumber: true, paidAt: true, user: { select: { fullName: true, email: true } }, service: { select: { name: true } } } },
        }, orderBy: { createdAt: 'desc' },
      });
      return items.map((item) => ({
        'Receipt number': item.receiptNumber || '', 'Tracking number': item.request.trackingNumber,
        'Customer name': displayName(item.request.user), 'Customer email': item.request.user.email,
        Service: item.request.service.name, 'Amount (INR)': Number(rupees(item.amountPaise)), Currency: item.currency,
        Method: item.method, Status: item.status, 'Paid at (IST)': dateTime(item.request.paidAt),
        'Payment created at (IST)': dateTime(item.createdAt),
      }));
    },
  },
  appointments: {
    title: 'Appointments', description: 'Bookings with customer, service, appointment slot, status, and creation time.',
    columns: ['Customer name', 'Customer email', 'Mobile', 'Service', 'Appointment date', 'Time slot', 'Status', 'Booked at (IST)', 'Last updated at (IST)'],
    async rows() {
      const items = await prisma.appointment.findMany({
        select: {
          date: true, slot: true, status: true, createdAt: true, updatedAt: true,
          user: { select: { fullName: true, email: true, phone: true } }, service: { select: { name: true } },
        }, orderBy: [{ date: 'desc' }, { slot: 'desc' }],
      });
      return items.map((item) => ({
        'Customer name': displayName(item.user), 'Customer email': item.user.email, Mobile: item.user.phone || '',
        Service: item.service.name, 'Appointment date': item.date, 'Time slot': item.slot, Status: item.status,
        'Booked at (IST)': dateTime(item.createdAt), 'Last updated at (IST)': dateTime(item.updatedAt),
      }));
    },
  },
  services: {
    title: 'Services', description: 'Service catalogue, pricing, availability, and setup timestamps.',
    columns: ['Service ID', 'Name', 'Slug', 'Category', 'Description', 'Fee (INR)', 'Required documents', 'Active', 'Created at (IST)', 'Last updated at (IST)'],
    async rows() {
      const items = await prisma.service.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] });
      return items.map((item) => ({
        'Service ID': item.id, Name: item.name, Slug: item.slug, Category: item.category, Description: item.description,
        'Fee (INR)': Number(rupees(item.feePaise)), 'Required documents': JSON.parse(item.requiredDocuments || '[]').join(', '),
        Active: item.active ? 'Yes' : 'No', 'Created at (IST)': dateTime(item.createdAt), 'Last updated at (IST)': dateTime(item.updatedAt),
      }));
    },
  },
  documents: {
    title: 'Uploaded Documents', description: 'Uploaded file metadata and owning request; file contents and storage paths are excluded.',
    columns: ['Customer name', 'Customer email', 'Tracking number', 'Service', 'Document name', 'Document type', 'MIME type', 'Size (bytes)', 'Uploaded at (IST)'],
    async rows() {
      const items = await prisma.document.findMany({
        select: {
          originalName: true, kind: true, mimeType: true, size: true, uploadedAt: true,
          request: { select: { trackingNumber: true, user: { select: { fullName: true, email: true } }, service: { select: { name: true } } } },
        }, orderBy: { uploadedAt: 'desc' },
      });
      return items.map((item) => ({
        'Customer name': displayName(item.request.user), 'Customer email': item.request.user.email,
        'Tracking number': item.request.trackingNumber, Service: item.request.service.name,
        'Document name': item.originalName, 'Document type': item.kind || '', 'MIME type': item.mimeType,
        'Size (bytes)': Number(item.size), 'Uploaded at (IST)': dateTime(item.uploadedAt),
      }));
    },
  },
  audit: {
    title: 'Audit Activity', description: 'Recorded administrative activity with actor and event timestamps.',
    columns: ['Action', 'Actor name', 'Actor email', 'Actor role', 'Target type', 'Target ID', 'Details', 'Event time (IST)'],
    async rows() {
      const items = await prisma.auditLog.findMany({ include: { actor: { select: { fullName: true, email: true } } }, orderBy: { createdAt: 'desc' } });
      return items.map((item) => ({
        Action: item.action, 'Actor name': displayName(item.actor), 'Actor email': item.actor?.email || '',
        'Actor role': item.actorRole || '', 'Target type': item.targetType || '', 'Target ID': item.targetId || '',
        Details: item.metadata || '', 'Event time (IST)': dateTime(item.createdAt),
      }));
    },
  },
  daily: {
    title: 'Daily Summary', description: 'Daily request, user, appointment, and paid-revenue totals by India calendar date.',
    columns: ['Date (IST)', 'Requests submitted', 'Requests completed', 'New accounts', 'Appointments booked', 'Payments recorded', 'Revenue (INR)'],
    async rows() {
      const [requests, users, appointments, payments] = await Promise.all([
        prisma.request.findMany({ select: { createdAt: true, status: true } }),
        prisma.user.findMany({ select: { createdAt: true } }),
        prisma.appointment.findMany({ select: { createdAt: true } }),
        prisma.payment.findMany({ where: { status: 'PAID' }, select: { createdAt: true, amountPaise: true } }),
      ]);
      const byDay = new Map();
      const ensure = (date) => {
        const key = dateOnly(date);
        if (!byDay.has(key)) byDay.set(key, { 'Date (IST)': key, 'Requests submitted': 0, 'Requests completed': 0, 'New accounts': 0, 'Appointments booked': 0, 'Payments recorded': 0, 'Revenue (INR)': 0 });
        return byDay.get(key);
      };
      for (const item of requests) { const row = ensure(item.createdAt); row['Requests submitted'] += 1; if (item.status === 'COMPLETED') row['Requests completed'] += 1; }
      for (const item of users) ensure(item.createdAt)['New accounts'] += 1;
      for (const item of appointments) ensure(item.createdAt)['Appointments booked'] += 1;
      for (const item of payments) { const row = ensure(item.createdAt); row['Payments recorded'] += 1; row['Revenue (INR)'] += Number(rupees(item.amountPaise)); }
      return [...byDay.values()].sort((left, right) => right['Date (IST)'].localeCompare(left['Date (IST)'])).map((row) => ({ ...row, 'Revenue (INR)': Number(row['Revenue (INR)'].toFixed(2)) }));
    },
  },
};

export function listAdminReports() {
  return Object.entries(reports).map(([id, report]) => ({ id, title: report.title, description: report.description }));
}

export async function buildAdminReport(id) {
  const report = reports[id];
  if (!report) return null;
  const [rows, generatedAt] = await Promise.all([report.rows(), Promise.resolve(dateTime(new Date()))]);
  return { id, title: report.title, description: report.description, columns: report.columns, rows, generatedAt };
}

export function buildAdminXlsx(report) {
  return createXlsx(report);
}

export async function buildAdminPdf(report) {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margins: { top: 38, bottom: 38, left: 36, right: 36 }, bufferPages: true });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  const complete = new Promise((resolve, reject) => { doc.on('end', () => resolve(Buffer.concat(chunks))); doc.on('error', reject); });

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const pageBottom = doc.page.height - doc.page.margins.bottom - 18;
  const drawHeading = () => {
    doc.font('Helvetica-Bold').fontSize(18).fillColor('#0f172a').text(`SevaSaathi · ${report.title}`, { width: pageWidth });
    doc.moveDown(0.35).font('Helvetica').fontSize(9).fillColor('#475569').text(report.description, { width: pageWidth });
    doc.moveDown(0.25).fontSize(8).text(`Generated at ${report.generatedAt} (Asia/Kolkata) · ${report.rows.length} records`, { width: pageWidth });
    doc.moveDown(0.7).strokeColor('#cbd5e1').moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.margins.left + pageWidth, doc.y).stroke();
    doc.moveDown(0.6);
  };

  drawHeading();
  if (!report.rows.length) {
    doc.fontSize(10).fillColor('#64748b').text('No records found for this report.');
  } else {
    report.rows.forEach((row, index) => {
      const horizontalPadding = 12;
      const columnGap = 20;
      const cellWidth = (pageWidth - horizontalPadding * 2 - columnGap) / 2;
      const fields = report.columns.map((label) => ({ label, value: String(row[label] ?? 'Not set') }));
      const fieldRows = [];
      for (let fieldIndex = 0; fieldIndex < fields.length; fieldIndex += 2) {
        const pair = fields.slice(fieldIndex, fieldIndex + 2);
        const valueHeights = pair.map(({ value }) => doc.font('Helvetica').fontSize(9).heightOfString(value, { width: cellWidth, lineGap: 1 }));
        fieldRows.push({ fields: pair, height: Math.max(18, ...valueHeights) + 13 });
      }
      const cardHeight = fieldRows.reduce((total, fieldRow) => total + fieldRow.height, 0) + 12;
      const recordHeaderHeight = 16;
      if (doc.y + recordHeaderHeight + cardHeight + 10 > pageBottom) {
        doc.addPage();
        drawHeading();
      }
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#4f46e5')
        .text(`RECORD ${String(index + 1).padStart(3, '0')}`, doc.page.margins.left, doc.y + 2);
      const cardTop = doc.y + 7;
      doc.roundedRect(doc.page.margins.left, cardTop, pageWidth, cardHeight, 7)
        .fillAndStroke('#f8fafc', '#e2e8f0');

      let y = cardTop + 8;
      for (const fieldRow of fieldRows) {
        fieldRow.fields.forEach(({ label, value }, cellIndex) => {
          const x = doc.page.margins.left + horizontalPadding + cellIndex * (cellWidth + columnGap);
          doc.font('Helvetica-Bold').fontSize(7).fillColor('#64748b')
            .text(label.toUpperCase(), x, y, { width: cellWidth, lineBreak: false, ellipsis: true });
          doc.font('Helvetica').fontSize(9).fillColor('#0f172a')
            .text(value, x, y + 10, { width: cellWidth, lineGap: 1 });
        });
        y += fieldRow.height;
      }
      doc.y = cardTop + cardHeight + 9;
    });
  }

  const range = doc.bufferedPageRange();
  for (let pageIndex = range.start; pageIndex < range.start + range.count; pageIndex += 1) {
    doc.switchToPage(pageIndex);
    doc.font('Helvetica').fontSize(7).fillColor('#64748b')
      .text(`SevaSaathi - Admin export - ${pageIndex + 1} / ${range.count}`, doc.page.margins.left, doc.page.height - doc.page.margins.bottom - 12, { width: pageWidth, align: 'right' });
  }
  doc.end();
  return complete;
}

export function exportTimestamp(date = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(date).map(({ type, value }) => [type, value]));
  return `${parts.year}${parts.month}${parts.day}-${parts.hour}${parts.minute}${parts.second}-IST`;
}
