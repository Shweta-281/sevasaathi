import prisma from '../lib/prisma.js';
import { Errors } from '../lib/errors.js';

const parse = (s) => s ? {
  ...s,
  requiredDocuments: JSON.parse(s.requiredDocuments || '[]'),
  formSchema: JSON.parse(s.formSchema || '{"fields":[]}'),
} : null;

export async function listServices({ category, q, activeOnly = true } = {}) {
  const where = {};
  if (activeOnly) where.active = true;
  if (category) where.category = category;
  if (q) where.OR = [{ name: { contains: q } }, { description: { contains: q } }];
  return (await prisma.service.findMany({ where, orderBy: { name: 'asc' } })).map(parse);
}

export async function getServiceBySlug(slug) {
  const s = await prisma.service.findUnique({ where: { slug } });
  if (!s || !s.active) throw Errors.notFound('Service not found', 'SERVICE_NOT_FOUND');
  return parse(s);
}

export async function createService(input) {
  return parse(await prisma.service.create({
    data: {
      ...input,
      requiredDocuments: JSON.stringify(input.requiredDocuments || []),
      formSchema: JSON.stringify(input.formSchema || { fields: [] }),
    },
  }));
}

export async function updateService(id, input) {
  const data = { ...input };
  if (data.requiredDocuments) data.requiredDocuments = JSON.stringify(data.requiredDocuments);
  if (data.formSchema) data.formSchema = JSON.stringify(data.formSchema);
  return parse(await prisma.service.update({ where: { id }, data }));
}

export async function deleteService(id) {
  return parse(await prisma.service.update({ where: { id }, data: { active: false } }));
}
