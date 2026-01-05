import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PostForm } from "../PostForm";

// PostForm atkaribu moki (marsrutetajs un API).
const mockFetchTags = jest.fn();
const mockFetchCategories = jest.fn();
const mockFetchPlaces = jest.fn();

// Marsrutetaja mocks ir vajadzigs Next.js navigacijai.
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));
// API moki atgriez sagatavotus datus par tagiem, kategorijam un vietam.
jest.mock("@/lib/api/public", () => ({
  fetchTags: (...args: any[]) => mockFetchTags(...args),
  fetchCategories: (...args: any[]) => mockFetchCategories(...args),
  fetchPlaces: (...args: any[]) => mockFetchPlaces(...args),
}));
// Stabilas konstantas, lai formas logika butu noteikta.
jest.mock("../post-form/constants", () => ({ defaultTagOptions: [], defaultPlaceOptions: ["Nav vietas", "Riga Center"] }));
// Minimala apakskomponentu renderesana, lai testetu logiku.
jest.mock("../post-form/StepHeader", () => ({ StepHeader: () => <div /> }));
jest.mock("../post-form/DetailsStep", () => ({
  DetailsStep: ({ onUpdate }: any) => (
    <div>
      <button onClick={() => onUpdate("title", "")}>clear-title</button>
      <button onClick={() => onUpdate("category", "")}>clear-category</button>
      <button onClick={() => onUpdate("description", "")}>clear-description</button>
    </div>
  ),
}));
jest.mock("../post-form/PhotosStep", () => ({ PhotosStep: () => <div /> }));
// StepFooter nodrosina pogas navigacijai un iesniegsanai.
jest.mock("../post-form/StepFooter", () => ({
  StepFooter: ({ onPrev, onNext, onSubmit }: any) => (
    <div>
      <button onClick={onPrev}>prev</button>
      <button onClick={onNext}>next</button>
      <button onClick={onSubmit}>submit</button>
    </div>
  ),
}));
// LocationStep nodrosina tikai notikumus, ko izmanto testi.
jest.mock("../post-form/LocationStep", () => ({
  LocationStep: ({ onLocationModeChange, onAddressChange, onLatLngChange, onPlaceChange }: any) => (
    <div>
      <button onClick={() => onLocationModeChange("address")}>mode-address</button>
      <button onClick={() => onLocationModeChange("map")}>mode-map</button>
      <button onClick={() => onLatLngChange("56.95", "24.11")}>set-coords</button>
      <button onClick={() => onPlaceChange("Riga Center")}>pick-place</button>
      <button
        onClick={() => {
          onAddressChange("street", "Main St 1");
          onAddressChange("city", "Riga");
          onAddressChange("country", "Latvia");
        }}
      >
        set-address
      </button>
    </div>
  ),
}));

const filledValues = {
  title: "Test",
  type: "lost" as const,
  category: "cat-1",
  placeName: "Nav vietas",
  description: "desc",
  tags: [],
  photos: [],
  hiddenPhotos: [],
  hidePhotos: false,
  geo: null,
  showEmail: true,
  showPhone: false,
  privateNote: "",
};

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

const createDeferred = <T,>(): Deferred<T> => {
  let resolve: (value: T) => void;
  let reject: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve: resolve!, reject: reject! };
};

let tagsDeferred: Deferred<string[]>;
let categoriesDeferred: Deferred<any[]>;
let placesDeferred: Deferred<any[]>;
let profileDeferred: Deferred<{ ok: boolean; json: () => Promise<any> }>;

