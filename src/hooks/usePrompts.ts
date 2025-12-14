import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listPrompts,
  createPrompt,
  updatePrompt,
  deletePrompt,
  usePrompt,
  Prompt,
} from "@/lib/tauri";

export function usePrompts() {
  return useQuery({
    queryKey: ["prompts"],
    queryFn: listPrompts,
  });
}

export function useCreatePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      name,
      content,
      tags,
      variables,
    }: {
      name: string;
      content: string;
      tags: string[];
      variables: string[];
    }): Promise<Prompt> => {
      return createPrompt(name, content, tags, variables);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
    },
  });
}

export function useUpdatePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      name,
      content,
      tags,
      variables,
    }: {
      id: string;
      name: string;
      content: string;
      tags: string[];
      variables: string[];
    }): Promise<Prompt> => {
      return updatePrompt(id, name, content, tags, variables);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
    },
  });
}

export function useDeletePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePrompt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
    },
  });
}

export function useUsePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usePrompt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
    },
  });
}
