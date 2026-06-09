'use client';

import React, { useMemo, useState } from 'react';

/* ==========================================================
   ENUM & TYPE DEFINITIONS
   Định nghĩa các kiểu dữ liệu chính dùng trong màn hình Card Management
========================================================== */

type CardStatus = 'Active' | 'Inactive' | 'Lost';
type CardType = 'Normal' | 'Monthly';

type ParkingCard = {
  id: number;
  code: string;
  type: CardType;
  status: CardStatus;
  vehiclePlate?: string;
  validFrom?: string;
  validTo?: string;
  isInSession: boolean;
  createdAt: string;
};

/* ==========================================================
   MOCK DATA
   Dữ liệu giả lập ban đầu để test giao diện FE
   Sau này phần này sẽ được thay bằng dữ liệu lấy từ API
========================================================== */

const initialCards: ParkingCard[] = [
  {
    id: 1,
    code: 'CARD-001',
    type: 'Normal',
    status: 'Active',
    isInSession: true,
    createdAt: '2026-06-01 08:00',
  },
  {
    id: 2,
    code: 'MONTH-001',
    type: 'Monthly',
    status: 'Active',
    vehiclePlate: '51A-12345',
    validFrom: '2026-06-01',
    validTo: '2026-07-01',
    isInSession: false,
    createdAt: '2026-06-01 09:15',
  },
  {
    id: 3,
    code: 'CARD-003',
    type: 'Normal',
    status: 'Lost',
    isInSession: false,
    createdAt: '2026-06-02 10:30',
  },
];

/* ==========================================================
   UI HELPER FUNCTIONS
   Các hàm hỗ trợ đổi màu badge theo status và type
========================================================== */

const getStatusClassName = (status: CardStatus) => {
  switch (status) {
    case 'Active':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Inactive':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Lost':
      return 'bg-red-50 text-red-700 border-red-200';
  }
};

const getTypeClassName = (type: CardType) => {
  return type === 'Monthly'
    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
    : 'bg-slate-50 text-slate-700 border-slate-200';
};

/* ==========================================================
   MAIN COMPONENT
   Component chính của màn hình quản lý thẻ gửi xe
========================================================== */

