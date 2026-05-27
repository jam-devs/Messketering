export type UserRole = 'admin' | 'kitchen' | 'logistics';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}
