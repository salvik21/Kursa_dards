import type { Option } from "./types";

type PlaceSelectorProps = {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
};

export function PlaceSelector({ value, options, onChange }: PlaceSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-800">Vieta</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {options.map((p) => (
          <option key={p.id} value={p.name}>
            {p.name}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-600">Izvelieties ieprieks iestatitu vietu vai opciju {"\""}Nav vietas{"\""}</p>
    </div>
  );
}
