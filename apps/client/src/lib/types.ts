export type User = {
  id: string;
  username: string;
  name: string;
  coupleId: string | null;
  avatar: Media | null;
};
export type AIIdentity = { name: string; avatar: Media | null; enabled: boolean };
export type Profile = {
  ai: AIIdentity;
  user: User;
  partner: User | null;
  couple: {
    id: string;
    startDate: string | null;
    startTime: string;
    storageBytes: number;
    quotaBytes: number;
  } | null;
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
export type UploadedMedia = Media & { capturedDate: string | null };
export type Message = {
  id: number;
  role: 'user' | 'assistant';
  senderId: string;
  content: string;
  clientId: string;
  createdAt: string;
  readAt: string | null;
  media: Media | null;
  assistant: { name: string; avatar: Media | null } | null;
};
export type Moment = {
  id: string;
  ownerId: string;
  title: string;
  date: string;
  createdAt: string;
  media: Media;
};
export type Anniversary = { id: string; title: string; date: string; time: string };
export type Session = { server: string; token: string };

export type Todo = {
  id: string;
  title: string;
  date: string;
  time: string;
  calendar: 'solar' | 'lunar';
  leapMonth: number;
  repeat: 'none' | 'yearly';
  completed: number;
  completedDate: string | null;
};

export type Presence = { coupleId: string; users: { id: string; online: boolean }[] };
