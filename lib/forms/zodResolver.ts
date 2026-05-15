import type { FieldErrors, Resolver } from "react-hook-form";
import type { z } from "zod";

function setPath(target: FieldErrors, path: (string | number)[], message: string): void {
  let current: Record<string, unknown> = target;
  path.forEach((segment, index) => {
    const key = String(segment);
    if (index === path.length - 1) current[key] = { type: "validation", message };
    else {
      current[key] ??= {};
      current = current[key] as Record<string, unknown>;
    }
  });
}

export function zodResolver<TSchema extends z.ZodType>(schema: TSchema): Resolver<z.input<TSchema>, unknown, z.output<TSchema>> {
  return async (values) => {
    const parsed = await schema.safeParseAsync(values);
    if (parsed.success) return { values: parsed.data, errors: {} };
    const errors: FieldErrors = {};
    for (const issue of parsed.error.issues) setPath(errors, issue.path, issue.message);
    return { values: {}, errors };
  };
}
