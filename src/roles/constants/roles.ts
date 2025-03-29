export const roles = [
  {
    name: 'Admin',
    description:
      'Has full access to the system, including managing users, roles, and all supply chain operations.',
    permissions: [
      'manage:users',
      'manage:roles',
      'view:orders',
      'create:orders',
      'update:orders',
      'delete:orders',
      'view:inventory',
      'update:inventory',
      'view:shipments',
      'create:shipments',
      'update:shipments',
      'delete:shipments',
      'view:suppliers',
      'create:suppliers',
      'update:suppliers',
      'delete:suppliers',
      'view:reports',
      'generate:reports',
      'manage:settings',
    ],
  },
  {
    name: 'User',
    description:
      'Can view and manage supply chain operations but cannot manage users or roles.',
    permissions: [
      'view:orders',
      'create:orders',
      'update:orders',
      'view:inventory',
      'view:shipments',
      'create:shipments',
      'update:shipments',
      'view:suppliers',
      'view:reports',
    ],
  },
];
