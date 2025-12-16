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
          Platforma “Pazaudētās un atrastās lietas” ir izveidota, lai palīdzētu cilvēkiem atrast pazaudētas mantas un
          atgriezt tās to īpašniekiem.
        </p>
        <p className="text-base text-gray-700">
          Vietne ļauj lietotājiem publicēt informāciju par pazaudētām vai atrastām lietām, izmantot kategorijas un tagus,
          kā arī ērti meklēt nepieciešamo informāciju.
        </p>
        <p className="text-base text-gray-700">
          Mūsu mērķis ir nodrošināt vienkāršu, saprotamu un pieejamu risinājumu ikvienam.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 pt-4">Saziņa ar administrāciju</h2>
        <p className="text-base text-gray-700">
          Ja jums ir jautājumi, ieteikumi vai priekšlikumi par jaunu kategoriju vai tagu pievienošanu,
          lūdzu, sazinieties ar vietnes administrāciju, rakstot uz e-pastu:{" "}
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
