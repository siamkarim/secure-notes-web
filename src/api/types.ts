export type Role = 'user' | 'admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  interests: string[];
  createdAt: string;
}

export interface Note {
  _id: string;
  owner: string | { _id: string; name: string; email: string };
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  _id: string;
  title: string;
  body: string;
  createdAt: string;
}

export interface InterestGroup {
  interest: string;
  count: number;
  users: { _id: string; name: string }[];
}

/** Every list endpoint answers in this shape. */
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}