export default function CardManager() {
  /* ==========================================================
     STATE MANAGEMENT
     Quản lý danh sách thẻ, filter, modal và dữ liệu form
  ========================================================== */

  const [cards, setCards] = useState<ParkingCard[]>(initialCards);

  const [searchCode, setSearchCode] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | CardStatus>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | CardType>('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<ParkingCard | null>(null);

  const [cardCode, setCardCode] = useState('');
  const [cardType, setCardType] = useState<CardType>('Normal');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');

  /* ==========================================================
     SEARCH & FILTER LOGIC
     Lọc danh sách thẻ theo mã thẻ, loại thẻ và trạng thái
  ========================================================== */

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const matchCode = card.code
        .toLowerCase()
        .includes(searchCode.toLowerCase());

      const matchStatus =
        statusFilter === 'All' || card.status === statusFilter;

      const matchType =
        typeFilter === 'All' || card.type === typeFilter;

      return matchCode && matchStatus && matchType;
    });
  }, [cards, searchCode, statusFilter, typeFilter]);

  /* ==========================================================
     FORM UTILITIES
     Reset form về trạng thái ban đầu sau khi tạo/sửa/đóng modal
  ========================================================== */

  const resetForm = () => {
    setCardCode('');
    setCardType('Normal');
    setVehiclePlate('');
    setValidFrom('');
    setValidTo('');
    setEditingCard(null);
  };

  /* ==========================================================
     MODAL CONTROL
     Điều khiển mở modal tạo mới hoặc chỉnh sửa thẻ
  ========================================================== */

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (card: ParkingCard) => {
    setEditingCard(card);
    setCardCode(card.code);
    setCardType(card.type);
    setVehiclePlate(card.vehiclePlate ?? '');
    setValidFrom(card.validFrom ?? '');
    setValidTo(card.validTo ?? '');
    setIsModalOpen(true);
  };

  /* ==========================================================
     CREATE & UPDATE CARD
     Xử lý tạo mới thẻ hoặc cập nhật thẻ đang chỉnh sửa
  ========================================================== */

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();

    const formattedCode = cardCode.trim().toUpperCase();
    const formattedPlate = vehiclePlate.trim().toUpperCase();

    if (!formattedCode) {
      alert('Please enter card code.');
      return;
    }

    const isDuplicate = cards.some(
      (card) => card.code === formattedCode && card.id !== editingCard?.id
    );

    if (isDuplicate) {
      alert('This card code already exists.');
      return;
    }

    if (cardType === 'Monthly') {
      if (!formattedPlate || !validFrom || !validTo) {
        alert('Monthly card requires vehicle plate, valid from and valid to.');
        return;
      }

      if (validFrom >= validTo) {
        alert('Valid To must be after Valid From.');
        return;
      }
    }

    if (editingCard) {
      setCards((prev) =>
        prev.map((card) =>
          card.id === editingCard.id
            ? {
                ...card,
                code: formattedCode,
                type: cardType,
                vehiclePlate:
                  cardType === 'Monthly' ? formattedPlate : undefined,
                validFrom: cardType === 'Monthly' ? validFrom : undefined,
                validTo: cardType === 'Monthly' ? validTo : undefined,
              }
            : card
        )
      );
    } else {
      const newCard: ParkingCard = {
        id: Date.now(),
        code: formattedCode,
        type: cardType,
        status: 'Active',
        vehiclePlate: cardType === 'Monthly' ? formattedPlate : undefined,
        validFrom: cardType === 'Monthly' ? validFrom : undefined,
        validTo: cardType === 'Monthly' ? validTo : undefined,
        isInSession: false,
        createdAt: new Date().toLocaleString('en-US', { hour12: false }),
      };

      setCards((prev) => [newCard, ...prev]);
    }

    setIsModalOpen(false);
    resetForm();
  };

  /* ==========================================================
     AUTO GENERATE CARD CODE
     Tự động sinh mã thẻ theo loại Normal hoặc Monthly
  ========================================================== */

  const handleGenerateCode = () => {
    const randomNumber = Math.floor(1000 + Math.random() * 9000);

    setCardCode(
      cardType === 'Monthly'
        ? `MONTH-${randomNumber}`
        : `CARD-${randomNumber}`
    );
  };

  /* ==========================================================
     STATUS MANAGEMENT
     Cập nhật trạng thái thẻ: Active / Inactive / Lost
  ========================================================== */

  const handleChangeStatus = (cardId: number, nextStatus: CardStatus) => {
    const selectedCard = cards.find((card) => card.id === cardId);

    if (!selectedCard) return;

    const confirmed = confirm(
      `Are you sure you want to change ${selectedCard.code} status to ${nextStatus}?`
    );

    if (!confirmed) return;

    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId ? { ...card, status: nextStatus } : card
      )
    );
  };

  /* ==========================================================
     DELETE CARD
     Xóa thẻ, nhưng không cho xóa nếu thẻ đang nằm trong session
  ========================================================== */

  const handleDeleteCard = (cardId: number) => {
    const selectedCard = cards.find((card) => card.id === cardId);

    if (!selectedCard) return;

    if (selectedCard.isInSession) {
      alert(
        'Cannot delete this card because it is currently used in an active parking session.'
      );
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to delete ${selectedCard.code}?`
    );

    if (!confirmed) return;

    setCards((prev) => prev.filter((card) => card.id !== cardId));
  };

  /* ==========================================================
     UI RENDER
     Giao diện chính: header, bộ lọc, bảng danh sách và modal form
  ========================================================== */

  return (
    <div className="p-8 space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Card Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage normal cards, monthly cards, status and card validation.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-3 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">add_card</span>
          Create Card
        </button>
      </div>

      {/* CARD LIST SECTION */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
        {/* FILTER SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            placeholder="Search card code..."
            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          />

          <select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value as 'All' | CardType)
            }
            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
          >
            <option value="All">All Types</option>
            <option value="Normal">Normal Card</option>
            <option value="Monthly">Monthly Card</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as 'All' | CardStatus)
            }
            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Lost">Lost</option>
          </select>
        </div>

        {/* TABLE SECTION */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                <th className="px-5 py-4 text-left">Card Code</th>
                <th className="px-5 py-4 text-left">Type</th>
                <th className="px-5 py-4 text-left">Status</th>
                <th className="px-5 py-4 text-left">Vehicle Plate</th>
                <th className="px-5 py-4 text-left">Validity</th>
                <th className="px-5 py-4 text-left">In Session</th>
                <th className="px-5 py-4 text-left">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredCards.map((card) => (
                <tr key={card.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-mono font-bold text-slate-700">
                    {card.code}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full border text-xs font-bold ${getTypeClassName(
                        card.type
                      )}`}
                    >
                      {card.type}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <select
                      value={card.status}
                      onChange={(e) =>
                        handleChangeStatus(
                          card.id,
                          e.target.value as CardStatus
                        )
                      }
                      className={`px-3 py-2 border rounded-lg text-sm font-bold ${getStatusClassName(
                        card.status
                      )}`}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Lost">Lost</option>
                    </select>
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {card.vehiclePlate ?? '-'}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {card.type === 'Monthly'
                      ? `${card.validFrom} → ${card.validTo}`
                      : '-'}
                  </td>

                  <td className="px-5 py-4">
                    {card.isInSession ? (
                      <span className="text-red-600 font-bold">Yes</span>
                    ) : (
                      <span className="text-slate-400">No</span>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(card)}
                        className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg font-bold hover:bg-blue-100"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="px-3 py-2 bg-red-50 text-red-700 rounded-lg font-bold hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredCards.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-slate-400"
                  >
                    No card found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 p-6 space-y-5">
            {/* MODAL HEADER */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {editingCard ? 'Edit Card' : 'Create New Card'}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Normal cards are used for daily parking. Monthly cards
                  require vehicle information.
                </p>
              </div>

              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* CARD FORM */}
            <form onSubmit={handleSaveCard} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Card Type
                </label>
                <select
                  value={cardType}
                  onChange={(e) => setCardType(e.target.value as CardType)}
                  className="w-full mt-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="Normal">Normal Card</option>
                  <option value="Monthly">Monthly Card</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Card Code
                </label>
                <input
                  type="text"
                  value={cardCode}
                  onChange={(e) => setCardCode(e.target.value)}
                  placeholder="Example: CARD-004"
                  className="w-full mt-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold uppercase"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerateCode}
                className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
              >
                Auto Generate Code
              </button>

              {/* MONTHLY CARD EXTRA FIELDS */}
              {cardType === 'Monthly' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">
                      Vehicle Plate
                    </label>
                    <input
                      type="text"
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                      placeholder="Example: 51A-12345"
                      className="w-full mt-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl uppercase"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">
                        Valid From
                      </label>
                      <input
                        type="date"
                        value={validFrom}
                        onChange={(e) => setValidFrom(e.target.value)}
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
                        onChange={(e) => setValidTo(e.target.value)}
                        className="w-full mt-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all"
              >
                {editingCard ? 'Save Changes' : 'Confirm Create Card'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}