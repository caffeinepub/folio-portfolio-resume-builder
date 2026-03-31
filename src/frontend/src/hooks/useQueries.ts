import type { PortfolioDTO, PortfolioInput, UserProfile } from "@/backend";
import { useActor } from "@/hooks/useActor";
import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useMyPortfolio() {
  const { actor, isFetching } = useActor();
  return useQuery<PortfolioDTO | null>({
    queryKey: ["myPortfolio"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMyPortfolio();
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePortfolio(principal: Principal | null) {
  const { actor, isFetching } = useActor();
  return useQuery<PortfolioDTO | null>({
    queryKey: ["portfolio", principal?.toString()],
    queryFn: async () => {
      if (!actor || !principal) return null;
      try {
        return await actor.getPortfolio(principal);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function usePublishedPortfolios() {
  const { actor, isFetching } = useActor();
  return useQuery<PortfolioDTO[]>({
    queryKey: ["publishedPortfolios"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPublishedPortfolios();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCallerUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["callerProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSavePortfolio() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PortfolioInput) => {
      if (!actor) throw new Error("Not connected");
      return actor.savePortfolio(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myPortfolio"] });
    },
  });
}

export function useSetPublished() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (isPublished: boolean) => {
      if (!actor) throw new Error("Not connected");
      return actor.setPublished(isPublished);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myPortfolio"] });
    },
  });
}

export function useUpgradeToPro() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return actor.upgradeToPro();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myPortfolio"] });
    },
  });
}

export function useSaveUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: (_, profile) => {
      // Immediately set cache to prevent modal from reopening before refetch
      queryClient.setQueryData(["callerProfile"], profile);
    },
  });
}
