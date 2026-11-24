import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

const prisma = new PrismaClient();

// ₹ helper: 500 -> 50000 paise
const rupees = (r) => Math.round(r * 100);
const hashPw = async (pw) => bcrypt.hash(pw, 12);

const SERVICES = [
  {
    slug: 'aadhaar-address-update', name: 'Aadhaar – Address Update', category: 'Aadhaar',
    description: 'Update residential address on your Aadhaar card with valid proof.', feePaise: rupees(50),
    requiredDocuments: ['Address Proof', 'Aadhaar Copy'],
    formSchema: { fields: [
      { name: 'aadhaar', label: 'Aadhaar Number', type: 'aadhaar', required: true },
      { name: 'fullName', label: 'Full Name', type: 'string', required: true, min: 2, max: 100 },
      { name: 'newAddress', label: 'New Address', type: 'string', required: true, min: 10, max: 500 },
      { name: 'phone', label: 'Mobile', type: 'phone', required: true }
    ] }
  },
  {
    slug: 'pan-new', name: 'PAN – New Application', category: 'PAN',
    description: 'Apply for a new PAN card for Indian citizens.', feePaise: rupees(107),
    requiredDocuments: ['Aadhaar Copy', 'Photo', 'Signature'],
    formSchema: { fields: [
      { name: 'fullName', label: 'Full Name', type: 'string', required: true, min: 2, max: 100 },
      { name: 'dob', label: 'Date of Birth', type: 'date', required: true },
      { name: 'gender', label: 'Gender', type: 'enum', options: ['male', 'female', 'other'], required: true },
      { name: 'aadhaar', label: 'Aadhaar Number', type: 'aadhaar', required: true },
      { name: 'phone', label: 'Mobile', type: 'phone', required: true }
    ] }
  },
  {
    slug: 'birth-certificate', name: 'Birth Certificate', category: 'Certificates',
    description: 'Register a birth and obtain a birth certificate.', feePaise: rupees(100),
    requiredDocuments: ['Hospital Record', 'Parents Aadhaar Copy'],
    formSchema: { fields: [
      { name: 'childName', label: "Child's Name", type: 'string', required: true, min: 2, max: 100 },
      { name: 'dob', label: 'Date of Birth', type: 'date', required: true },
      { name: 'hospital', label: 'Hospital', type: 'string', required: true, min: 2, max: 200 }
    ] }
  },
  {
    slug: 'electricity-bill-payment', name: 'Electricity Bill Payment', category: 'Bill Payments',
    description: 'Pay electricity bills for any DISCOM (instant).', feePaise: rupees(5),
    requiredDocuments: [],
    formSchema: { fields: [
      { name: 'consumerNumber', label: 'Consumer Number', type: 'string', required: true, min: 4, max: 30 },
      { name: 'provider', label: 'Provider', type: 'string', required: true, min: 2, max: 80 },
      { name: 'amount', label: 'Amount (INR)', type: 'number', required: true }
    ] }
  }
];

