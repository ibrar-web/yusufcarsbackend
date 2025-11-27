export type SocketUserRole = 'user' | 'supplier' | 'admin';

export interface SocketUserContext {
  id: string;
  role: SocketUserRole;
  supplierId?: string;
  supplierPostCode?: string | null;
  supplierCategories?: string[];
}

export interface SupplierFilterOptions {
  postCode?: string | null;
  categories?: string[];
}
