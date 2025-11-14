import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type FilterDropdownProps = {
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
  contentClassName?: string;
};

export function FilterDropdown({
  label,
  children,
  disabled,
  contentClassName,
}: FilterDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" size="sm" variant="outline" disabled={disabled}>
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className={cn("w-64", contentClassName)}
        align="start"
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
