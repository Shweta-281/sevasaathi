import { z } from 'zod';

export const Roles = z.enum(['CUSTOMER', 'STAFF', 'ADMIN']);
export const RequestStatuses = z.enum([
  'PENDING', 'IN_PROGRESS', 'DOCUMENTS_PENDING', 'PROCESSING', 'READY_FOR_PICKUP', 'COMPLETED', 'REJECTED',
]);
export const PaymentMethods = z.enum(['RAZORPAY', 'CASH', 'UPI']);
export const PaymentStatuses = z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']);
export const AppointmentStatuses = z.enum(['BOOKED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']);
