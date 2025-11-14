import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FilterChipProps = {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
};

export function FilterChip({
  label,
  active = false,
  onClick,
  className,
  disabled,
}: FilterChipProps) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      size="sm"
      aria-pressed={active}
      onClick={onClick}
      className={cn("capitalize", className)}
      disabled={disabled}
    >
      {label}
    </Button>
  );
}