async function main() {
  console.log('Seeding services...');
  for (const s of SERVICES) {
    await prisma.service.upsert({
      where: { slug: s.slug },
      update: {},
      create: {
        ...s,
        requiredDocuments: JSON.stringify(s.requiredDocuments),
        formSchema: JSON.stringify(s.formSchema),
      },
    });
  }

  if (process.env.SEED_SERVICES_ONLY === 'true') {
    console.log('Service catalogue seeded; development accounts and sample requests skipped.');
    return;
  }

  console.log('Seeding users...');
  const passwordHash = await hashPw('password123');
  const users = [
    { email: 'admin@sevasaathi.test', legacyEmail: 'admin@aryaseva.com', role: 'ADMIN', fullName: 'Super Admin' },
    { email: 'staff@sevasaathi.test', legacyEmail: 'staff@aryaseva.com', role: 'STAFF', fullName: 'Desk Agent' },
    { email: 'customer@sevasaathi.test', legacyEmail: 'customer@aryaseva.com', role: 'CUSTOMER', fullName: 'Rahul Sharma' }
  ];

  for (const u of users) {
    const existingNewAccount = await prisma.user.findUnique({ where: { email: u.email } });
    const legacyAccount = existingNewAccount ? null : await prisma.user.findUnique({ where: { email: u.legacyEmail } });
    if (legacyAccount) await prisma.user.update({ where: { id: legacyAccount.id }, data: { email: u.email } });
    const { legacyEmail, ...userData } = u;
    await prisma.user.upsert({
      where: { email: userData.email },
      update: { passwordHash, emailVerifiedAt: new Date(), active: true },
      create: { ...userData, passwordHash, emailVerifiedAt: new Date() },
    });
  }

  console.log('Seeding fake requests & payments...');
  const dbServices = await prisma.service.findMany();
  const customer = await prisma.user.findUnique({ where: { email: 'customer@sevasaathi.test' } });
  const staff = await prisma.user.findUnique({ where: { email: 'staff@sevasaathi.test' } });
  const statuses = ['PENDING', 'IN_PROGRESS', 'DOCUMENTS_PENDING', 'PROCESSING', 'READY_FOR_PICKUP', 'COMPLETED', 'REJECTED'];
  const demoRequests = await prisma.request.findMany({
    where: { formData: { contains: 'Generated fake data' } },
    include: { payment: true },
  });
  const requestYear = (date) => date.getFullYear();
  const year = new Date().getFullYear();
  const occupiedNumbers = new Set((await prisma.request.findMany({
    where: { trackingNumber: { startsWith: `AS-${year}-` } },
    select: { trackingNumber: true },
  })).filter((r) => !demoRequests.some((demo) => demo.trackingNumber === r.trackingNumber)).map((r) => r.trackingNumber));
  let maxSequence = Math.max(100000, ...(await prisma.request.findMany({ select: { trackingNumber: true } }))
    .map((r) => Number(r.trackingNumber.match(/^AS-\d{4}-(\d+)$/)?.[1] || 0)));

  if (demoRequests.length) {
    for (const demo of demoRequests) {
      const recordYear = requestYear(demo.createdAt);
      let sequence = Number(demo.trackingNumber.match(/(\d+)$/)?.[1] || ++maxSequence);
      let trackingNumber = `AS-${recordYear}-${String(sequence).padStart(6, '0')}`;
      while (occupiedNumbers.has(trackingNumber)) {
        sequence = ++maxSequence;
        trackingNumber = `AS-${recordYear}-${String(sequence).padStart(6, '0')}`;
      }
      occupiedNumbers.add(trackingNumber);
      maxSequence = Math.max(maxSequence, sequence);
      if (trackingNumber !== demo.trackingNumber) {
        await prisma.request.update({ where: { id: demo.id }, data: { trackingNumber } });
      }
      if (demo.payment?.receiptNumber) {
        const receiptSequence = demo.payment.receiptNumber.match(/(\d+)$/)?.[1];
        if (receiptSequence) {
          await prisma.payment.update({
            where: { id: demo.payment.id },
            data: { receiptNumber: `RC-${recordYear}-${receiptSequence}` },
          });
        }
      }
    }
  } else {
    for (let i = 1; i <= 20; i++) {
      const svc = dbServices[Math.floor(Math.random() * dbServices.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      let sequence = ++maxSequence;
      let trackingNumber = `AS-${year}-${String(sequence).padStart(6, '0')}`;
      while (occupiedNumbers.has(trackingNumber)) {
        sequence = ++maxSequence;
        trackingNumber = `AS-${year}-${String(sequence).padStart(6, '0')}`;
      }
      occupiedNumbers.add(trackingNumber);
      const isPaid = Math.random() > 0.5;
      const req = await prisma.request.create({
        data: {
          trackingNumber, userId: customer.id, serviceId: svc.id, status,
          statusReason: status === 'DOCUMENTS_PENDING' ? 'Address proof is blurry. Please upload a clear copy.' : null,
          formData: JSON.stringify({ note: 'Generated fake data' }), amountPaise: svc.feePaise,
          consentAt: new Date(), consentVersion: 'v1', paidAt: isPaid ? new Date() : null,
        },
      });
      if (isPaid) await prisma.payment.create({
        data: {
          requestId: req.id, amountPaise: svc.feePaise,
          method: Math.random() > 0.5 ? 'CASH' : 'UPI', status: 'PAID',
          receiptNumber: `RC-${year}-${String(sequence).padStart(6, '0')}`, createdByStaffId: staff.id,
        },
      });
    }
  }

  // Keep one clearly fictional completed birth request available for the demo login.
  const birthService = dbServices.find((service) => service.slug === 'birth-certificate');
  const demoBirthMarker = 'SevaSaathi demo completed birth record';
  const existingBirthDemo = await prisma.request.findFirst({ where: { userId: customer.id, formData: { contains: demoBirthMarker } } });
  let birthDemoRequest = existingBirthDemo;
  if (birthService && !existingBirthDemo) {
    let sequence = ++maxSequence;
    let trackingNumber = `AS-${year}-${String(sequence).padStart(6, '0')}`;
    while (occupiedNumbers.has(trackingNumber)) {
      sequence = ++maxSequence;
      trackingNumber = `AS-${year}-${String(sequence).padStart(6, '0')}`;
    }
    occupiedNumbers.add(trackingNumber);
    birthDemoRequest = await prisma.request.create({
      data: {
        trackingNumber, userId: customer.id, serviceId: birthService.id, status: 'COMPLETED',
        formData: JSON.stringify({ childName: 'Rahul Sharma', dob: '2010-01-15', hospital: 'Demo City Hospital', note: demoBirthMarker }),
        amountPaise: birthService.feePaise, consentAt: new Date(), consentVersion: 'v1', paidAt: new Date(),
      },
    });
  }
  // The demo birth request is paid, so make sure it also has the payment row required by receipt downloads.
  if (birthDemoRequest) {
    await prisma.payment.upsert({
      where: { requestId: birthDemoRequest.id },
      create: {
        requestId: birthDemoRequest.id, amountPaise: birthDemoRequest.amountPaise,
        method: 'UPI', status: 'PAID', receiptNumber: `DEMO-${birthDemoRequest.trackingNumber}`, notes: 'Demo Payment',
      },
      update: { status: 'PAID' },
    });
  }

  // Keep generated demo requests from colliding with the next real request.
  const existingCounter = await prisma.counter.findUnique({ where: { name: 'request' } });
  await prisma.counter.upsert({
    where: { name: 'request' },
    update: { value: Math.max(existingCounter?.value || 100000, maxSequence) },
    create: { name: 'request', value: maxSequence },
  });

  console.log('Seeding completed! ✅');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
