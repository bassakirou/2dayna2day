'use client';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

export default function ProgressBar({ currentStep, totalSteps, labels }: ProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full">
      {/* Progress Labels */}
      {labels && labels.length > 0 && (
        <div className="flex justify-between mb-2">
          {labels.map((label, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber <= currentStep;
            const isCurrent = stepNumber === currentStep;

            return (
              <div
                key={index}
                className={`flex flex-col items-center ${
                  isActive ? 'text-primary' : 'text-gray-400'
                }`}
              >
                <span
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-1
                    ${isCurrent
                      ? 'bg-primary text-white'
                      : isActive
                      ? 'bg-primary/20 text-primary'
                      : 'bg-gray-200 text-gray-500'
                    }
                  `}
                >
                  {stepNumber}
                </span>
                <span className="text-xs hidden sm:block">{label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Progress Bar */}
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-primary transition-all duration-500 ease-out rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step Counter (Mobile) */}
      {labels && labels.length > 0 && (
        <p className="text-center text-sm text-gray-500 mt-2 sm:hidden">
          Étape {currentStep} sur {totalSteps}: {labels[currentStep - 1]}
        </p>
      )}
    </div>
  );
}

export function CheckoutProgress({ currentStep }: { currentStep: 1 | 2 | 3 | 4 }) {
  const steps = [
    { number: 1, label: 'Adresse' },
    { number: 2, label: 'Livraison' },
    { number: 3, label: 'Paiement' },
    { number: 4, label: 'Confirmation' },
  ];

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = step.number <= currentStep;
          const isCurrent = step.number === currentStep;

          return (
            <div key={step.number} className="flex items-center">
              {/* Step Circle */}
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                  transition-all duration-300
                  ${isCurrent
                    ? 'bg-primary text-white ring-4 ring-primary/20'
                    : isActive
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-500'
                  }
                `}
              >
                {isActive && step.number < currentStep ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.number
                )}
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`
                    w-6 sm:w-12 h-1 mx-2 transition-all duration-300
                    ${step.number < currentStep ? 'bg-primary' : 'bg-gray-200'}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-2">
        {steps.map((step) => (
          <span
            key={step.number}
            className={`
              text-xs font-medium
              ${step.number === currentStep ? 'text-primary' : 'text-gray-400'}
            `}
          >
            {step.label}
          </span>
        ))}
      </div>
    </div>
  );
}
