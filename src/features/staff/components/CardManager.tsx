'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useCardManagement } from '../hooks/useCardManagement';
import type {
  CardOperationResult,
  CardStatus,
  CardType,
  ParkingCard,
} from '../types/card';

type ModalMode = 'create' | 'assign-session' | 'assign-monthly' | null;

const statusClassNames: Record<CardStatus, string> = {
  AVAILABLE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ASSIGNED: 'bg-blue-50 text-blue-700 border-blue-200',
  INACTIVE: 'bg-slate-100 text-slate-600 border-slate-200',
  LOST: 'bg-red-50 text-red-700 border-red-200',
};

const typeClassNames: Record<CardType, string> = {
  NORMAL: 'bg-violet-50 text-violet-700 border-violet-200',
  MONTHLY: 'bg-amber-50 text-amber-700 border-amber-200',
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

const ActionButton = ({
  children,
  onClick,
  tone = 'default',
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: 'default' | 'primary' | 'danger' | 'warning';
}) => {
  const toneClass = {
    default: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    primary: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    danger: 'bg-red-50 text-red-700 hover:bg-red-100',
    warning: 'bg-amber-50 text-amber-700 hover:bg-amber-100',
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap px-3 py-2 rounded-lg text-xs font-bold transition-colors ${toneClass}`}
    >
      {children}
    </button>
  );
};

export default function CardManager() {
  const {
    cards,
    filteredCards,
    searchCode,
    setSearchCode,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    createCard,
    updateCardStatus,
    assignCardToSession,
    assignCardToMonthlySubscription,
    releaseCard,
    markCardLost,
  } = useCardManagement();

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedCard, setSelectedCard] = useState<ParkingCard | null>(null);
  const [feedback, setFeedback] = useState<CardOperationResult | null>(null);

  const [newCardCode, setNewCardCode] = useState('');
  const [newCardType, setNewCardType] = useState<CardType>('NORMAL');
  const [sessionId, setSessionId] = useState('');
  const [monthlySubscriptionId, setMonthlySubscriptionId] = useState('');
  const [subscriptionCode, setSubscriptionCode] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');

  const statusCounts = useMemo(
    () =>
      cards.reduce<Record<CardStatus, number>>(
        (counts, card) => ({
          ...counts,
          [card.cardStatus]: counts[card.cardStatus] + 1,
        }),
        { AVAILABLE: 0, ASSIGNED: 0, INACTIVE: 0, LOST: 0 }
      ),
    [cards]
  );

  const closeModal = () => {
    setModalMode(null);
    setSelectedCard(null);
    setNewCardCode('');
    setNewCardType('NORMAL');
    setSessionId('');
    setMonthlySubscriptionId('');
    setSubscriptionCode('');
    setVehiclePlate('');
    setValidFrom('');
    setValidTo('');
  };

  const showResult = (operationResult: CardOperationResult) => {
    setFeedback(operationResult);
    if (operationResult.success) closeModal();
  };

  const openAssignment = (card: ParkingCard) => {
    setSelectedCard(card);
    setModalMode(
      card.cardType === 'NORMAL' ? 'assign-session' : 'assign-monthly'
    );
  };

  const handleCreateCard = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    showResult(createCard({ cardCode: newCardCode, cardType: newCardType }));
  };

  const handleAssign = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCard) return;

    if (modalMode === 'assign-session') {
      showResult(
        assignCardToSession(selectedCard.id, {
          currentSessionId: Number(sessionId),
          vehiclePlate,
        })
      );
      return;
    }

    showResult(
      assignCardToMonthlySubscription(selectedCard.id, {
        monthlySubscriptionId: monthlySubscriptionId
          ? Number(monthlySubscriptionId)
          : undefined,
        subscriptionCode,
        vehiclePlate,
        validFrom,
        validTo,
      })
    );
  };

  const handleMarkLost = (card: ParkingCard) => {
    const confirmed = window.confirm(
      `Mark ${card.cardCode} as LOST? This action must remain in card history.`
    );
    if (confirmed) showResult(markCardLost(card.id));
  };

  const feedbackClass =
    feedback?.tone === 'warning'
      ? 'bg-amber-50 text-amber-800 border-amber-200'
      : feedback?.tone === 'error'
        ? 'bg-red-50 text-red-700 border-red-200'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200';

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Card Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage operational cards without deleting audit or assignment history.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalMode('create')}
          className="px-5 py-3 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">add_card</span>
          Create Card
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {(Object.keys(statusCounts) as CardStatus[]).map((status) => (
          <div
            key={status}
            className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm"
          >
            <p className="text-xs font-bold text-slate-400 tracking-wider">
              {status}
            </p>
            <p className="text-3xl font-black text-slate-800 mt-2">
              {statusCounts[status]}
            </p>
          </div>
        ))}
      </div>

      {feedback && (
        <div
          role="status"
          className={`border rounded-xl px-4 py-3 flex items-start justify-between gap-4 ${feedbackClass}`}
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-xl">
              {feedback.tone === 'warning'
                ? 'warning'
                : feedback.tone === 'error'
                  ? 'error'
                  : 'check_circle'}
            </span>
            <p className="text-sm font-bold">{feedback.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            aria-label="Dismiss message"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              search
            </span>
            <input
              type="search"
              value={searchCode}
              onChange={(event) => setSearchCode(event.target.value)}
              placeholder="Search cardCode..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value as 'ALL' | CardType)
            }
            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700"
          >
            <option value="ALL">All card types</option>
            <option value="NORMAL">NORMAL</option>
            <option value="MONTHLY">MONTHLY</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as 'ALL' | CardStatus)
            }
            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700"
          >
            <option value="ALL">All card statuses</option>
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="LOST">LOST</option>
          </select>
        </div>

        <div className="space-y-3">
          {filteredCards.map((card) => {
            const hasAssignment = Boolean(
              card.currentSessionId ||
                card.monthlySubscriptionId ||
                card.subscriptionCode
            );

            const detailItems = [
              {
                label: 'Session ID',
                value: card.currentSessionId ?? '—',
              },
              {
                label: 'Subscription ID',
                value: card.monthlySubscriptionId ?? '—',
              },
              {
                label: 'Subscription Code',
                value: card.subscriptionCode ?? '—',
              },
              {
                label: 'Vehicle Plate',
                value: card.vehiclePlate ?? '—',
              },
              { label: 'Valid From', value: card.validFrom ?? '—' },
              { label: 'Valid To', value: card.validTo ?? '—' },
              { label: 'Created At', value: formatDateTime(card.createdAt) },
            ];

            return (
              <article
                key={card.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-emerald-200 hover:shadow-md transition-all"
              >
                <div className="grid grid-cols-1 xl:grid-cols-[210px_minmax(0,1fr)_260px] gap-5 xl:items-center">
                  <div className="xl:border-r xl:border-slate-100 xl:pr-5">
                    <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-3">
                      <span className="material-symbols-outlined">contactless</span>
                    </div>
                    <p className="font-mono font-black text-slate-800 text-base">
                      {card.cardCode}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full border text-[11px] font-bold ${typeClassNames[card.cardType]}`}
                      >
                        {card.cardType}
                      </span>
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full border text-[11px] font-bold ${statusClassNames[card.cardStatus]}`}
                      >
                        {card.cardStatus}
                      </span>
                    </div>
                  </div>

                  <dl className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4 gap-x-5 gap-y-4 min-w-0">
                    {detailItems.map((item) => (
                      <div key={item.label} className="min-w-0">
                        <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {item.label}
                        </dt>
                        <dd
                          className={`mt-1 text-sm truncate ${
                            item.label === 'Vehicle Plate'
                              ? 'font-bold text-slate-800'
                              : item.label === 'Subscription Code'
                                ? 'font-mono text-slate-700'
                                : 'font-medium text-slate-600'
                          }`}
                          title={String(item.value)}
                        >
                          {item.value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <div className="xl:border-l xl:border-slate-100 xl:pl-5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Actions
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {card.cardStatus === 'INACTIVE' && (
                        <ActionButton
                          tone="primary"
                          onClick={() =>
                            showResult(updateCardStatus(card.id, 'AVAILABLE'))
                          }
                        >
                          Activate
                        </ActionButton>
                      )}

                      {card.cardStatus === 'AVAILABLE' && (
                        <>
                          <ActionButton
                            onClick={() =>
                              showResult(updateCardStatus(card.id, 'INACTIVE'))
                            }
                          >
                            Deactivate
                          </ActionButton>
                          <ActionButton
                            tone="primary"
                            onClick={() => openAssignment(card)}
                          >
                            {card.cardType === 'NORMAL'
                              ? 'Assign Session'
                              : 'Assign Monthly'}
                          </ActionButton>
                        </>
                      )}

                      {card.cardStatus !== 'LOST' && (
                        <ActionButton
                          tone="danger"
                          onClick={() => handleMarkLost(card)}
                        >
                          Mark Lost
                        </ActionButton>
                      )}

                      {(card.cardStatus === 'ASSIGNED' || hasAssignment) && (
                        <ActionButton
                          tone={card.cardStatus === 'LOST' ? 'warning' : 'default'}
                          onClick={() => showResult(releaseCard(card.id))}
                        >
                          Release Card
                        </ActionButton>
                      )}

                      {card.cardStatus === 'LOST' && !hasAssignment && (
                        <span className="text-xs font-semibold text-red-500 py-2">
                          Incident handling required
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          {filteredCards.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-14 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300">
                credit_card_off
              </span>
              <p className="text-sm text-slate-400 mt-2">
                No cards match the current search and filters.
              </p>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-400">
          Cards cannot be deleted. PBMS retains card records for audit and history.
        </p>
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-slate-100 p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {modalMode === 'create'
                    ? 'Create Card'
                    : modalMode === 'assign-session'
                      ? 'Assign to Parking Session'
                      : 'Assign to Monthly Subscription'}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {selectedCard
                    ? `${selectedCard.cardCode} · ${selectedCard.cardType}`
                    : 'New cards start with AVAILABLE status.'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Close modal"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {modalMode === 'create' ? (
              <form onSubmit={handleCreateCard} className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Card Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCardCode}
                    onChange={(event) => setNewCardCode(event.target.value)}
                    placeholder="CARD-000006"
                    className="w-full mt-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Card Type
                  </label>
                  <select
                    value={newCardType}
                    onChange={(event) =>
                      setNewCardType(event.target.value as CardType)
                    }
                    className="w-full mt-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="MONTHLY">MONTHLY</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600"
                >
                  Create Available Card
                </button>
              </form>
            ) : (
              <form onSubmit={handleAssign} className="space-y-5">
                {modalMode === 'assign-session' ? (
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">
                      Current Session ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={sessionId}
                      onChange={(event) => setSessionId(event.target.value)}
                      placeholder="101"
                      className="w-full mt-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">
                        Monthly Subscription ID
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={monthlySubscriptionId}
                        onChange={(event) =>
                          setMonthlySubscriptionId(event.target.value)
                        }
                        placeholder="20"
                        className="w-full mt-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">
                        Subscription Code
                      </label>
                      <input
                        type="text"
                        value={subscriptionCode}
                        onChange={(event) => setSubscriptionCode(event.target.value)}
                        placeholder="SUB-000020"
                        className="w-full mt-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase"
                      />
                      <p className="text-xs text-slate-400 mt-2">
                        Monthly Subscription ID or Subscription Code is required.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">
                          Valid From
                        </label>
                        <input
                          type="date"
                          value={validFrom}
                          onChange={(event) => setValidFrom(event.target.value)}
                          className="w-full mt-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">
                          Valid To
                        </label>
                        <input
                          type="date"
                          value={validTo}
                          onChange={(event) => setValidTo(event.target.value)}
                          className="w-full mt-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Vehicle Plate
                  </label>
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={(event) => setVehiclePlate(event.target.value)}
                    placeholder="51A-12345"
                    className="w-full mt-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600"
                >
                  Confirm Assignment
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
