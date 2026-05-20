import { useAuth } from '@/contexts/AuthContext';

export function useToken(): string {
  return useAuth().token;
}
