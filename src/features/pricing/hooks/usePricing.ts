import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth';
import { StandardTariff, MonthlyMembership, ServiceFeeOrPenalty, FeePenaltyType, TriggerType } from '../types';

// Mock initial data
const initialTariffs: StandardTariff[] = [
  {
    id: '1',
    vehicleType: 'Motorbike',
    timeSlot: 'Day: 06:00-18:00',
    baseRate: '5,000 VNĐ / 4 hrs',
    incrementalRate: '+1,000 VNĐ / 1 hr',
    dailyCap: 'Max 10,000 VNĐ',
    gracePeriod: '15 mins',
    isActive: true,
    details: {
      basePrice: 5000,
      initialDuration: '4',
      blockPrice: 1000,
      increment: '1',
      startTime: '06:00',
      endTime: '18:00',
      maxCap: 10000,
      graceVal: '15'
    }
  },
  {
    id: '2',
    vehicleType: 'Car',
    timeSlot: 'Day: 06:00-18:00',
    baseRate: '20,000 VNĐ / 2 hrs',
    incrementalRate: '+5,000 VNĐ / 1 hr',
    dailyCap: 'Max 50,000 VNĐ',
    gracePeriod: '15 mins',
    isActive: true,
    details: {
      basePrice: 20000,
      initialDuration: '2',
      blockPrice: 5000,
      increment: '1',
      startTime: '06:00',
      endTime: '18:00',
      maxCap: 50000,
      graceVal: '15'
    }
  },
  {
    id: '3',
    vehicleType: 'Motorbike (Night)',
    timeSlot: 'Night: 18:00-06:00',
    baseRate: '10,000 VNĐ / Night',
    incrementalRate: '+2,000 VNĐ / 1 hr',
    dailyCap: 'Max 20,000 VNĐ',
    gracePeriod: '15 mins',
    isActive: true,
    details: {
      basePrice: 10000,
      initialDuration: '12',
      blockPrice: 2000,
      increment: '1',
      startTime: '18:00',
      endTime: '06:00',
      maxCap: 20000,
      graceVal: '15'
    }
  },
  {
    id: '4',
    vehicleType: 'Car (Night)',
    timeSlot: 'Night: 18:00-06:00',
    baseRate: '50,000 VNĐ / Night',
    incrementalRate: '+10,000 VNĐ / 1 hr',
    dailyCap: 'Max 150,000 VNĐ',
    gracePeriod: '15 mins',
    isActive: true,
    details: {
      basePrice: 50000,
      initialDuration: '12',
      blockPrice: 10000,
      increment: '1',
      startTime: '18:00',
      endTime: '06:00',
      maxCap: 150000,
      graceVal: '15'
    }
  }
];

const initialMemberships: MonthlyMembership[] = [
  {
    id: 'm1',
    vehicleType: 'Motorbike',
    price: '200,000 VNĐ / month',
    priceNum: 200000
  },
  {
    id: 'm2',
    vehicleType: 'Car',
    price: '1,500,000 VNĐ / month',
    priceNum: 1500000
  }
];

const initialFees: ServiceFeeOrPenalty[] = [
  {
    id: 'f1',
    name: 'Booking Deposit',
    type: 'deposit',
    amount: '5,000 VNĐ',
    amountNum: 5000,
    description: 'No-show penalty applies after 45m.',
    triggerType: 'time',
    triggerVal: 45,
    isActive: true
  },
  {
    id: 'f2',
    name: 'Lost Card Penalty',
    type: 'lostcard',
    amount: '50,000 VNĐ',
    amountNum: 50000,
    description: 'Requires immediate reporting.',
    triggerType: 'manual',
    isActive: true
  },
  {
    id: 'f3',
    name: 'Wrong Zone Penalty',
    type: 'wrongzone',
    amount: '100,000 VNĐ',
    amountNum: 100000,
    description: 'Applied per incident.',
    triggerType: 'manual',
    isActive: true
  }
];

