import { Supplier } from '../../entities/supplier.entity';
import { User } from '../../entities/user.entity';

const isFilled = (value?: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'number') return true;
  return String(value).trim().length > 0;
};

export function applyProfileCompletion(
  user: User,
  supplier?: Supplier | null,
): void {
  const baseFields = [
    user.firstName,
    user.lastName,
    user.email,
    user.phone,
    user.postCode,
    user.profileImageUrl,
  ];

  const supplierFields =
    supplier && user.role === 'supplier'
      ? [
          supplier.businessName,
          supplier.tradingAs,
          supplier.businessType,
          supplier.description,
          supplier.addressLine1,
          supplier.city,
          supplier.postCode,
          supplier.phone,
          supplier.mainCategoryImageUrl,
        ]
      : [];

  const fields = supplierFields.length ? [...baseFields, ...supplierFields] : baseFields;
  const completion = calculateCompletion(fields);
  user.profileCompletion = completion;
  user.profileCompleted = completion === 100;
}

function calculateCompletion(fields: unknown[]) {
  if (!fields.length) return 0;
  const filled = fields.filter((value) => isFilled(value)).length;
  return Math.round((filled / fields.length) * 100);
}
