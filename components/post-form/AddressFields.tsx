type AddressFieldsProps = {
  street: string;
  city: string;
  country: string;
  onStreetChange: (v: string) => void;
  onCityChange: (v: string) => void;
  onCountryChange: (v: string) => void;
};

export function AddressFields({
  street,
  city,
  country,
  onStreetChange,
  onCityChange,
  onCountryChange,
}: AddressFieldsProps) {
  const countries = ["Latvia", "Lithuania", "Estonia", "Poland", "Germany", "Finland"];

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-800">Iela *</label>
          <input
            value={street}
            onChange={(e) => onStreetChange(e.target.value)}
            placeholder="Brivibas iela"
            className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-800">Pilseta *</label>
          <input
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            placeholder="Riga"
            className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-800">Valsts *</label>
          <select
            value={country}
            onChange={(e) => onCountryChange(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="text-xs text-gray-600">
        Meginasim parverst so adresi koordinates. Ja to neizdodas atrast, ludzu, izvelieties {"\""}Izveleties karte{"\""}.
      </p>
    </div>
  );
}
