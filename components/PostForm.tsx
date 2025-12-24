"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { defaultPlaceOptions, defaultTagOptions } from "./post-form/constants";
import { DetailsStep } from "./post-form/DetailsStep";
import { LocationStep } from "./post-form/LocationStep";
import { PhotosStep } from "./post-form/PhotosStep";
import { StepFooter } from "./post-form/StepFooter";
import { StepHeader } from "./post-form/StepHeader";
import type { LocationMode, Option, PostFormProps, PostFormValues } from "./post-form/types";
import { fetchCategories, fetchPlaces, fetchTags } from "@/lib/api/public";
import { useCallback } from "react";

export function PostForm({ mode, initialValues, onSubmit, onCancelHref }: PostFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<PostFormValues>(initialValues);
  const [locationMode, setLocationMode] = useState<LocationMode>("list");
  const [availableTags, setAvailableTags] = useState<string[]>(defaultTagOptions);
  const [availableCategories, setAvailableCategories] = useState<Option[]>([]);
  const [availablePlaces, setAvailablePlaces] = useState<Option[]>(
    defaultPlaceOptions.map((p, i) => ({ id: `p-${i}`, name: p }))
  );
  const [contactEmail, setContactEmail] = useState<string>("");
  const [contactPhone, setContactPhone] = useState<string>("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressCountry, setAddressCountry] = useState("Latvia");
  const [lat, setLat] = useState(values.geo?.lat ? String(values.geo.lat) : "");
  const [lng, setLng] = useState(values.geo?.lng ? String(values.geo.lng) : "");
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ title?: boolean; category?: boolean; description?: boolean }>({});

  const countryCodeMap: Record<string, string> = {
    Latvia: "LV",
    Lithuania: "LT",
    Estonia: "EE",
    Poland: "PL",
    Germany: "DE",
    Finland: "FI",
  };

  const geocodeViaApi = useCallback(
    async (address: string, countryCode?: string) => {
      try {
        const res = await fetch("/api/geocode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address, countryCode }),
        });
        let json: any = null;
        try {
          json = await res.json();
        } catch {
          json = null;
        }
        if (!res.ok || !json?.ok) {
          const message = (json && (json.error || json.message)) || "Neizdevas geokodet adresi";
          throw new Error(message);
        }
        return json as { lat: number; lng: number; formattedAddress?: string };
      } catch (err: any) {
        throw new Error(err?.message || "Neizdevas geokodet adresi");
      }
    },
    []
  );

  // Initialize location mode from initial values
  useEffect(() => {
    let mode: LocationMode = "list";
    if (values.geo?.lat && values.geo?.lng) {
      mode = "map";
    } else if (values.placeName) {
      const inList = availablePlaces.some((p) => p.name === values.placeName);
      mode = inList ? "list" : "address";
      if (!inList) {
        setAddressStreet(values.placeName);
      }
    }
    setLocationMode(mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load profile contact for visibility toggles
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) return;
        const email = json.user?.email ?? "";
        const phone = json.user?.phone ?? "";
        setContactEmail(email);
        setContactPhone(phone);
        setValues((prev) => ({
          ...prev,
          showEmail: prev.showEmail !== undefined ? prev.showEmail : true,
          showPhone: prev.showPhone !== undefined ? prev.showPhone : !!phone,
        }));
      } catch {
        // ignore profile load failures
      }
    };
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load tags/categories/places
  useEffect(() => {
    fetchTags().then((names) => {
      if (names.length) setAvailableTags(names);
    });
  }, []);

  useEffect(() => {
    fetchCategories().then((options) => {
      if (options.length) {
        setAvailableCategories(options);
      }
    });
  }, []);

  useEffect(() => {
    fetchPlaces().then((options) => {
      if (options.length) {
        setAvailablePlaces(options);
        if (!values.placeName && locationMode === "list") {
          setValues((prev) => ({ ...prev, placeName: options[0]?.name ?? "Nav vietas" }));
        }
      }
    });
  }, [values.placeName, locationMode]);

  const placeOptions = useMemo(() => availablePlaces, [availablePlaces]);

  const updateValue = <K extends keyof PostFormValues>(key: K, value: PostFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const normalizePlaceName = (name: string) => {
    const clean = name?.trim() ?? "";
    if (!clean || clean === "No place" || clean === "Nav vietas") return "";
    return clean;
  };

  const handlePlaceChange = (value: string) => {
    const selected = availablePlaces.find((p) => p.name === value);
    updateValue("placeName", value);

    if (selected?.lat !== undefined && selected?.lng !== undefined) {
      const nextLat = String(selected.lat);
      const nextLng = String(selected.lng);
      setLat(nextLat);
      setLng(nextLng);
      setValues((prev) => ({ ...prev, geo: { lat: selected.lat!, lng: selected.lng! } }));
    } else {
      setLat("");
      setLng("");
      setValues((prev) => ({ ...prev, geo: null }));
    }
  };

  const toggleTag = (tag: string) => {
    setValues((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }));
  };

  const validateDetails = () => {
    const errs = {
      title: !values.title.trim(),
      category: !values.category.trim(),
      description: !values.description.trim(),
    };
    setFieldErrors(errs);
    if (errs.title || errs.category || errs.description) {
      setMessage("Lūdzu, aizpildiet obligātos laukus: virsraksts, kategorija, apraksts.");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 0 && !validateDetails()) return;
    setMessage(null);
    setStep((prev) => Math.min(prev + 1, 2) as 0 | 1 | 2);
  };

  const handlePrev = () => {
    setMessage(null);
    setStep((prev) => Math.max(prev - 1, 0) as 0 | 1 | 2);
  };

  const handleSubmit = async () => {
    if (photoUploading) {
      setError("Pagaidiet, līdz foto augšupielādējas.");
      setStep(2);
      return;
    }
    if (!validateDetails()) {
      setStep(0);
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const addressString = [addressStreet, addressCity, addressCountry].filter(Boolean).join(", ") || "";

      let placeNamePayload = normalizePlaceName(values.placeName);
      let descriptionPayload = values.description;
      let geoPayload: { lat: number; lng: number } | null = null;

      if (locationMode === "list") {
        const selected = availablePlaces.find((p) => p.name === values.placeName);
        if (selected?.lat !== undefined && selected?.lng !== undefined) {
          geoPayload = { lat: selected.lat, lng: selected.lng };
        } else {
          geoPayload = values.geo ?? null;
        }
        placeNamePayload = normalizePlaceName(values.placeName);
      } else if (locationMode === "address") {
        if (!addressString) {
          setStep(1);
          throw new Error('Ievadiet adresi vai izmantojiet "Izvēlēties kartē", lai iestatītu koordinātas.');
        }
        const geocoded = await geocodeViaApi(addressString, countryCodeMap[addressCountry] || undefined);
        if (!geocoded) {
          setStep(1);
          throw new Error('Neizdevās pārvērst adresi koordinātēs. Pārbaudiet adresi vai izvēlieties "Izvēlēties kartē".');
        }
        geoPayload = { lat: geocoded.lat, lng: geocoded.lng };
        placeNamePayload = "adrese";
      } else if (locationMode === "map") {
        if (!lat || !lng || Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) {
          setStep(1);
          throw new Error("Ievadiet koordinātas vai izvēlieties punktu kartē.");
        }
        geoPayload = { lat: Number(lat), lng: Number(lng) };
        placeNamePayload = placeNamePayload || "koordinātas";
      }

      const selectedCategory = availableCategories.find((c) => c.id === values.category);

      await onSubmit({
        ...values,
        category: selectedCategory?.id || values.category,
        placeName: placeNamePayload,
        description: descriptionPayload,
        geo: geoPayload,
      });
      setMessage(mode === "create" ? "Ieraksts izveidots." : "Ieraksts atjaunināts.");
      router.push("/me");
    } catch (err: any) {
      setError(err?.message || "Neizdevās saglabāt ierakstu");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <StepHeader step={step} />

      {step === 0 && (
        <DetailsStep
          values={values}
          availableCategories={availableCategories}
          availableTags={availableTags}
          fieldErrors={fieldErrors}
          contactEmail={contactEmail}
          contactPhone={contactPhone}
          onUpdate={updateValue}
          onToggleTag={toggleTag}
        />
      )}

      {step === 1 && (
        <LocationStep
          locationMode={locationMode}
          values={values}
          placeOptions={placeOptions}
          address={{ street: addressStreet, city: addressCity, country: addressCountry }}
          lat={lat}
          lng={lng}
          onLocationModeChange={setLocationMode}
          onPlaceChange={handlePlaceChange}
          onAddressChange={(field, value) => {
            if (field === "street") setAddressStreet(value);
            if (field === "city") setAddressCity(value);
            if (field === "country") setAddressCountry(value);
          }}
          onLatLngChange={(newLat, newLng) => {
            setLat(newLat);
            setLng(newLng);
          }}
          onPlaceNameChange={(value) => updateValue("placeName", value)}
        />
      )}

      {step === 2 && <PhotosStep values={values} onUpdate={updateValue} onUploadingChange={setPhotoUploading} />}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}

      <StepFooter
        step={step}
        saving={saving}
        onPrev={handlePrev}
        onNext={handleNext}
        onSubmit={handleSubmit}
        onCancelHref={onCancelHref}
        mode={mode}
        disableSubmit={photoUploading}
      />
    </div>
  );
}
