type StepHeaderProps = {
  step: 0 | 1 | 2;
};

export function StepHeader({ step }: StepHeaderProps) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
      <span className={step === 0 ? "text-blue-600" : "text-gray-500"}>1. Informacija</span>
      <span className="text-gray-300">/</span>
      <span className={step === 1 ? "text-blue-600" : "text-gray-500"}>2. Atrasanas vieta</span>
      <span className="text-gray-300">/</span>
      <span className={step === 2 ? "text-blue-600" : "text-gray-500"}>3. Foto</span>
    </div>
  );
}
