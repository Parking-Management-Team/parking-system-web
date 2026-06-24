'use client';

import React, { useState, useEffect } from 'react';
import {
  useSubscriptions,
  BuildingItem,
  CardItem,
  DriverItem,
  VehicleItem,
  SubscriptionPriceConfig,
} from '../hooks/useSubscriptions';
import { MonthlySubscription } from '../types';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  buildings: BuildingItem[];
  cards: CardItem[];
  drivers: DriverItem[];
  vehicles: VehicleItem[];
  priceConfigs: SubscriptionPriceConfig[];
  registerSubscription: ReturnType<typeof useSubscriptions>['registerSubscription'];
}

export function RegisterSubscriptionModal({
  isOpen,
  onClose,
  onSuccess,
  buildings,
  cards,
  drivers,
  vehicles,
  priceConfigs,
  registerSubscription,
}: RegisterModalProps) {
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter vehicles by selected driver
  const filteredVehicles = vehicles.filter(
    (v) => v.accountId === parseInt(selectedDriverId)
  );

  // Find price config based on selected vehicle
  const selectedVehicle = vehicles.find((v) => v.id === parseInt(selectedVehicleId));
  const activePriceConfig = selectedVehicle
    ? priceConfigs.find((c) => c.vehicleTypeId === selectedVehicle.vehicleTypeId && c.isActive)
    : null;

  // Clear selections when closed or driver changed
  useEffect(() => {
    if (!isOpen) {
      setSelectedBuildingId('');
      setSelectedDriverId('');
      setSelectedVehicleId('');
      setSelectedCardId('');
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedVehicleId('');
  }, [selectedDriverId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuildingId || !selectedDriverId || !selectedVehicleId || !selectedCardId) {
      return;
    }

    setIsSubmitting(true);
    const success = await registerSubscription({
      buildingId: parseInt(selectedBuildingId),
      accountId: parseInt(selectedDriverId),
      vehicleId: parseInt(selectedVehicleId),
      assignedCardId: parseInt(selectedCardId),
    });

    setIsSubmitting(false);
    if (success) {
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006d43]">add_card</span>
            <h3 className="text-lg font-bold text-slate-800">Register Subscription</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Building Selection */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Parking Building
            </label>
            <select
              required
              value={selectedBuildingId}
              onChange={(e) => setSelectedBuildingId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-medium text-sm rounded-xl px-3 py-2.5 focus:border-[#006d43] focus:ring-1 focus:ring-[#006d43] focus:outline-none"
            >
              <option value="">Select Building</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          {/* Driver Selection */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Driver / Account
            </label>
            <select
              required
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-medium text-sm rounded-xl px-3 py-2.5 focus:border-[#006d43] focus:ring-1 focus:ring-[#006d43] focus:outline-none"
            >
              <option value="">Select Driver</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName || d.username}
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle Selection */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Vehicle
            </label>
            <select
              required
              disabled={!selectedDriverId}
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-medium text-sm rounded-xl px-3 py-2.5 focus:border-[#006d43] focus:ring-1 focus:ring-[#006d43] focus:outline-none disabled:opacity-50"
            >
              <option value="">
                {!selectedDriverId ? 'First select driver' : 'Select Vehicle'}
              </option>
              {filteredVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.licensePlate} ({v.vehicleTypeId === 1 ? 'Motorbike' : 'Car'})
                </option>
              ))}
            </select>
          </div>

          {/* Card Selection */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Monthly Rfid Card
            </label>
            <select
              required
              value={selectedCardId}
              onChange={(e) => setSelectedCardId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-medium text-sm rounded-xl px-3 py-2.5 focus:border-[#006d43] focus:ring-1 focus:ring-[#006d43] focus:outline-none"
            >
              <option value="">Select Monthly Card</option>
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.cardCode} ({c.cardStatus})
                </option>
              ))}
            </select>
          </div>

          {/* Pricing Config display */}
          {selectedVehicleId && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                  Pricing Config
                </span>
                <p className="text-xs font-bold text-slate-600">
                  {selectedVehicle?.vehicleTypeId === 1 ? 'Motorbike' : 'Car'} Pass Rate
                </p>
              </div>
              <p className="text-base font-black text-[#006d43]">
                {activePriceConfig
                  ? `${activePriceConfig.price.toLocaleString('vi-VN')} VND/mo`
                  : 'No Active Config'}
              </p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting ||
                !selectedBuildingId ||
                !selectedDriverId ||
                !selectedVehicleId ||
                !selectedCardId ||
                !activePriceConfig
              }
              className="px-4 py-2 bg-[#006d43] hover:bg-[#005c38] text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-[#006d43]/10 disabled:opacity-50"
            >
              {isSubmitting ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface UpdateCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subscription: MonthlySubscription | null;
  cards: CardItem[];
  updateCard: ReturnType<typeof useSubscriptions>['updateCard'];
}

export function UpdateCardModal({
  isOpen,
  onClose,
  onSuccess,
  subscription,
  cards,
  updateCard,
}: UpdateCardModalProps) {
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedCardId('');
    }
  }, [isOpen]);

  if (!isOpen || !subscription) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCardId) return;

    setIsSubmitting(true);
    const success = await updateCard(subscription.id, parseInt(selectedCardId));
    setIsSubmitting(false);

    if (success) {
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006d43]">credit_card</span>
            <h3 className="text-lg font-bold text-slate-800">Update Assigned Card</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold uppercase">Subscriber ID</span>
              <span className="font-extrabold text-slate-700">SUB-{subscription.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold uppercase">License Plate</span>
              <span className="font-extrabold text-slate-700">{subscription.licensePlate || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold uppercase">Current Card Code</span>
              <span className="font-extrabold text-slate-700">{subscription.cardCode || 'None'}</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Select New Monthly Pass Card
            </label>
            <select
              required
              value={selectedCardId}
              onChange={(e) => setSelectedCardId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-medium text-sm rounded-xl px-3 py-2.5 focus:border-[#006d43] focus:ring-1 focus:ring-[#006d43] focus:outline-none"
            >
              <option value="">Select Monthly Card</option>
              {cards
                .filter((c) => c.cardCode !== subscription.cardCode)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.cardCode} ({c.cardStatus})
                  </option>
                ))}
            </select>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedCardId}
              className="px-4 py-2 bg-[#006d43] hover:bg-[#005c38] text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-[#006d43]/10"
            >
              {isSubmitting ? 'Updating...' : 'Update Card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
