import dotenv from 'dotenv';
dotenv.config();
export const API_BASE = process.env.VITE_API_BASE ?? '';

export async function apiFetch(input: string, init?: RequestInit) {
  const url = input.startsWith('http') ? input : `${API_BASE}${input}`;
  return fetch(url, init);
}
