export type UserRole =
  | 'SYSTEM_ADMIN'
  | 'ORG_OWNER'
  | 'ORG_ADMIN'
  | 'PROJECT_MAINTAINER'
  | 'DEVELOPER'
  | 'READ_ONLY';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: User;
}
