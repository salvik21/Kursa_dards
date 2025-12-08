type AddressFieldsProps = {
  street: string;
  house: string;
  city: string;
  postal: string;
  onStreetChange: (v: string) => void;
  onHouseChange: (v: string) => void;
  onCityChange: (v: string) => void;
  onPostalChange: (v: string) => void;
};

export function AddressFields({
  street,
  house,
  city,
  postal,
  onStreetChange,
  onHouseChange,
  onCityChange,
  onPostalChange,
}: AddressFieldsProps) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-800">Street *</label>
          <input
            value={street}
            onChange={(e) => onStreetChange(e.target.value)}
            placeholder="Brivibas iela"
            className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-800">House / apartment</label>
          <input
            value={house}
            onChange={(e) => onHouseChange(e.target.value)}
            placeholder="10-15"
            className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-800">City *</label>
          <input
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            placeholder="Riga"
            className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-800">Postal code</label>
          <input
            value={postal}
            onChange={(e) => onPostalChange(e.target.value)}
            placeholder="LV-1010"
            className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
      <p className="text-xs text-gray-600">Will be saved as text without coordinates. For precise alerts, choose {"\""}Pick on map{"\""}.</p>
    </div>
  );
}
