// routes.ts
export const protectedRoutes = [
    { path: '/notifications', redirect: '/login' },
    { path: '/plants', redirect: '/login' },
    { path: '/devices', redirect: '/login' },
  ];
  
  export const adminRoutes = [
    { path: '/admin', redirect: '/devices' },
    { path: '/admin/device-models', redirect: '/devices' },
    { path: '/admin/inventory', redirect: '/devices' },
  ];
  