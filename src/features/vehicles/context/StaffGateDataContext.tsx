"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { api } from "@/lib/api/client";
import {
  enrichCardsWithActiveSessions,
  fetchCardsBase,
} from "@/features/card/services/card.service";
import type { ParkingCard } from "@/features/card/types/card";
import { blacklistService, type BlacklistDto } from "@/features/blacklist";
import {
  fetchActiveParkingSessionDtos,
  type ActiveParkingSessionDto,
} from "../services/active-parking-session.service";
import {
  mapActiveParkingSession,
  type VehicleCheckinSession,
} from "../services/vehicle-checkin.service";
import {
  mapCheckoutSession,
  type CheckoutSession,
} from "../services/vehicle-checkout.service";

const OPERATIONAL_TTL_MS = 5_000;
const BLACKLIST_TTL_MS = 15_000;
const REFERENCE_TTL_MS = 15 * 60_000;

export type StaffGateBuilding = {
  id: number;
  name: string;
};

export type StaffGateVehicleType = {
  id?: number;
  Id?: number;
  name?: string;
  typeName?: string;
  TypeName?: string;
  [key: string]: unknown;
};

export type StaffGateDataSnapshot = {
  rawActiveSessions: ActiveParkingSessionDto[];
  checkinSessions: VehicleCheckinSession[];
  checkoutSessions: CheckoutSession[];
  cards: ParkingCard[];
  blacklist: BlacklistDto[];
  buildings: StaffGateBuilding[];
  vehicleTypes: StaffGateVehicleType[];
};

type RefreshOptions = {
  forceOperational?: boolean;
  forceBlacklist?: boolean;
  forceReference?: boolean;
};

type CacheState = StaffGateDataSnapshot & {
  operationalFetchedAt: number;
  blacklistFetchedAt: number;
  referenceFetchedAt: number;
};

type StaffGateDataContextValue = StaffGateDataSnapshot & {
  isPrefetching: boolean;
  refreshGateData: (options?: RefreshOptions) => Promise<StaffGateDataSnapshot>;
  invalidateOperationalData: () => Promise<StaffGateDataSnapshot>;
};

const EMPTY_SNAPSHOT: StaffGateDataSnapshot = {
  rawActiveSessions: [],
  checkinSessions: [],
  checkoutSessions: [],
  cards: [],
  blacklist: [],
  buildings: [],
  vehicleTypes: [],
};

const INITIAL_CACHE: CacheState = {
  ...EMPTY_SNAPSHOT,
  operationalFetchedAt: 0,
  blacklistFetchedAt: 0,
  referenceFetchedAt: 0,
};

const StaffGateDataContext = createContext<StaffGateDataContextValue | null>(null);

const unwrapItems = <T,>(response: any): T[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  return [];
};

export function StaffGateDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [snapshot, setSnapshot] = useState<StaffGateDataSnapshot>(EMPTY_SNAPSHOT);
  const [isPrefetching, setIsPrefetching] = useState(false);
  const cacheRef = useRef<CacheState>(INITIAL_CACHE);
  const inFlightRef = useRef<Promise<StaffGateDataSnapshot> | null>(null);

  const refreshGateData = useCallback(
    async (options: RefreshOptions = {}): Promise<StaffGateDataSnapshot> => {
      if (inFlightRef.current) return inFlightRef.current;

      const request = (async () => {
        const now = Date.now();
        const current = cacheRef.current;
        const needsOperational =
          options.forceOperational ||
          now - current.operationalFetchedAt >= OPERATIONAL_TTL_MS;
        const needsBlacklist =
          options.forceBlacklist ||
          now - current.blacklistFetchedAt >= BLACKLIST_TTL_MS;
        const needsReference =
          options.forceReference ||
          now - current.referenceFetchedAt >= REFERENCE_TTL_MS;

        if (!needsOperational && !needsBlacklist && !needsReference) {
          return current;
        }

        setIsPrefetching(true);

        const operationalPromise = needsOperational
          ? Promise.all([
              fetchActiveParkingSessionDtos(),
              fetchCardsBase(),
            ])
          : Promise.resolve(null);

        const blacklistPromise = needsBlacklist
          ? blacklistService.getAll(1, 1000)
          : Promise.resolve(null);

        const referencePromise = needsReference
          ? Promise.all([
              api.get<any>("/Buildings/paged?pageIndex=1&pageSize=100"),
              api.get<any>("/vehicle-types"),
            ])
          : Promise.resolve(null);

        const [operational, blacklistResult, reference] = await Promise.all([
          operationalPromise,
          blacklistPromise,
          referencePromise,
        ]);

        const next: CacheState = { ...cacheRef.current };

        if (operational) {
          const [rawActiveSessions, baseCards] = operational;
          next.rawActiveSessions = rawActiveSessions;
          next.checkinSessions = rawActiveSessions.map(mapActiveParkingSession);
          next.checkoutSessions = rawActiveSessions.map(mapCheckoutSession);
          next.cards = enrichCardsWithActiveSessions(baseCards, rawActiveSessions);
          next.operationalFetchedAt = Date.now();
        }

        if (blacklistResult) {
          next.blacklist = blacklistResult.items ?? [];
          next.blacklistFetchedAt = Date.now();
        }

        if (reference) {
          const [buildingResponse, vehicleTypeResponse] = reference;
          next.buildings = unwrapItems<any>(buildingResponse)
            .map((building) => ({
              id: Number(building.id ?? 0),
              name: String(building.name ?? ""),
            }))
            .filter((building) => building.id > 0);
          next.vehicleTypes = unwrapItems<StaffGateVehicleType>(vehicleTypeResponse);
          next.referenceFetchedAt = Date.now();
        }

        cacheRef.current = next;
        const publicSnapshot: StaffGateDataSnapshot = {
          rawActiveSessions: next.rawActiveSessions,
          checkinSessions: next.checkinSessions,
          checkoutSessions: next.checkoutSessions,
          cards: next.cards,
          blacklist: next.blacklist,
          buildings: next.buildings,
          vehicleTypes: next.vehicleTypes,
        };
        setSnapshot(publicSnapshot);
        return publicSnapshot;
      })();

      inFlightRef.current = request;
      try {
        return await request;
      } finally {
        inFlightRef.current = null;
        setIsPrefetching(false);
      }
    },
    [],
  );

  const invalidateOperationalData = useCallback(async () => {
    if (inFlightRef.current) {
      const pendingRequest = inFlightRef.current;
      try {
        await pendingRequest;
      } catch {
        // A failed prefetch must not prevent the post-mutation authoritative refresh.
      }
      if (inFlightRef.current === pendingRequest) {
        inFlightRef.current = null;
      }
    }
    cacheRef.current.operationalFetchedAt = 0;
    return refreshGateData({ forceOperational: true });
  }, [refreshGateData]);

  useEffect(() => {
    void refreshGateData();

    const handleFocus = () => {
      void refreshGateData();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refreshGateData]);

  const value = useMemo<StaffGateDataContextValue>(
    () => ({
      ...snapshot,
      isPrefetching,
      refreshGateData,
      invalidateOperationalData,
    }),
    [snapshot, isPrefetching, refreshGateData, invalidateOperationalData],
  );

  return (
    <StaffGateDataContext.Provider value={value}>
      {children}
    </StaffGateDataContext.Provider>
  );
}

export const useStaffGateData = (): StaffGateDataContextValue => {
  const context = useContext(StaffGateDataContext);
  if (!context) {
    throw new Error("useStaffGateData must be used inside StaffGateDataProvider.");
  }
  return context;
};
