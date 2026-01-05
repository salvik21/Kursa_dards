# Kursa dards — Pazudetas un atrastas lietas

Tisa ir kursa darba projekta lietotne pazuduso un atrasto lietu publicesanai un mekleSanai. Lietotaji var veidot sludinajumus, pievienot foto un lokaciju, un sazineties ar atrastam lietam ar e-pasta formas palidzibu.

## Galvenas funkcijas
- Publiska sludinajumu parskatisana un mekleSana
- PazuduSa/atrasta lieta: apraksts, foto, statuss, lokacija
- Kontakta forma, lai nosutit e-pastu sludinajuma autoram
- Lietotaju konti: profila dati, mani sludinajumi, pazinojumi
- Admin panelis: lietotaji, sludinajumi, tags, kategorijas, vietas, statistika

## Tehnologijas
- Next.js 14 (App Router), React, TypeScript
- Tailwind CSS
- Firebase (Auth/Firestore) un firebase-admin
- Supabase (failu glabasana)
- Google Maps API
- Jest + Testing Library

## UzstadiSana
1) Instalacija:

```bash
npm install
```

2) Izveido .env.local no parauga:

```bash
copy .env.local.example .env.local
```

3) Aizpildi vides mainigos .env.local (skat. zemak)

4) Palaid izstrades vidi:

```bash
npm run dev
```

## Vides mainigie
Pamatatbalsts ir definets `c:\Users\alax2\Desktop\Pro\Kursa_dards\.env.local.example`.
Nepieciesamie mainigie:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_BUCKET_NAME`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

## Skripti
- `npm run dev` — izstrades servers
- `npm run build` — produkcijas build
- `npm run start` — palaist build
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript parbaude
- `npm run test` — Jest

## Projekta struktura
- `app/` — App Router lapas un API routes
- `components/` — UI komponenti
- `lib/` — paligfunkcijas un integracijas
- `types/` — kopigie tipi
- `public/` — statiskie faili

## Deploy
Ieteicams Vercel. Pievieno visus `.env.local` mainigos Vercel Environment Variables un izpildi `npm run build`.
