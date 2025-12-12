import { useMemo } from "react";
import type { Option, PostFormValues, PostType } from "./types";

type DetailsStepProps = {
  values: PostFormValues;
  availableCategories: Option[];
  availableTags: string[];
  fieldErrors: { title?: boolean; category?: boolean; description?: boolean };
  contactEmail?: string;
  contactPhone?: string;
  onUpdate: <K extends keyof PostFormValues>(key: K, value: PostFormValues[K]) => void;
  onToggleTag: (tag: string) => void;
};

export function DetailsStep({
  values,
  availableCategories,
  availableTags,
  fieldErrors,
  contactEmail,
  contactPhone,
  onUpdate,
  onToggleTag,
}: DetailsStepProps) {
  const categories = useMemo(() => availableCategories, [availableCategories]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-800">Virsraksts *</label>
        <input
          value={values.title}
          onChange={(e) => onUpdate("title", e.target.value)}
          className={`w-full rounded border px-3 py-2 focus:outline-none focus:ring-1 ${
            fieldErrors.title
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          }`}
          placeholder="Pazudusi melna mugursoma pie parka"
        />
        {fieldErrors.title && <p className="text-xs text-red-600">Nepieciešams virsraksts.</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-800">Veids *</label>
          <select
            value={values.type}
            onChange={(e) => onUpdate("type", e.target.value as PostType)}
            className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="lost">Pazudis</option>
            <option value="found">Atrasts</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-800">Kategorija *</label>
          <select
            value={values.category}
            onChange={(e) => onUpdate("category", e.target.value)}
            className={`w-full rounded border px-3 py-2 focus:outline-none focus:ring-1 ${
              fieldErrors.category
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            }`}
          >
            <option value="">Izvēlieties kategoriju</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {fieldErrors.category && <p className="text-xs text-red-600">Kategorija ir obligāta.</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-800">Birkas (dubultklikšķis, lai pievienotu/noņemtu)</label>
          <div className="flex flex-wrap gap-2 rounded border border-gray-300 p-3">
            {availableTags.map((t) => {
              const active = values.tags.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onDoubleClick={() => onToggleTag(t)}
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    active
                      ? "bg-blue-600 text-white border border-blue-600"
                      : "bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200"
                  }`}
                  title="Dubultklikšķis, lai pārslēgtu"
                >
                  {t}
                </button>
              );
            })}
          </div>
          {values.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {values.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onToggleTag(tag)}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-800 hover:bg-gray-100"
                >
                  <span>{tag}</span>
                  <span className="text-gray-500">x</span>
                </button>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-600">Veiciet dubultklikšķi uz birkas, lai to pievienotu/noņemtu.</p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-800">Apraksts *</label>
        <textarea
          value={values.description}
          onChange={(e) => onUpdate("description", e.target.value)}
          rows={4}
          className={`w-full rounded border px-3 py-2 focus:outline-none focus:ring-1 ${
            fieldErrors.description
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          }`}
          placeholder="Aprakstiet, kas tika pazaudēts/atrasts, kur, kad un pazīmes."
        />
        {fieldErrors.description && <p className="text-xs text-red-600">Apraksts ir obligāts.</p>}
      </div>

      {values.type === "found" && (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-800">Privāta piezīme (redzama tikai jums un administratoriem)</label>
          <textarea
            value={values.privateNote ?? ""}
            onChange={(e) => onUpdate("privateNote", e.target.value)}
            rows={3}
            className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Papildu piezīme sev vai administratoriem. Publiski netiek rādīta."
          />
          <p className="text-xs text-gray-600">Šī piezīme nav redzama citiem lietotājiem.</p>
        </div>
      )}

      <div className="space-y-2 rounded border border-gray-200 bg-gray-50 p-3">
        <div className="text-sm font-semibold text-gray-800">Kontaktinformācijas redzamība</div>
        <p className="text-xs text-gray-600">Izvēlieties, ko rādīt sludinājumā publiski.</p>
        <div className="space-y-2 pt-1">
          <label className="inline-flex items-center gap-2 text-sm text-gray-800">
            <input
              type="checkbox"
              checked={values.showEmail !== false}
              onChange={(e) => onUpdate("showEmail", e.target.checked)}
            />
            Rādīt manu e-pastu{contactEmail ? ` (${contactEmail})` : ""}
          </label>
          {contactPhone && (
            <label className="inline-flex items-center gap-2 text-sm text-gray-800">
              <input
                type="checkbox"
                checked={!!values.showPhone}
                onChange={(e) => onUpdate("showPhone", e.target.checked)}
              />
              Rādīt manu telefonu ({contactPhone})
            </label>
          )}
          {!contactPhone && (
            <p className="text-xs text-gray-500">Jūsu profilā nav tālruņa numura, tādēļ tas netiks rādīts.</p>
          )}
        </div>
      </div>
    </div>
  );
}
