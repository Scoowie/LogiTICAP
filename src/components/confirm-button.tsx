"use client";

export function ConfirmButton({
  children,
  message,
  name,
  value,
  className,
}: {
  children: React.ReactNode;
  message: string;
  name?: string;
  value?: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      name={name}
      value={value}
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
