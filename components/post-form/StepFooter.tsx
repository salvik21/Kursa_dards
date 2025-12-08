type StepFooterProps = {
  step: 0 | 1 | 2;
  saving: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onCancelHref: string;
  mode: "create" | "edit";
};

export function StepFooter({ step, saving, onPrev, onNext, onSubmit, onCancelHref, mode }: StepFooterProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={step === 0}
          className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition disabled:opacity-50"
        >
          Previous
        </button>
        {step < 2 && (
          <button
            type="button"
            onClick={onNext}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 transition"
          >
            Next
          </button>
        )}
      </div>
      {step === 2 && (
        <div className="flex gap-2">
          <a
            href={onCancelHref}
            className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
          >
            Cancel
          </a>
          <button
            type="button"
            onClick={onSubmit}
            disabled={saving}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 transition disabled:opacity-60"
          >
            {saving ? "Saving..." : mode === "create" ? "Create post" : "Save changes"}
          </button>
        </div>
      )}
    </div>
  );
}
