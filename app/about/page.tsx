import { adminDb } from "@/lib/firebase/admin";

async function getContactEmail() {
  try {
    const snap = await adminDb.collection("settings").doc("contact").get();
    return (snap.data() as any)?.email ?? "";
  } catch {
    return "";
  }
}

export default async function AboutPage() {
  const contactEmail = await getContactEmail();

  return (
    <main className="max-w-4xl mx-auto px-4 py-16">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Par mums</h1>
        <p className="text-base text-gray-700">
          Platforma &quot;Pazaudetas un atrastas lietas&quot; ir izveidota, lai palidzetu cilvekiem atrast pazaudetas mantas un
          atgriezt tas to ipasniekiem.
        </p>
        <p className="text-base text-gray-700">
          Vietne lauj lietotajiem publicet informaciju par pazaudetam vai atrastam lietam, izmantot kategorijas un tagus,
          ka ari erti meklet nepieciesamo informaciju.
        </p>
        <p className="text-base text-gray-700">
          Musu merkis ir nodrosinat vienkarsu, saprotamu un pieejamu risinajumu ikvienam.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 pt-4">Sazina ar administraciju</h2>
        <p className="text-base text-gray-700">
          Ja jums ir jautajumi, ieteikumi vai priekslikumi par jaunu kategoriju vai tagu pievienosanu,
          ludzu, sazinieties ar vietnes administraciju, rakstot uz e-pastu:{" "}
          {contactEmail ? (
            <a href={`mailto:${contactEmail}`} className="text-blue-600 hover:underline">
              {contactEmail}
            </a>
          ) : (
            "pa e-pastu."
          )}
        </p>
      </div>
    </main>
  );
}
