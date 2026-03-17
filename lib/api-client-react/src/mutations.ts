// useCreateStudent — wraps the register endpoint for use by supervisors/admins
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string; phone: string; password: string;
      country?: string; gender?: string; tajweedLevel?: string; supervisorId?: number;
    }) =>
      customFetch(`/api/auth/student/register`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/students"] }),
  });
}
