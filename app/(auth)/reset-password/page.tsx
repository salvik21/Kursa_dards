import { redirect } from "next/navigation";

type ResetPasswordRedirectProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function ResetPasswordRedirectPage({ searchParams }: ResetPasswordRedirectProps) {
  const params = new URLSearchParams();

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          params.append(key, item);
        }
      } else if (value !== undefined) {
        params.set(key, value);
      }
    }
  }

  const query = params.toString();
  redirect(query ? `/auth/reset-password?${query}` : "/auth/reset-password");
}
