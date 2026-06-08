'use client';

import React, { useMemo, useState } from 'react';

type CardStatus = 'Active' | 'Inactive' | 'Lost';

type ParkingCard = {
  id: number;
  code: string;
  status: CardStatus;
  createdAt: string;
};

const initialCards: ParkingCard[] = [
  {
    id: 1,
    code: 'CARD-001',
    status: 'Active',
    createdAt: '2026-06-01 08:00',
  },
  {
    id: 2,
    code: 'CARD-002',
    status: 'Inactive',
    createdAt: '2026-06-01 09:15',
  },
  {
    id: 3,
    code: 'CARD-003',
    status: 'Lost',
    createdAt: '2026-06-02 10:30',
  },
];

// Hàm đổi màu theo trạng thái card
const getStatusClassName = (status: CardStatus) => {
  switch (status) {
    case 'Active':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Inactive':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Lost':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

export default function CardManager() {
  // Danh sách card hiện tại
  const [cards, setCards] = useState<ParkingCard[]>(initialCards);

  // Giá trị ô tìm kiếm
  const [searchCode, setSearchCode] = useState('');

  // Giá trị ô nhập mã card mới
  const [newCardCode, setNewCardCode] = useState('');

  // Trạng thái mở / đóng modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Lọc card theo mã card được nhập vào ô search
  const filteredCards = useMemo(() => {
    return cards.filter((card) =>
      card.code.toLowerCase().includes(searchCode.toLowerCase())
    );
  }, [cards, searchCode]);

  // Xử lý tạo card mới
  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();

    const formattedCode = newCardCode.trim().toUpperCase();

    if (!formattedCode) {
      alert('Please enter card code.');
      return;
    }

    const isDuplicate = cards.some((card) => card.code === formattedCode);

    if (isDuplicate) {
      alert('This card code already exists.');
      return;
    }

    const newCard: ParkingCard = {
      id: Date.now(),
      code: formattedCode,
      status: 'Active',
      createdAt: new Date().toLocaleString('en-US', { hour12: false }),
    };

    setCards((prev) => [newCard, ...prev]);
    setNewCardCode('');
    setIsModalOpen(false);
  };

  // Tự động sinh mã card
  const handleGenerateCode = () => {
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    setNewCardCode(`CARD-${randomNumber}`);
  };

  // Xử lý đổi trạng thái card
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

  return (
    <div className="p-8 space-y-8">
      {/* Header và nút tạo card mới */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Card Manager</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage parking card codes, search cards, and update card status.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-3 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">add_card</span>
          Create Card
        </button>
      </div>

      {/* Phần danh sách card và thanh search */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
        {/* Thanh search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Parking Card List</h3>
            <p className="text-sm text-slate-500">
              Search by card code and update operational status.
            </p>
          </div>

          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              search
            </span>
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="Search card code..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>
        </div>

        {/* Bảng danh sách card */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                <th className="px-5 py-4 text-left">Card Code</th>
                <th className="px-5 py-4 text-left">Status</th>
                <th className="px-5 py-4 text-left">Created At</th>
                <th className="px-5 py-4 text-left">Change Status</th>
              </tr>
            </thead>

            {/* Phần body của bảng */}
            <tbody className="divide-y divide-slate-100">
              {filteredCards.map((card) => (
                <tr key={card.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-mono font-bold text-slate-700">
                    {card.code}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-bold ${getStatusClassName(
                        card.status
                      )}`}
                    >
                      {card.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-slate-500">{card.createdAt}</td>

                  <td className="px-5 py-4">
                    <select
                      value={card.status}
                      onChange={(e) =>
                        handleChangeStatus(card.id, e.target.value as CardStatus)
                      }
                      className="px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Lost">Lost</option>
                    </select>
                  </td>
                </tr>
              ))}

              {/* Hiển thị khi không tìm thấy card nào */}
              {filteredCards.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-slate-400">
                    No card found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal tạo card mới */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 p-6 space-y-5">
            {/* Header của modal */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Create New Card</h3>
                <p className="text-sm text-slate-500 mt-1">
                  New cards will be created with Active status.
                </p>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Form tạo card mới */}
            <form onSubmit={handleCreateCard} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Card Code
                </label>
                <input
                  type="text"
                  value={newCardCode}
                  onChange={(e) => setNewCardCode(e.target.value)}
                  placeholder="Example: CARD-004"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold uppercase"
                />
              </div>

              {/* Nút tự sinh mã card */}
              <button
                type="button"
                onClick={handleGenerateCode}
                className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">autorenew</span>
                Auto Generate Code
              </button>

              {/* Nút xác nhận tạo card */}
              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all"
              >
                Confirm Create Card
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}