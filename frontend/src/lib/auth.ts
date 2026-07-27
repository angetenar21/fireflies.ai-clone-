import api from "@/lib/api";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  meeting_count: number;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>("/api/auth/me");
  return data;
}

export const DEMO_LOGIN = {
  name: "Manish Yadav",
  email: "manish.yadav@quantumcorp.io",
  password: "Demo@1234",
} as const;
