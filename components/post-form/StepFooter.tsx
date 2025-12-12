type StepFooterProps = {
  step: 0 | 1 | 2;
  saving: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onCancelHref: string;
  mode: "create" | "edit";
  disableSubmit?: boolean;
};

export function StepFooter({ step, saving, onPrev, onNext, onSubmit, onCancelHref, mode, disableSubmit }: StepFooterProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={step === 0}
          className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition disabled:opacity-50"
        >
          Atpakaļ
        </button>
        {step < 2 && (
          <button
            type="button"
            onClick={onNext}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 transition"
          >
            Tālāk
          </button>
        )}
      </div>
      {step === 2 && (
        <div className="flex gap-2">
          <a
            href={onCancelHref}
            className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
          >
            Atcelt
          </a>
          <button
            type="button"
            onClick={onSubmit}
            disabled={saving || disableSubmit}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 transition disabled:opacity-60"
          >
            {saving ? "Saglabā..." : mode === "create" ? "Izveidot ierakstu" : "Saglabāt izmaiņas"}
          </button>
        </div>
      )}
    </div>
  );
}
