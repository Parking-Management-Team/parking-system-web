'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useCardManagement } from '@/features/card/hooks/useCardManagement';
import type {
  CardOperationResult,
  CardStatus,
  CardType,
  ParkingCard,
} from '@/features/card/types/card';

type ModalMode = 'create' | null;

const statusClassNames: Record<CardStatus, string> = {
  AVAILABLE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ASSIGNED: 'bg-blue-50 text-blue-700 border-blue-200',
  INACTIVE: 'bg-slate-100 text-slate-600 border-slate-200',
  LOST: 'bg-red-50 text-red-700 border-red-200',
};

const typeClassNames: Record<CardType, string> = {
  NORMAL: 'bg-cyan-50 text-cyan-700 border-cyan-200',
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
}: {
  children: React.ReactNode;
  onClick: () => void;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="whitespace-nowrap rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 active:translate-y-px"
    >
      {children}
    </button>
  );
};

const StatusToggle = ({
  status,
  onChange,
  label,
}: {
  status: 'AVAILABLE' | 'INACTIVE';
  onChange: (status: 'AVAILABLE' | 'INACTIVE') => void;
  label: string;
}) => (
  <div
    role="group"
    aria-label={label}
    className="relative grid h-9 w-[152px] grid-cols-2 rounded-xl border border-slate-200/80 bg-slate-100/80 p-1 shadow-inner shadow-slate-300/40"
  >
    <span
      aria-hidden="true"
      className={`absolute bottom-1 left-1 top-1 w-[72px] rounded-lg transition-all duration-300 ease-out ${
        status === 'AVAILABLE'
          ? 'translate-x-0 bg-emerald-600 shadow-sm shadow-emerald-700/25'
          : 'translate-x-[72px] bg-slate-700 shadow-sm shadow-slate-900/20'
      }`}
    />
    {(['AVAILABLE', 'INACTIVE'] as const).map((option) => {
      const isActive = status === option;

      return (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          disabled={isActive}
          aria-pressed={isActive}
          className={`relative z-10 flex items-center justify-center gap-1 rounded-lg text-[9px] font-black tracking-wide transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
            isActive ? 'text-white' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-slate-300'}`} />
          {option === 'AVAILABLE' ? 'Available' : 'Inactive'}
        </button>
      );
    })}
  </div>
);

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
    markCardLost,
  } = useCardManagement();

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<CardOperationResult | null>(null);

  const [newCardCode, setNewCardCode] = useState('');
  const [newCardType, setNewCardType] = useState<CardType>('NORMAL');

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
    setNewCardCode('');
    setNewCardType('NORMAL');
  };

  const showResult = (operationResult: CardOperationResult) => {
    setFeedback(operationResult);
    if (operationResult.success) closeModal();
  };

  const handleCreateCard = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    showResult(createCard({ cardCode: newCardCode, cardType: newCardType }));
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
              placeholder="Search card code or vehicle plate..."
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
          {filteredCards.length > 0 && (
            <div className="grid grid-cols-[minmax(150px,1.25fr)_minmax(100px,.75fr)_minmax(140px,1fr)_minmax(110px,.8fr)_auto_auto] items-center gap-4 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 max-lg:hidden">
              <span>Card code</span>
              <span>Card type</span>
              <span>Vehicle plate</span>
              <span>Status</span>
              <span>Action</span>
              <span className="w-5" aria-hidden="true" />
            </div>
          )}
          {filteredCards.map((card) => {
            const isExpanded = expandedCardId === card.id;

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
                className={`overflow-hidden rounded-xl border bg-white transition-all ${
                  isExpanded
                    ? 'border-emerald-300 shadow-md shadow-emerald-900/5'
                    : 'border-slate-200 hover:border-emerald-200 hover:shadow-sm'
                }`}
              >
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  aria-controls={`card-details-${card.id}`}
                  onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setExpandedCardId(isExpanded ? null : card.id);
                    }
                  }}
                  className="grid cursor-pointer grid-cols-[minmax(150px,1.25fr)_minmax(100px,.75fr)_minmax(140px,1fr)_minmax(110px,.8fr)_auto_auto] items-center gap-4 px-4 py-3.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 max-lg:grid-cols-[1fr_auto]"
                >
                  <p className="truncate font-mono text-sm font-black text-slate-800" title={card.cardCode}>
                    {card.cardCode}
                  </p>
                  <span className={`w-fit rounded-full border px-2.5 py-1 text-[11px] font-bold ${typeClassNames[card.cardType]}`}>
                    {card.cardType}
                  </span>
                  <p className="truncate text-sm font-bold text-slate-700 max-lg:hidden" title={card.vehiclePlate ?? 'No vehicle assigned'}>
                    {card.vehiclePlate ?? '—'}
                  </p>
                  <div className="max-lg:hidden" onClick={(event) => event.stopPropagation()}>
                    {card.cardStatus === 'AVAILABLE' || card.cardStatus === 'INACTIVE' ? (
                      <StatusToggle
                        status={card.cardStatus}
                        onChange={(status) => showResult(updateCardStatus(card.id, status))}
                        label={`Change status for ${card.cardCode}`}
                      />
                    ) : (
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusClassNames[card.cardStatus]}`}>
                        {card.cardStatus}
                      </span>
                    )}
                  </div>
                  <div className="max-lg:hidden" onClick={(event) => event.stopPropagation()}>
                    {card.cardStatus !== 'LOST' ? (
                      <ActionButton onClick={() => handleMarkLost(card)}>Mark Lost</ActionButton>
                    ) : (
                      <span className="px-3 py-2 text-xs font-semibold text-slate-400">Marked lost</span>
                    )}
                  </div>
                  <span className={`material-symbols-outlined text-xl text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </div>

                {isExpanded && (
                  <div id={`card-details-${card.id}`} className="border-t border-slate-100 bg-slate-50/70 px-4 py-5">
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
                      {detailItems.map((item) => (
                        <div key={item.label} className="min-w-0">
                          <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.label}</dt>
                          <dd className="mt-1 truncate text-sm font-semibold text-slate-700" title={String(item.value)}>{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-200 pt-4 lg:hidden">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Status
                      </p>
                      {card.cardStatus === 'AVAILABLE' || card.cardStatus === 'INACTIVE' ? (
                        <StatusToggle
                          status={card.cardStatus}
                          onChange={(status) => showResult(updateCardStatus(card.id, status))}
                          label={`Change status for ${card.cardCode}`}
                        />
                      ) : (
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusClassNames[card.cardStatus]}`}>
                          {card.cardStatus}
                        </span>
                      )}
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-200 pt-4 lg:hidden">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Action</p>
                      {card.cardStatus !== 'LOST' ? (
                        <ActionButton onClick={() => handleMarkLost(card)}>Mark Lost</ActionButton>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">Card already marked lost</span>
                      )}
                    </div>
                  </div>
                )}
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
                  Create Card
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  New cards start with AVAILABLE status.
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
          </div>
        </div>
      )}
    </div>
  );
}
