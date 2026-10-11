import Image from "next/image";

interface PhoneNumberProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  className?: string;
  placeholder?: string;
  required?: boolean;
  name?: string;
}

export default function PhoneNumber({
  value,
  onChange,
  error,
  className = "",
  placeholder = "6XX XXX XXX",
  required = false,
  name,
}: PhoneNumberProps) {
  return (
    <div
      className={`flex items-center border rounded-lg overflow-hidden transition-colors bg-white ${
        error
          ? "border-red-500 focus-within:ring-2 focus-within:ring-red-500 focus-within:border-transparent"
          : "border-gray-200 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent"
      } ${className}`}
    >
      <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 border-r border-gray-200 h-full">
        <div className="relative w-5 h-3.5 flex-shrink-0 shadow-sm overflow-hidden rounded-[2px]">
          <Image
            src="/images/flags/cm.svg"
            alt="Cameroun"
            fill
            className="object-cover"
          />
        </div>
        <span className="text-gray-600 font-medium text-sm">+237</span>
      </div>
      <input
        type="tel"
        name={name}
        value={value}
        onChange={(e) => {
          // Ne conserver que les chiffres et limiter à 9
          const val = e.target.value.replace(/\D/g, "").slice(0, 9);
          onChange(val);
        }}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2 outline-none bg-transparent"
      />
    </div>
  );
}