beforeEach(() => {
  // Vispareja datu un fetch atbilzu sagatavosana visiem testiem.
  tagsDeferred = createDeferred<string[]>();
  categoriesDeferred = createDeferred<any[]>();
  placesDeferred = createDeferred<any[]>();
  profileDeferred = createDeferred<{ ok: boolean; json: () => Promise<any> }>();

  mockFetchTags.mockReturnValue(tagsDeferred.promise);
  mockFetchCategories.mockReturnValue(categoriesDeferred.promise);
  mockFetchPlaces.mockReturnValue(placesDeferred.promise);
  (global as any).fetch = jest.fn().mockImplementation((input: any) => {
    const url = typeof input === "string" ? input : input?.url;
    if (url === "/api/me") {
      return profileDeferred.promise;
    }
    if (url === "/api/geocode") {
      return Promise.resolve({ ok: true, json: async () => ({ ok: true, lat: 56.95, lng: 24.11 }) });
    }
    return Promise.resolve({ ok: false, json: async () => ({}) });
  });
});

const waitForInit = async () => {
  await waitFor(() => expect(mockFetchTags).toHaveBeenCalled());
  await waitFor(() => expect(mockFetchCategories).toHaveBeenCalled());
  await waitFor(() => expect(mockFetchPlaces).toHaveBeenCalled());
  await waitFor(() => expect((global as any).fetch).toHaveBeenCalled());
  await act(async () => {
    tagsDeferred.resolve([]);
    categoriesDeferred.resolve([]);
    placesDeferred.resolve([{ id: "p1", name: "Riga Center", lat: 56.95, lng: 24.11 }]);
    profileDeferred.resolve({ ok: true, json: async () => ({ user: { email: "", phone: "" } }) });
  });
};

// Paligs solis, lai pabeigtu asinhronos state atjauninajumus.
const flushPromises = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

// Paligs formas renderesanai un piekuvei onSubmit.
const renderForm = async (onSubmit = jest.fn().mockResolvedValue(undefined)) => {
  await act(async () => {
    render(<PostForm mode="create" initialValues={filledValues} onSubmit={onSubmit} onCancelHref="/me" />);
  });
  await waitForInit();
  await flushPromises();
  return onSubmit;
};

const click = async (user: ReturnType<typeof userEvent.setup>, text: string) => {
  await act(async () => {
    await user.click(screen.getByText(text));
  });
};

describe("PostForm", () => {
  it("geokode adresi un iesniedz datus adreses rezima", async () => {
    const user = userEvent.setup();
    const submitDeferred = createDeferred<void>();
    const onSubmit = await renderForm(jest.fn().mockReturnValue(submitDeferred.promise));
    await click(user, "next");
    await click(user, "mode-address");
    await click(user, "set-address");
    await click(user, "submit");
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    await act(async () => {
      submitDeferred.resolve(undefined);
    });
    await flushPromises();
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ placeName: "adrese", geo: { lat: 56.95, lng: 24.11 } }));
  });

  it("neiesniedz, ja kartes rezima trukst koordinasu", async () => {
    const user = userEvent.setup();
    const onSubmit = await renderForm();
    await click(user, "next");
    await click(user, "mode-map");
    await click(user, "submit");
    await flushPromises();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("iesniedz datus kartes rezima, ja ir koordinatas", async () => {
    const user = userEvent.setup();
    const onSubmit = await renderForm();
    await click(user, "next");
    await click(user, "mode-map");
    await click(user, "set-coords");
    await click(user, "submit");
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ placeName: "koordinatas", geo: { lat: 56.95, lng: 24.11 } })
    );
  });

  it("iesniedz datus vietas saraksta rezima ar koordinatam", async () => {
    const user = userEvent.setup();
    const onSubmit = await renderForm();
    await click(user, "next");
    await click(user, "pick-place");
    await click(user, "submit");
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ placeName: "Riga Center", geo: { lat: 56.95, lng: 24.11 } })
    );
  });

  it("neatlaauj pariet talak, ja trukst obligatie lauki", async () => {
    const user = userEvent.setup();
    const onSubmit = await renderForm();
    await click(user, "clear-title");
    await click(user, "next");
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Ludzu, aizpildiet obligatos laukus: virsraksts, kategorija, apraksts.")).toBeTruthy();
  });
});
