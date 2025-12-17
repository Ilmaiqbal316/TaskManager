import { User } from '../models/user';  

// ... rest of the code

const USERS_KEY = "tm_users";

export const getUsers = (): User[] => {
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
};

export const saveUsers = (users: User[]) =>
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
