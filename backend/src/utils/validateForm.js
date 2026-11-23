import { z } from 'zod';
import { AppError } from '../lib/errors.js';

function fieldSchema(f) {
  let s;
  switch (f.type) {
    case 'string':
      s = z.string();
      if (f.min != null) s = s.min(f.min);
      if (f.max != null) s = s.max(f.max);
      if (f.pattern) s = s.regex(new RegExp(f.pattern), 'Invalid format');
      break;
    case 'number':
      s = z.coerce.number();
      if (f.min != null) s = s.min(f.min);
      if (f.max != null) s = s.max(f.max);
      break;
    case 'date':
      s = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');
      break;
    case 'email':
      s = z.string().email();
      break;
    case 'phone':
      s = z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile');
      break;
    case 'aadhaar':
      s = z.string().regex(/^\d{12}$/, 'Aadhaar must be 12 digits');
      break;
    case 'enum':
      s = z.enum(f.options);
      break;
    case 'boolean':
      s = z.boolean();
      break;
    default:
      s = z.any();
  }
  if (!f.required) s = s.optional();
  return [f.name, s];
}

export function validateFormData(formSchemaJson, data) {
  const schema = JSON.parse(formSchemaJson);
  const shape = Object.fromEntries((schema.fields || []).map(fieldSchema));
  const result = z.object(shape).strict().safeParse(data);
  if (!result.success) {
    throw new AppError('Form data validation failed', 'INVALID_FORM_DATA', 400, result.error.flatten());
  }
  return result.data;
}