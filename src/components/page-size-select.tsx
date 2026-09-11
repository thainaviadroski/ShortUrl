"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEFAULT_OPTIONS = [10, 25, 50, 100];

interface PageSizeSelectProps {
  basePath: string;
  pageSize: number;
  options?: number[];
}

export function PageSizeSelect({
  basePath,
  pageSize,
  options = DEFAULT_OPTIONS,
}: PageSizeSelectProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Rows per page</span>
      <Select
        value={String(pageSize)}
        onValueChange={(value) =>
          router.push(`${basePath}?page=1&pageSize=${value}`)
        }
      >
        <SelectTrigger size="sm" className="w-16">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={String(option)}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
