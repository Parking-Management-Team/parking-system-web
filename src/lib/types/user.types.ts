export interface User {
  id: string;
  username: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF' | 'DRIVER';
  email?: string | null;
}
