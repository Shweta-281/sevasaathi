export const rupeesToPaise = (r) => Math.round(Number(r) * 100);
export const paiseToRupees = (p) => Number(p) / 100;
export const formatINR = (paise) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(paiseToRupees(paise));