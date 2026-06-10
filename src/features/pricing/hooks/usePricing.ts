import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/features/auth';
import { StandardTariff, PricingWindow, TariffRow, MonthlyMembership, ServiceFeeOrPenalty, FeePenaltyType, TriggerType } from '../types';

// Mock initial data matching PBMS Database Schema
const initialTariffs: StandardTariff[] = [
  {
    pricingPolicyId: 1,
    vehicleTypeId: 1, // Motorbike
    policyName: 'Motorbike Standard Tariff',
    effectiveStart: '2026-01-01',
    effectiveEnd: null,
    pricingPolicyStatus: 'Active',
    pricingWindows: [
      {
        pricingWindowId: 1,
        pricingPolicyId: 1,
        windowName: 'Day Slot',
        startTime: '06:00:00',
        endTime: '18:00:00',
        baseDurationMinutes: 240, // 4 hours
        basePrice: 5000,
        incrementBlockMinutes: 60, // 1 hour
        incrementPrice: 1000,
        windowCap: 10000,
        gracePeriodMinutes: 15
      },
      {
        pricingWindowId: 2,
        pricingPolicyId: 1,
        windowName: 'Night Slot',
        startTime: '18:00:00',
        endTime: '06:00:00',
        baseDurationMinutes: 720, // 12 hours
        basePrice: 10000,
        incrementBlockMinutes: 60, // 1 hour
        incrementPrice: 2000,
        windowCap: 20000,
        gracePeriodMinutes: 15
      }
    ]
  },
  {
    pricingPolicyId: 2,
    vehicleTypeId: 2, // Car
    policyName: 'Car Standard Tariff',
    effectiveStart: '2026-01-01',
    effectiveEnd: null,
    pricingPolicyStatus: 'Active',
    pricingWindows: [
      {
        pricingWindowId: 3,
        pricingPolicyId: 2,
        windowName: 'Day Slot',
        startTime: '06:00:00',
        endTime: '18:00:00',
        baseDurationMinutes: 120, // 2 hours
        basePrice: 20000,
        incrementBlockMinutes: 60, // 1 hour
        incrementPrice: 5000,
        windowCap: 50000,
        gracePeriodMinutes: 15
      },
      {
        pricingWindowId: 4,
        pricingPolicyId: 2,
        windowName: 'Night Slot',
        startTime: '18:00:00',
        endTime: '06:00:00',
        baseDurationMinutes: 720, // 12 hours
        basePrice: 50000,
        incrementBlockMinutes: 60, // 1 hour
        incrementPrice: 10000,
        windowCap: 150000,
        gracePeriodMinutes: 15
      }
    ]
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

  // Adapter Layer: Flatten nested StandardTariff schema to flat structure for the UI Table
  const tariffRows = useMemo(() => {
    const rows: TariffRow[] = [];
    tariffs.forEach((policy) => {
      policy.pricingWindows.forEach((window: PricingWindow) => {
        const vehicleTypeName = policy.vehicleTypeId === 1 ? 'Motorbike' : 'Car';
        const isNight = window.startTime === '18:00:00';
        const displayVehicle = isNight ? `${vehicleTypeName} (Night)` : vehicleTypeName;
        
        const hoursBase = window.baseDurationMinutes / 60;
        const formatBase = `${window.basePrice.toLocaleString('vi-VN')} VNĐ / ${hoursBase === 12 ? 'Night' : `${hoursBase} hrs`}`;
        
        const hoursInc = window.incrementBlockMinutes / 60;
        const formatInc = `+${window.incrementPrice.toLocaleString('vi-VN')} VNĐ / ${hoursInc} hr`;
        
        const formatCap = window.windowCap ? `Max ${window.windowCap.toLocaleString('vi-VN')} VNĐ` : 'No Cap';
        const formatGrace = `${window.gracePeriodMinutes} mins`;
        
        rows.push({
          id: `${policy.pricingPolicyId}-${window.pricingWindowId}`, // format: "policyId-windowId"
          vehicleType: displayVehicle,
          timeSlot: `${window.windowName}: ${window.startTime.substring(0, 5)}-${window.endTime.substring(0, 5)}`,
          baseRate: formatBase,
          incrementalRate: formatInc,
          dailyCap: formatCap,
          gracePeriod: formatGrace,
          isActive: policy.pricingPolicyStatus === 'Active',
          details: {
            basePrice: window.basePrice,
            initialDuration: hoursBase.toString(),
            blockPrice: window.incrementPrice,
            increment: hoursInc.toString(),
            startTime: window.startTime.substring(0, 5),
            endTime: window.endTime.substring(0, 5),
            maxCap: window.windowCap || 0,
            graceVal: window.gracePeriodMinutes.toString()
          }
        });
      });
    });
    return rows;
  }, [tariffs]);

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

  // Currently editing objects - stored as a tariff row format to bind with Modal forms
  const [editingTariff, setEditingTariff] = useState<TariffRow | null>(null);
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
  const handleOpenEditTariff = (tariffRow: TariffRow) => {
    setEditingTariff(tariffRow);
    setFormTariffName(tariffRow.vehicleType + ' ' + (tariffRow.timeSlot.includes('Night') ? 'Night' : 'Day') + ' Tariff');
    setFormTariffVehicleType(tariffRow.vehicleType.includes('Motorbike') ? 'Motorbike' : 'Car');
    setFormTariffStartTime(tariffRow.details.startTime);
    setFormTariffEndTime(tariffRow.details.endTime);
    setFormTariffBasePrice(tariffRow.details.basePrice);
    setFormTariffInitialDuration(tariffRow.details.initialDuration);
    setFormTariffBlockPrice(tariffRow.details.blockPrice);
    setFormTariffIncrement(tariffRow.details.increment);
    setFormTariffMaxCap(tariffRow.details.maxCap);
    setFormTariffGraceVal(tariffRow.details.graceVal);
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

    const [policyIdStr, windowIdStr] = editingTariff.id.split('-');
    const policyId = parseInt(policyIdStr);
    const windowId = parseInt(windowIdStr);

    const updated = tariffs.map((policy) => {
      if (policy.pricingPolicyId === policyId) {
        const updatedWindows = policy.pricingWindows.map((window) => {
          if (window.pricingWindowId === windowId) {
            return {
              ...window,
              startTime: formTariffStartTime + ':00',
              endTime: formTariffEndTime + ':00',
              baseDurationMinutes: parseFloat(formTariffInitialDuration) * 60,
              basePrice: formTariffBasePrice,
              incrementBlockMinutes: parseFloat(formTariffIncrement) * 60,
              incrementPrice: formTariffBlockPrice,
              windowCap: formTariffMaxCap || null,
              gracePeriodMinutes: parseInt(formTariffGraceVal)
            };
          }
          return window;
        });
        return {
          ...policy,
          pricingWindows: updatedWindows
        };
      }
      return policy;
    });

    setTariffs(updated);
    handleCloseEditTariff();
    triggerToast('Pricing Policy updated successfully!');
  };

  const handleToggleTariffStatus = (id: string) => {
    const [policyIdStr] = id.split('-');
    const policyId = parseInt(policyIdStr);

    setTariffs(
      tariffs.map((policy) => {
        if (policy.pricingPolicyId === policyId) {
          const nextStatus = policy.pricingPolicyStatus === 'Active' ? 'Inactive' : 'Active';
          return {
            ...policy,
            pricingPolicyStatus: nextStatus
          };
        }
        return policy;
      })
    );

    const affectedPolicy = tariffs.find((p) => p.pricingPolicyId === policyId);
    const vehicleName = affectedPolicy?.vehicleTypeId === 1 ? 'Motorbike' : 'Car';
    triggerToast(`${vehicleName} Policy status updated!`);
  };

  const handleDeleteTariff = (id: string) => {
    const [policyIdStr, windowIdStr] = id.split('-');
    const policyId = parseInt(policyIdStr);
    const windowId = parseInt(windowIdStr);

    setTariffs(
      tariffs.map((policy) => {
        if (policy.pricingPolicyId === policyId) {
          return {
            ...policy,
            pricingWindows: policy.pricingWindows.filter((w) => w.pricingWindowId !== windowId)
          };
        }
        return policy;
      }).filter((policy) => policy.pricingWindows.length > 0)
    );
    triggerToast('Policy window deleted successfully!');
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
    tariffs: tariffRows,
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
