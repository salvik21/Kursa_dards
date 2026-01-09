import { redirect } from "next/navigation";

// Tipi priekš lapas parametriem no URL
type ResetPasswordRedirectProps = {
  // searchParams — URL vaicājuma parametri (?key=value)
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function ResetPasswordRedirectPage({
  searchParams,
}: ResetPasswordRedirectProps) {

  // Izveido URLSearchParams objektu jaunu vaicājuma parametru uzkrāšanai
  const params = new URLSearchParams();

  // Ja URL parametri eksistē
  if (searchParams) {

    // Iet cauri visiem URL parametriem (atslēga → vērtība)
    for (const [key, value] of Object.entries(searchParams)) {

      // Ja vērtība ir masīvs (vairāki parametri ar vienu nosaukumu)
      if (Array.isArray(value)) {

        // Pievieno katru vērtību atsevišķi URL vaicājumam
        for (const item of value) {
          params.append(key, item);
        }

      // Ja vērtība ir viena rinda (string)
      } else if (value !== undefined) {

        // Iestata parametru URL vaicājumā
        params.set(key, value);
      }
    }
  }

  // Pārveido visus parametrus uz vaicājuma virkni (piem., a=1&b=2)
  const query = params.toString();

  // Pāradresē uz paroles atjaunošanas lapu,
  // saglabājot visus URL parametrus, ja tādi ir
  redirect(
    query
      ? `/auth/reset-password?${query}`
      : "/auth/reset-password"
  );
}
