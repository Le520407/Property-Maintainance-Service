export const SERVICE_CATEGORIES = [
  { id: 'maintenance', name: 'Home Repairs', value: 'maintenance', label: 'Home Repairs' },
  { id: 'painting', name: 'Painting', value: 'painting', label: 'Painting' },
  { id: 'electrical', name: 'Electrical', value: 'electrical', label: 'Electrical' },
  { id: 'plumbing', name: 'Plumbing', value: 'plumbing', label: 'Plumbing' },
  { id: 'flooring', name: 'Flooring', value: 'flooring', label: 'Flooring' },
  { id: 'installation', name: 'Appliance Installation', value: 'installation', label: 'Appliance Installation' },
  { id: 'assembly', name: 'Furniture Assembly', value: 'assembly', label: 'Furniture Assembly' },
  { id: 'moving', name: 'Moving Services', value: 'moving', label: 'Moving Services' },
  { id: 'renovation', name: 'Renovation', value: 'renovation', label: 'Renovation' },
  { id: 'security', name: 'Safety & Security', value: 'security', label: 'Safety & Security' },
  { id: 'cleaning', name: 'Cleaning', value: 'cleaning', label: 'Cleaning' }
];

export const SERVICE_CATEGORIES_SIMPLE = SERVICE_CATEGORIES.map(cat => cat.id);

export const SERVICE_CATEGORIES_OBJECT_FORMAT = SERVICE_CATEGORIES.map(cat => ({ id: cat.id, name: cat.name }));

export const SERVICE_CATEGORIES_SELECT_FORMAT = SERVICE_CATEGORIES.map(cat => ({ value: cat.value, label: cat.label }));