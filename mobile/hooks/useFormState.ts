import { useMemo, useState } from "react";

type AnyRecord = Record<string, any>;

export function useFormState<T extends AnyRecord>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues);

  const reset = () => {
    setValues(initialValues);
  };

  const patch = (next: Partial<T>) => {
    setValues((prev) => ({
      ...prev,
      ...next,
    }));
  };

  const setField = <K extends keyof T>(key: K, value: T[K]) => {
    setValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const fill = (next: T) => {
    setValues(next);
  };

  const api = useMemo(
    () => ({
      values,
      setValues,
      reset,
      patch,
      setField,
      fill,
    }),
    [values]
  );

  return api;
}
