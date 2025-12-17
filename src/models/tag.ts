export interface Tag {
  id: string;
  userId: string;
  name: string;
  color?: string;
  createdAt: Date;
}

export default Tag;