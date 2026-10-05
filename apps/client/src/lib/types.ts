export type User = {
  id: string;
  username: string;
  name: string;
  coupleId: string | null;
  avatar: Media | null;
};
export type Profile = {
  user: User;
  partner: User | null;
  couple: { id: string; startDate: string | null } | null;
};
export type Media = {
  id: string;
  kind: 'image' | 'video';
  thumbnailUrl: string;
  previewUrl: string;
  width: number;
  height: number;
  duration: number | null;
};
export type Message = {
  id: number;
  role: 'user' | 'assistant';
  senderId: string;
  content: string;
  clientId: string;
  createdAt: string;
  readAt: string | null;
  media: Media | null;
};
export type Moment = { id: string; ownerId: string; title: string; date: string; media: Media };
export type Anniversary = { id: string; title: string; date: string; yearly: number };
export type Session = { server: string; token: string };
