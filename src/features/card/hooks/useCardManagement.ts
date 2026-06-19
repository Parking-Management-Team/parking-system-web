'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import cardsMock from '../mock/cards.json';
import type {
  AssignMonthlySubscriptionInput,
  AssignSessionInput,
  CardOperationResult,
  CardStatus,
  CardType,
  CreateCardInput,
  ParkingCard,
} from '../types/card';

const initialCards = cardsMock as ParkingCard[];

const result = (
  success: boolean,
  message: string,
  tone: CardOperationResult['tone'] = success ? 'success' : 'error'
): CardOperationResult => ({ success, message, tone });

const getAssignmentError = (card: ParkingCard): CardOperationResult | null => {
  if (card.cardStatus === 'LOST') {
    return result(false, 'Lost cards cannot be assigned.');
  }

  if (card.cardStatus === 'INACTIVE') {
    return result(false, 'Inactive cards cannot be assigned.');
  }

  if (card.cardStatus === 'ASSIGNED') {
    return result(false, 'This card is already assigned. Release it first.');
  }

  return null;
};

export function useCardManagement() {
  const [cards, setCards] = useState<ParkingCard[]>([]);
  const [searchCode, setSearchCode] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | CardType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CardStatus>('ALL');

  const fetchCards = useCallback(async () => {
    // TODO: Replace with API call
    setCards(initialCards.map((card) => ({ ...card })));
  }, []);

  useEffect(() => {
    void fetchCards();
  }, [fetchCards]);

  const filteredCards = useMemo(() => {
    const search = searchCode.trim().toUpperCase();

    return cards.filter((card) => {
      const matchesCode = card.cardCode.toUpperCase().includes(search);
      const matchesType = typeFilter === 'ALL' || card.cardType === typeFilter;
      const matchesStatus =
        statusFilter === 'ALL' || card.cardStatus === statusFilter;

      return matchesCode && matchesType && matchesStatus;
    });
  }, [cards, searchCode, statusFilter, typeFilter]);

  const createCard = (input: CreateCardInput): CardOperationResult => {
    // TODO: Replace with API call
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

    const newCard: ParkingCard = {
      id: Date.now(),
      cardCode,
      cardType: input.cardType,
      cardStatus: 'AVAILABLE',
      currentSessionId: null,
      monthlySubscriptionId: null,
      subscriptionCode: null,
      vehiclePlate: null,
      validFrom: null,
      validTo: null,
      createdAt: new Date().toISOString(),
    };

    setCards((current) => [newCard, ...current]);
    return result(true, `${cardCode} was created as an available card.`);
  };

  const updateCardStatus = (
    cardId: number,
    nextStatus: 'AVAILABLE' | 'INACTIVE'
  ): CardOperationResult => {
    // TODO: Replace with API call
    const card = cards.find((item) => item.id === cardId);

    if (!card) return result(false, 'Card not found.');

    if (card.cardStatus === 'LOST') {
      return result(false, 'Lost cards require incident handling to change status.');
    }

    if (card.cardStatus === 'ASSIGNED') {
      return result(false, 'Release the assigned card before changing its status.');
    }

    setCards((current) =>
      current.map((item) =>
        item.id === cardId ? { ...item, cardStatus: nextStatus } : item
      )
    );

    return result(
      true,
      `${card.cardCode} is now ${
        nextStatus === 'AVAILABLE' ? 'active and available' : 'inactive'
      }.`
    );
  };

  const assignCardToSession = (
    cardId: number,
    input: AssignSessionInput
  ): CardOperationResult => {
    // TODO: Replace with API call
    const card = cards.find((item) => item.id === cardId);

    if (!card) return result(false, 'Card not found.');

    const assignmentError = getAssignmentError(card);
    if (assignmentError) return assignmentError;

    if (card.cardType !== 'NORMAL') {
      return result(false, 'Only NORMAL cards can be assigned to a parking session.');
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
    // TODO: Replace with API call
    const card = cards.find((item) => item.id === cardId);

    if (!card) return result(false, 'Card not found.');

    const assignmentError = getAssignmentError(card);
    if (assignmentError) return assignmentError;

    if (card.cardType !== 'MONTHLY') {
      return result(
        false,
        'Only MONTHLY cards can be assigned to a monthly subscription.'
      );
    }

    const subscriptionCode = input.subscriptionCode?.trim().toUpperCase();
    const hasSubscriptionId =
      Number.isInteger(input.monthlySubscriptionId) &&
      Number(input.monthlySubscriptionId) > 0;

    if (!hasSubscriptionId && !subscriptionCode) {
      return result(
        false,
        'MONTHLY card requires monthlySubscriptionId or subscriptionCode.'
      );
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
    // TODO: Replace with API call
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

  const markCardLost = (cardId: number): CardOperationResult => {
    // TODO: Replace with API call
    const card = cards.find((item) => item.id === cardId);

    if (!card) return result(false, 'Card not found.');
    if (card.cardStatus === 'LOST') return result(false, 'Card is already marked as lost.');

    setCards((current) =>
      current.map((item) =>
        item.id === cardId ? { ...item, cardStatus: 'LOST' } : item
      )
    );

    if (card.cardStatus === 'ASSIGNED') {
      return result(
        true,
        'Lost card requires incident handling before releasing.',
        'warning'
      );
    }

    return result(true, `${card.cardCode} was marked as lost.`, 'warning');
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
