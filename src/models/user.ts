export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
  profile: {
    avatar?: string;
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}

// Export as default too
export default User;