export function usePricing() {
  const { user } = useAuth();

  // Header Real-time Clock
  const [currentTime, setCurrentTime] = useState('00:00:00');
  const [currentDate, setCurrentDate] = useState('Loading date...');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }));
      setCurrentDate(now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }));
    };
    updateClock();
    const intervalId = setInterval(updateClock, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Main feature state lists
  const [tariffs, setTariffs] = useState<StandardTariff[]>(initialTariffs);
  const [memberships, setMemberships] = useState<MonthlyMembership[]>(initialMemberships);
  const [fees, setFees] = useState<ServiceFeeOrPenalty[]>(initialFees);

  // UI state variables
  const [activeTab, setActiveTab] = useState<'standard' | 'memberships' | 'fees'>('standard');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Modals Visibility
  const [isEditTariffOpen, setIsEditTariffOpen] = useState(false);
  const [isEditMembershipOpen, setIsEditMembershipOpen] = useState(false);
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false); // Handles both Add and Edit

  // Currently editing objects
  const [editingTariff, setEditingTariff] = useState<StandardTariff | null>(null);
  const [editingMembership, setEditingMembership] = useState<MonthlyMembership | null>(null);
  const [editingFee, setEditingFee] = useState<ServiceFeeOrPenalty | null>(null);

  // Form Inputs for Standard Tariffs
  const [formTariffName, setFormTariffName] = useState('');
  const [formTariffVehicleType, setFormTariffVehicleType] = useState('Motorbike');
  const [formTariffStartTime, setFormTariffStartTime] = useState('06:00');
  const [formTariffEndTime, setFormTariffEndTime] = useState('18:00');
  const [formTariffBasePrice, setFormTariffBasePrice] = useState(0);
  const [formTariffInitialDuration, setFormTariffInitialDuration] = useState('4');
  const [formTariffBlockPrice, setFormTariffBlockPrice] = useState(0);
  const [formTariffIncrement, setFormTariffIncrement] = useState('1');
  const [formTariffMaxCap, setFormTariffMaxCap] = useState(0);
  const [formTariffGraceVal, setFormTariffGraceVal] = useState('15');

  // Form Inputs for Membership
  const [formMembershipVehicleType, setFormMembershipVehicleType] = useState('Motorbike');
  const [formMembershipPrice, setFormMembershipPrice] = useState(0);

  // Form Inputs for Service Fees & Penalties
  const [formFeeType, setFormFeeType] = useState<FeePenaltyType>('deposit');
  const [formFeeName, setFormFeeName] = useState('');
  const [formFeeAmount, setFormFeeAmount] = useState(0);
  const [formFeeTriggerType, setFormFeeTriggerType] = useState<TriggerType>('time');
  const [formFeeTriggerVal, setFormFeeTriggerVal] = useState(45);
  const [formFeeDescription, setFormFeeDescription] = useState('');
  const [formFeeIsActive, setFormFeeIsActive] = useState(true);

  // === TARIFF HANDLERS ===
  const handleOpenEditTariff = (tariff: StandardTariff) => {
    setEditingTariff(tariff);
    setFormTariffName(tariff.vehicleType + ' ' + (tariff.timeSlot.includes('Night') ? 'Night' : 'Day') + ' Tariff');
    setFormTariffVehicleType(tariff.vehicleType.includes('Motorbike') ? 'Motorbike' : 'Car');
    setFormTariffStartTime(tariff.details.startTime);
    setFormTariffEndTime(tariff.details.endTime);
    setFormTariffBasePrice(tariff.details.basePrice);
    setFormTariffInitialDuration(tariff.details.initialDuration);
    setFormTariffBlockPrice(tariff.details.blockPrice);
    setFormTariffIncrement(tariff.details.increment);
    setFormTariffMaxCap(tariff.details.maxCap);
    setFormTariffGraceVal(tariff.details.graceVal);
    setIsEditTariffOpen(true);
  };

  const handleCloseEditTariff = () => {
    setIsEditTariffOpen(false);
    setEditingTariff(null);
  };

  const handleSaveTariff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTariff) return;

    if (formTariffBasePrice <= 0 || formTariffBlockPrice <= 0 || formTariffMaxCap <= 0) {
      triggerToast('Please input positive values for rates and cap limits.', 'error');
      return;
    }

    const updated = tariffs.map((t) => {
      if (t.id === editingTariff.id) {
        // Calculate nice formatted description
        const displayVehicle = formTariffVehicleType + (t.timeSlot.includes('Night') ? ' (Night)' : '');
        const formatBase = `${formTariffBasePrice.toLocaleString('vi-VN')} VNĐ / ${formTariffInitialDuration} hrs`;
        const formatInc = `+${formTariffBlockPrice.toLocaleString('vi-VN')} VNĐ / ${formTariffIncrement} hr`;
        const formatCap = `Max ${formTariffMaxCap.toLocaleString('vi-VN')} VNĐ`;

        return {
          ...t,
          vehicleType: displayVehicle,
          baseRate: formatBase,
          incrementalRate: formatInc,
          dailyCap: formatCap,
          gracePeriod: `${formTariffGraceVal} mins`,
          details: {
            basePrice: formTariffBasePrice,
            initialDuration: formTariffInitialDuration,
            blockPrice: formTariffBlockPrice,
            increment: formTariffIncrement,
            startTime: formTariffStartTime,
            endTime: formTariffEndTime,
            maxCap: formTariffMaxCap,
            graceVal: formTariffGraceVal
          }
        };
      }
      return t;
    });

    setTariffs(updated);
    handleCloseEditTariff();
    triggerToast('Pricing Policy updated successfully!');
  };

  const handleToggleTariffStatus = (id: string) => {
    setTariffs(
      tariffs.map((t) => (t.id === id ? { ...t, isActive: !t.isActive } : t))
    );
    const item = tariffs.find((t) => t.id === id);
    triggerToast(`${item?.vehicleType} status updated!`);
  };

  const handleDeleteTariff = (id: string) => {
    setTariffs(tariffs.filter((t) => t.id !== id));
    triggerToast('Policy deleted successfully!');
  };

  // === MEMBERSHIP HANDLERS ===
  const handleOpenEditMembership = (membership: MonthlyMembership) => {
    setEditingMembership(membership);
    setFormMembershipVehicleType(membership.vehicleType);
    setFormMembershipPrice(membership.priceNum);
    setIsEditMembershipOpen(true);
  };

  const handleCloseEditMembership = () => {
    setIsEditMembershipOpen(false);
    setEditingMembership(null);
  };

  const handleSaveMembership = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMembership) return;

    if (formMembershipPrice <= 0) {
      triggerToast('Price must be a positive number.', 'error');
      return;
    }

    setMemberships(
      memberships.map((m) =>
        m.id === editingMembership.id
          ? {
              ...m,
              priceNum: formMembershipPrice,
              price: `${formMembershipPrice.toLocaleString('vi-VN')} VNĐ / month`
            }
          : m
      )
    );
    handleCloseEditMembership();
    triggerToast('Monthly Membership fee updated!');
  };

  // === FEES & PENALTIES HANDLERS ===
  const handleOpenAddFee = () => {
    setEditingFee(null);
    setFormFeeType('deposit');
    setFormFeeName('');
    setFormFeeAmount(0);
    setFormFeeTriggerType('time');
    setFormFeeTriggerVal(45);
    setFormFeeDescription('');
    setFormFeeIsActive(true);
    setIsFeeModalOpen(true);
  };

  const handleOpenEditFee = (fee: ServiceFeeOrPenalty) => {
    setEditingFee(fee);
    setFormFeeType(fee.type);
    setFormFeeName(fee.name);
    setFormFeeAmount(fee.amountNum);
    setFormFeeTriggerType(fee.triggerType);
    setFormFeeTriggerVal(fee.triggerVal || 45);
    setFormFeeDescription(fee.description);
    setFormFeeIsActive(fee.isActive);
    setIsFeeModalOpen(true);
  };

  const handleCloseFeeModal = () => {
    setIsFeeModalOpen(false);
    setEditingFee(null);
  };

  const handleSaveFee = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = formFeeName.trim();
    if (!cleanName) {
      triggerToast('Fee name is required.', 'error');
      return;
    }

    if (formFeeAmount <= 0) {
      triggerToast('Amount must be positive.', 'error');
      return;
    }

    if (editingFee) {
      // Edit mode
      setFees(
        fees.map((f) =>
          f.id === editingFee.id
            ? {
                ...f,
                name: cleanName,
                type: formFeeType,
                amountNum: formFeeAmount,
                amount: `${formFeeAmount.toLocaleString('vi-VN')} VNĐ`,
                triggerType: formFeeTriggerType,
                triggerVal: formFeeTriggerType === 'time' ? formFeeTriggerVal : undefined,
                description: formFeeDescription,
                isActive: formFeeIsActive
              }
            : f
        )
      );
      triggerToast('Fee & Penalty updated successfully!');
    } else {
      // Add mode
      const newFee: ServiceFeeOrPenalty = {
        id: `f-${Date.now()}`,
        name: cleanName,
        type: formFeeType,
        amountNum: formFeeAmount,
        amount: `${formFeeAmount.toLocaleString('vi-VN')} VNĐ`,
        triggerType: formFeeTriggerType,
        triggerVal: formFeeTriggerType === 'time' ? formFeeTriggerVal : undefined,
        description: formFeeDescription,
        isActive: formFeeIsActive
      };
      setFees([...fees, newFee]);
      triggerToast('New Fee & Penalty added successfully!');
    }

    handleCloseFeeModal();
  };

  const handleDeleteFee = (id: string) => {
    setFees(fees.filter((f) => f.id !== id));
    triggerToast('Fee policy deleted.');
  };

  return {
    currentTime,
    currentDate,
    user,
    activeTab,
    setActiveTab,
    tariffs,
    memberships,
    fees,
    showToast,
    toastMessage,
    toastType,
    triggerToast,

    // Modal control toggles
    isEditTariffOpen,
    isEditMembershipOpen,
    isFeeModalOpen,

    // Editing targets
    editingTariff,
    editingMembership,
    editingFee,

    // Tariff form fields
    formTariffName,
    setFormTariffName,
    formTariffVehicleType,
    setFormTariffVehicleType,
    formTariffStartTime,
    setFormTariffStartTime,
    formTariffEndTime,
    setFormTariffEndTime,
    formTariffBasePrice,
    setFormTariffBasePrice,
    formTariffInitialDuration,
    setFormTariffInitialDuration,
    formTariffBlockPrice,
    setFormTariffBlockPrice,
    formTariffIncrement,
    setFormTariffIncrement,
    formTariffMaxCap,
    setFormTariffMaxCap,
    formTariffGraceVal,
    setFormTariffGraceVal,

    // Membership form fields
    formMembershipVehicleType,
    setFormMembershipVehicleType,
    formMembershipPrice,
    setFormMembershipPrice,

    // Fees form fields
    formFeeType,
    setFormFeeType,
    formFeeName,
    setFormFeeName,
    formFeeAmount,
    setFormFeeAmount,
    formFeeTriggerType,
    setFormFeeTriggerType,
    formFeeTriggerVal,
    setFormFeeTriggerVal,
    formFeeDescription,
    setFormFeeDescription,
    formFeeIsActive,
    setFormFeeIsActive,

    // Operations Handlers
    handleOpenEditTariff,
    handleCloseEditTariff,
    handleSaveTariff,
    handleToggleTariffStatus,
    handleDeleteTariff,

    handleOpenEditMembership,
    handleCloseEditMembership,
    handleSaveMembership,

    handleOpenAddFee,
    handleOpenEditFee,
    handleCloseFeeModal,
    handleSaveFee,
    handleDeleteFee
  };
}
export type UsePricingResult = ReturnType<typeof usePricing>;
