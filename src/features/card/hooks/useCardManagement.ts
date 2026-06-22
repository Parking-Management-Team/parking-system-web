'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createCard as createCardFromApi,
  fetchCards as fetchCardsFromApi,
  markCardLost as markCardLostFromApi,
  updateCardStatus as updateCardStatusFromApi,
} from '../services/card.service';
import type {
  AssignMonthlySubscriptionInput,
  AssignSessionInput,
  CardOperationResult,
  CardStatus,
  CardType,
  CreateCardInput,
  ParkingCard,
  UpdatableCardStatus,
} from '../types/card';

const result = (
  success: boolean,
  message: string,
  tone: CardOperationResult['tone'] = success ? 'success' : 'error'
): CardOperationResult => ({ success, message, tone });

const getAssignmentError = (card: ParkingCard): CardOperationResult | null => {
  if (card.cardStatus === 'LOST') {
    return result(false, 'Lost cards cannot be assigned.');
  }

  if (card.cardStatus === 'BLOCKED') {
    return result(false, 'Blocked cards cannot be assigned.');
  }

  if (card.cardStatus === 'ASSIGNED' || card.cardStatus === 'ACTIVE') {
    return result(false, 'This card is already assigned. Release it first.');
  }

  return null;
};

export function useCardManagement() {
  const [cards, setCards] = useState<ParkingCard[]>([]);
  const [searchCode, setSearchCode] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | CardType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CardStatus>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const apiCards = await fetchCardsFromApi();
      setCards(apiCards);
    } catch (error) {
      setCards([]);
      setLoadError(
        error instanceof Error ? error.message : 'Could not load parking cards.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCards();
  }, [fetchCards]);

  const filteredCards = useMemo(() => {
    const search = searchCode.trim().toUpperCase();

    return cards.filter((card) => {
      const matchesSearch =
        card.cardCode.toUpperCase().includes(search) ||
        (card.vehiclePlate?.toUpperCase().includes(search) ?? false);

      const matchesType = typeFilter === 'ALL' || card.cardType === typeFilter;
      const matchesStatus =
        statusFilter === 'ALL' || card.cardStatus === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [cards, searchCode, statusFilter, typeFilter]);

  const createCard = async (
    input: CreateCardInput
  ): Promise<CardOperationResult> => {
    const cardCode = input.cardCode.trim().toUpperCase();

    if (!cardCode) {
      return result(false, 'Card code is required.');
    }

    const isDuplicate = cards.some(
      (card) => card.cardCode.toUpperCase() === cardCode
    );

    if (isDuplicate) {
      return result(false, 'Card code must be unique.');
    }

    try {
      await createCardFromApi({ ...input, cardCode });
      await fetchCards();
      return result(true, `${cardCode} was created as an available card.`);
    } catch (error) {
      return result(
        false,
        error instanceof Error ? error.message : 'Could not create card.'
      );
    }
  };

  const updateCardStatus = async (
    cardId: number,
    nextStatus: UpdatableCardStatus
  ): Promise<CardOperationResult> => {
    const card = cards.find((item) => item.id === cardId);

    if (!card) return result(false, 'Card not found.');

    if (card.cardStatus === 'LOST') {
      return result(false, 'Lost cards require incident handling to change status.');
    }

    if (card.cardStatus === 'ASSIGNED' || card.cardStatus === 'ACTIVE') {
      return result(false, 'Release the assigned card before changing its status.');
    }

    try {
      await updateCardStatusFromApi(cardId, nextStatus);
      await fetchCards();

      return result(
        true,
        `${card.cardCode} is now ${
          nextStatus === 'AVAILABLE'
            ? 'available'
            : nextStatus === 'BLOCKED'
              ? 'blocked'
              : 'lost'
        }.`
      );
    } catch (error) {
      return result(
        false,
        error instanceof Error ? error.message : 'Could not update card status.'
      );
    }
  };

  const markCardLost = async (
    cardId: number
  ): Promise<CardOperationResult> => {
    const card = cards.find((item) => item.id === cardId);

    if (!card) return result(false, 'Card not found.');
    if (card.cardStatus === 'LOST') {
      return result(false, 'Card is already marked as lost.');
    }

    try {
      await markCardLostFromApi(cardId);
      await fetchCards();

      if (card.cardStatus === 'ASSIGNED' || card.cardStatus === 'ACTIVE') {
        return result(
          true,
          'Lost card requires incident handling before releasing.',
          'warning'
        );
      }

      return result(true, `${card.cardCode} was marked as lost.`, 'warning');
    } catch (error) {
      return result(
        false,
        error instanceof Error ? error.message : 'Could not mark card as lost.'
      );
    }
  };

  const assignCardToSession = (
    cardId: number,
    input: AssignSessionInput
  ): CardOperationResult => {
    const card = cards.find((item) => item.id === cardId);

    if (!card) return result(false, 'Card not found.');

    const assignmentError = getAssignmentError(card);
    if (assignmentError) return assignmentError;

    if (card.cardType !== 'PARKING_CARD') {
      return result(false, 'Only PARKING_CARD cards can be assigned to a parking session.');
    }

    if (!Number.isInteger(input.currentSessionId) || input.currentSessionId <= 0) {
      return result(false, 'A valid parking session ID is required.');
    }

    setCards((current) =>
      current.map((item) =>
        item.id === cardId
          ? {
              ...item,
              cardStatus: 'ASSIGNED',
              currentSessionId: input.currentSessionId,
              vehiclePlate: input.vehiclePlate?.trim().toUpperCase() || null,
            }
          : item
      )
    );

    return result(true, `${card.cardCode} was assigned to session ${input.currentSessionId}.`);
  };

  const assignCardToMonthlySubscription = (
    cardId: number,
    input: AssignMonthlySubscriptionInput
  ): CardOperationResult => {
    const card = cards.find((item) => item.id === cardId);

    if (!card) return result(false, 'Card not found.');

    const assignmentError = getAssignmentError(card);
    if (assignmentError) return assignmentError;

    if (card.cardType !== 'MONTHLY') {
      return result(false, 'Only MONTHLY cards can be assigned to a monthly subscription.');
    }

    const subscriptionCode = input.subscriptionCode?.trim().toUpperCase();
    const hasSubscriptionId =
      Number.isInteger(input.monthlySubscriptionId) &&
      Number(input.monthlySubscriptionId) > 0;

    if (!hasSubscriptionId && !subscriptionCode) {
      return result(false, 'MONTHLY card requires monthlySubscriptionId or subscriptionCode.');
    }

    if (input.validFrom && input.validTo && input.validFrom >= input.validTo) {
      return result(false, 'Valid To must be after Valid From.');
    }

    setCards((current) =>
      current.map((item) =>
        item.id === cardId
          ? {
              ...item,
              cardStatus: 'ASSIGNED',
              monthlySubscriptionId: hasSubscriptionId
                ? Number(input.monthlySubscriptionId)
                : null,
              subscriptionCode: subscriptionCode || null,
              vehiclePlate: input.vehiclePlate?.trim().toUpperCase() || null,
              validFrom: input.validFrom || null,
              validTo: input.validTo || null,
            }
          : item
      )
    );

    return result(true, `${card.cardCode} was assigned to a monthly subscription.`);
  };

  const releaseCard = (cardId: number): CardOperationResult => {
    const card = cards.find((item) => item.id === cardId);

    if (!card) return result(false, 'Card not found.');

    const hasAssignment = Boolean(
      card.currentSessionId ||
        card.monthlySubscriptionId ||
        card.subscriptionCode
    );

    if (card.cardStatus === 'LOST' && hasAssignment) {
      return result(
        false,
        'Lost card requires incident handling before releasing.',
        'warning'
      );
    }

    if (card.cardStatus !== 'ASSIGNED') {
      return result(false, 'Only an assigned card can be released.');
    }

    setCards((current) =>
      current.map((item) =>
        item.id === cardId
          ? {
              ...item,
              cardStatus: 'AVAILABLE',
              currentSessionId: null,
              monthlySubscriptionId: null,
              subscriptionCode: null,
              vehiclePlate: null,
              validFrom: null,
              validTo: null,
            }
          : item
      )
    );

    return result(true, `${card.cardCode} was released and is now available.`);
  };

  return {
    cards,
    filteredCards,
    searchCode,
    setSearchCode,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    isLoading,
    loadError,
    fetchCards,
    createCard,
    updateCardStatus,
    assignCardToSession,
    assignCardToMonthlySubscription,
    releaseCard,
    markCardLost,
  };
}

export type UseCardManagementResult = ReturnType<typeof useCardManagement>;

