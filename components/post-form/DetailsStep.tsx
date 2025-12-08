import { useMemo } from "react";
import type { Option, PostFormValues, PostType } from "./types";

type DetailsStepProps = {
  values: PostFormValues;
  availableCategories: Option[];
  availableTags: string[];
  fieldErrors: { title?: boolean; category?: boolean; description?: boolean };
  onUpdate: <K extends keyof PostFormValues>(key: K, value: PostFormValues[K]) => void;
  onToggleTag: (tag: string) => void;
};

export function DetailsStep({ values, availableCategories, availableTags, fieldErrors, onUpdate, onToggleTag }: DetailsStepProps) {
  const categories = useMemo(() => availableCategories, [availableCategories]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-800">Title *</label>
        <input
          value={values.title}
          onChange={(e) => onUpdate("title", e.target.value)}
          className={`w-full rounded border px-3 py-2 focus:outline-none focus:ring-1 ${
            fieldErrors.title
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          }`}
          placeholder="Lost black backpack near park"
        />
        {fieldErrors.title && <p className="text-xs text-red-600">Title is required.</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-800">Type *</label>
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
          <label className="text-sm font-semibold text-gray-800">Category *</label>
          <select
            value={values.category}
            onChange={(e) => onUpdate("category", e.target.value)}
            className={`w-full rounded border px-3 py-2 focus:outline-none focus:ring-1 ${
              fieldErrors.category
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            }`}
          >
            <option value="">Choose category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          {fieldErrors.category && <p className="text-xs text-red-600">Category is required.</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-800">Tags (double-click to add/remove)</label>
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
                  title="Double-click to toggle"
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
          <p className="text-xs text-gray-600">Double-click a tag to add/remove it.</p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-800">Description *</label>
        <textarea
          value={values.description}
          onChange={(e) => onUpdate("description", e.target.value)}
          rows={4}
          className={`w-full rounded border px-3 py-2 focus:outline-none focus:ring-1 ${
            fieldErrors.description
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          }`}
          placeholder="Describe what was lost/found, where, when, and identifying details."
        />
        {fieldErrors.description && <p className="text-xs text-red-600">Description is required.</p>}
      </div>
    </div>
  );
}
