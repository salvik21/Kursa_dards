"use client";

import { useEffect, useMemo, useState } from "react";
import { defaultPlaceOptions, defaultTagOptions } from "./post-form/constants";
import { DetailsStep } from "./post-form/DetailsStep";
import { LocationStep } from "./post-form/LocationStep";
import { PhotosStep } from "./post-form/PhotosStep";
import { StepFooter } from "./post-form/StepFooter";
import { StepHeader } from "./post-form/StepHeader";
import type { LocationMode, Option, PostFormProps, PostFormValues } from "./post-form/types";
import { fetchCategories, fetchPlaces, fetchTags } from "@/lib/api/public";

export function PostForm({ mode, initialValues, onSubmit, onCancelHref }: PostFormProps) {
  const [values, setValues] = useState<PostFormValues>(initialValues);
  const [locationMode, setLocationMode] = useState<LocationMode>("list");
  const [availableTags, setAvailableTags] = useState<string[]>(defaultTagOptions);
  const [availableCategories, setAvailableCategories] = useState<Option[]>([]);
  const [availablePlaces, setAvailablePlaces] = useState<Option[]>(defaultPlaceOptions.map((p, i) => ({ id: `p-${i}`, name: p })));
  const [addressStreet, setAddressStreet] = useState("");
  const [addressHouse, setAddressHouse] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressPostal, setAddressPostal] = useState("");
  const [lat, setLat] = useState(values.geo?.lat ? String(values.geo.lat) : "");
  const [lng, setLng] = useState(values.geo?.lng ? String(values.geo.lng) : "");
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ title?: boolean; category?: boolean; description?: boolean }>({});

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
        if (!values.placeName) {
          setValues((prev) => ({ ...prev, placeName: options[0]?.name ?? "No place" }));
        }
      }
    });
  }, [values.placeName]);

  const placeOptions = useMemo(() => availablePlaces, [availablePlaces]);

  const updateValue = <K extends keyof PostFormValues>(key: K, value: PostFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
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
      setMessage("Please fill required fields: title, category, description.");
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
    if (!validateDetails()) {
      setStep(0);
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const addressString =
        [addressStreet, addressHouse, addressCity, addressPostal].filter(Boolean).join(", ") || "";
      const finalPlace =
        locationMode === "address"
          ? addressString
          : locationMode === "map"
            ? values.placeName
            : values.placeName;
      const normalizedPlace = finalPlace && finalPlace !== "No place" ? finalPlace.trim() : "";
      const geoPayload =
        locationMode === "map" && lat && lng
          ? { lat: Number(lat), lng: Number(lng) }
          : null;

      await onSubmit({
        ...values,
        placeName: normalizedPlace,
        geo: geoPayload,
      });
      setMessage(mode === "create" ? "Post created." : "Post updated.");
    } catch (err: any) {
      setError(err?.message || "Failed to save post");
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
          onUpdate={updateValue}
          onToggleTag={toggleTag}
        />
      )}

      {step === 1 && (
        <LocationStep
          locationMode={locationMode}
          values={values}
          placeOptions={placeOptions}
          address={{ street: addressStreet, house: addressHouse, city: addressCity, postal: addressPostal }}
          lat={lat}
          lng={lng}
          onLocationModeChange={setLocationMode}
          onPlaceChange={(value) => updateValue("placeName", value)}
          onAddressChange={(field, value) => {
            if (field === "street") setAddressStreet(value);
            if (field === "house") setAddressHouse(value);
            if (field === "city") setAddressCity(value);
            if (field === "postal") setAddressPostal(value);
          }}
          onLatLngChange={(newLat, newLng) => {
            setLat(newLat);
            setLng(newLng);
          }}
          onPlaceNameChange={(value) => updateValue("placeName", value)}
        />
      )}

      {step === 2 && <PhotosStep values={values} onUpdate={updateValue} />}

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
      />
    </div>
  );
}
