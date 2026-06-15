import { useState, useMemo } from 'react';
import { useAuth } from '@/features/auth';
import { 
  StandardTariff, 
  PricingWindow, 
  TariffRow, 
  MonthlyMembership, 
  ServiceFeeOrPenalty, 
  FeePenaltyType, 
  TriggerType,
  CreatePricingWindowRequest
} from '../types';
import { validate24hCoverage, validateNoOverlap } from '../utils/pricingValidation';



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
    price: '200,000 VND / month',
    priceNum: 200000
  },
  {
    id: 'm2',
    vehicleType: 'Car',
    price: '1,500,000 VND / month',
    priceNum: 1500000
  }
];

const initialFees: ServiceFeeOrPenalty[] = [
  {
    id: 'f1',
    name: 'Booking Deposit',
    type: 'deposit',
    amount: '5,000 VND',
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
    amount: '50,000 VND',
    amountNum: 50000,
    description: 'Requires immediate reporting.',
    triggerType: 'manual',
    isActive: true
  },
  {
    id: 'f3',
    name: 'Wrong Zone Penalty',
    type: 'wrongzone',
    amount: '100,000 VND',
    amountNum: 100000,
    description: 'Applied per incident.',
    triggerType: 'manual',
    isActive: true
  }
];

export function usePricing() {
  const { user } = useAuth();



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
        const formatBase = `${window.basePrice.toLocaleString('en-US')} VND / ${hoursBase === 12 ? 'Night' : `${hoursBase} hrs`}`;
        
        const hoursInc = window.incrementBlockMinutes / 60;
        const formatInc = `+${window.incrementPrice.toLocaleString('en-US')} VND / ${hoursInc} hr`;
        
        const formatCap = window.windowCap ? `Max ${window.windowCap.toLocaleString('en-US')} VND` : 'No Cap';
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

  // Form Inputs for Standard Tariffs (S3 Edit)
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
  const [formTariffEnableCap, setFormTariffEnableCap] = useState(false);
  const [removeWindowCap, setRemoveWindowCap] = useState(false);

  // --- State cho Modal Tạo mới chính sách (S1) ---
  const [isCreatePolicyOpen, setIsCreatePolicyOpen] = useState(false);
  const [newPolicyName, setNewPolicyName] = useState('');
  const [newVehicleTypeId, setNewVehicleTypeId] = useState<number>(1); // 1 = Motorbike, 2 = Car
  const [newEffectiveStart, setNewEffectiveStart] = useState('');
  const [newEffectiveEnd, setNewEffectiveEnd] = useState('');
  const [newWindows, setNewWindows] = useState<CreatePricingWindowRequest[]>([]);

  // --- State cho Dialog Kích hoạt (S2) ---
  const [isActivateDialogOpen, setIsActivateDialogOpen] = useState(false);
  const [activatingPolicy, setActivatingPolicy] = useState<StandardTariff | null>(null);

  // --- State cho Modal Thêm khung giờ vào chính sách có sẵn (S5) ---
  const [isAddWindowOpen, setIsAddWindowOpen] = useState(false);
  const [addWindowTargetPolicyId, setAddWindowTargetPolicyId] = useState<number | null>(null);
  
  // Form inputs for Add Pricing Window Modal (S5)
  const [formAddWindowName, setFormAddWindowName] = useState('');
  const [formAddWindowStartTime, setFormAddWindowStartTime] = useState('06:00');
  const [formAddWindowEndTime, setFormAddWindowEndTime] = useState('18:00');
  const [formAddWindowBasePrice, setFormAddWindowBasePrice] = useState(0);
  const [formAddWindowInitialDuration, setFormAddWindowInitialDuration] = useState('4');
  const [formAddWindowBlockPrice, setFormAddWindowBlockPrice] = useState(0);
  const [formAddWindowIncrement, setFormAddWindowIncrement] = useState('1');
  const [formAddWindowEnableCap, setFormAddWindowEnableCap] = useState(false);
  const [formAddWindowMaxCap, setFormAddWindowMaxCap] = useState(0);
  const [formAddWindowGraceVal, setFormAddWindowGraceVal] = useState('15');


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
    setFormTariffEnableCap(tariffRow.details.maxCap > 0);
    setRemoveWindowCap(false);
    setIsEditTariffOpen(true);
  };

  const handleCloseEditTariff = () => {
    setIsEditTariffOpen(false);
    setEditingTariff(null);
  };

  const handleSaveTariff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTariff) return;

    if (formTariffBasePrice <= 0 || formTariffBlockPrice <= 0) {
      triggerToast('Please input positive values for rates.', 'error');
      return;
    }

    const hasCap = formTariffEnableCap && !removeWindowCap;
    if (hasCap && formTariffMaxCap <= formTariffBasePrice) {
      triggerToast('Daily Cap must be greater than Base Price.', 'error');
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
              startTime: formTariffStartTime + (formTariffStartTime.length === 5 ? ':00' : ''),
              endTime: formTariffEndTime + (formTariffEndTime.length === 5 ? ':00' : ''),
              baseDurationMinutes: parseFloat(formTariffInitialDuration) * 60,
              basePrice: formTariffBasePrice,
              incrementBlockMinutes: parseFloat(formTariffIncrement) * 60,
              incrementPrice: formTariffBlockPrice,
              windowCap: hasCap ? formTariffMaxCap : null,
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
              price: `${formMembershipPrice.toLocaleString('en-US')} VND / month`
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
                amount: `${formFeeAmount.toLocaleString('en-US')} VND`,
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
        amount: `${formFeeAmount.toLocaleString('en-US')} VND`,
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

  // --- Handlers cho Create Policy (S1) ---
  const handleOpenCreatePolicy = () => {
    setNewPolicyName('');
    setNewVehicleTypeId(1);
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const tzOffset = tomorrow.getTimezoneOffset() * 60000;
    const localTomorrowISO = new Date(tomorrow.getTime() - tzOffset).toISOString().slice(0, 16);
    setNewEffectiveStart(localTomorrowISO);
    setNewEffectiveEnd('');
    setNewWindows([{
      windowName: 'Day Slot',
      startTime: '06:00',
      endTime: '18:00',
      baseDurationMinutes: 240,
      basePrice: 5000,
      incrementBlockMinutes: 60,
      incrementPrice: 1000,
      windowCap: 10000,
      gracePeriodMinutes: 15,
    }]);
    setIsCreatePolicyOpen(true);
  };

  const handleCloseCreatePolicy = () => {
    setIsCreatePolicyOpen(false);
  };

  const handleAddNewWindow = () => {
    setNewWindows(prev => [...prev, {
      windowName: `Window ${prev.length + 1}`,
      startTime: '00:00',
      endTime: '00:00',
      baseDurationMinutes: 60,
      basePrice: 0,
      incrementBlockMinutes: 60,
      incrementPrice: 0,
      windowCap: null,
      gracePeriodMinutes: 0,
    }]);
  };

  const handleRemoveNewWindow = (index: number) => {
    setNewWindows(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateNewWindow = (
    index: number,
    field: keyof CreatePricingWindowRequest,
    value: string | number | null
  ) => {
    setNewWindows(prev =>
      prev.map((w, i) => i === index ? { ...w, [field]: value } : w)
    );
  };

  const handleSaveCreatePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPolicyName.trim()) {
      triggerToast('Please enter the pricing policy name.', 'error');
      return;
    }
    if (!newEffectiveStart) {
      triggerToast('Please select the effective start date.', 'error');
      return;
    }
    if (newWindows.length === 0) {
      triggerToast('The policy must contain at least 1 pricing window.', 'error');
      return;
    }

    const coverage = validate24hCoverage(newWindows);
    if (!coverage.isValid) {
      triggerToast(coverage.message, 'error');
      return;
    }

    const overlap = validateNoOverlap(newWindows);
    if (!overlap.isValid) {
      triggerToast(overlap.conflictPairs[0], 'error');
      return;
    }

    const start = new Date(newEffectiveStart);
    if (start.getTime() < Date.now() - 60000) {
      triggerToast('Start date cannot be in the past.', 'error');
      return;
    }

    if (newEffectiveEnd) {
      const end = new Date(newEffectiveEnd);
      const minEnd = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      if (end.getTime() < minEnd.getTime()) {
        triggerToast('End date must be at least 1 day after start date.', 'error');
        return;
      }
    }

    const newPolicy: StandardTariff = {
      pricingPolicyId: Date.now(),
      vehicleTypeId: newVehicleTypeId,
      policyName: newPolicyName,
      effectiveStart: newEffectiveStart,
      effectiveEnd: newEffectiveEnd || null,
      pricingPolicyStatus: 'Inactive',
      pricingWindows: newWindows.map((w, idx) => ({
        pricingWindowId: Date.now() + idx,
        pricingPolicyId: Date.now(),
        windowName: w.windowName,
        startTime: w.startTime + ':00',
        endTime: w.endTime + ':00',
        baseDurationMinutes: w.baseDurationMinutes,
        basePrice: w.basePrice,
        incrementBlockMinutes: w.incrementBlockMinutes,
        incrementPrice: w.incrementPrice,
        windowCap: w.windowCap,
        gracePeriodMinutes: w.gracePeriodMinutes
      }))
    };

    setTariffs(prev => [...prev, newPolicy]);
    setIsCreatePolicyOpen(false);
    triggerToast('New pricing policy created successfully!', 'success');
  };

  // --- Handlers cho Activate Policy (S2) ---
  const handleOpenActivateDialog = (policy: StandardTariff) => {
    setActivatingPolicy(policy);
    setIsActivateDialogOpen(true);
  };

  const handleCloseActivateDialog = () => {
    setIsActivateDialogOpen(false);
    setActivatingPolicy(null);
  };

  const handleConfirmActivate = () => {
    if (!activatingPolicy) return;
    
    setTariffs(prev => prev.map(p => {
      if (p.pricingPolicyId === activatingPolicy.pricingPolicyId) {
        return { ...p, pricingPolicyStatus: 'Active' };
      } else if (p.vehicleTypeId === activatingPolicy.vehicleTypeId) {
        return { ...p, pricingPolicyStatus: 'Inactive' };
      }
      return p;
    }));

    setIsActivateDialogOpen(false);
    setActivatingPolicy(null);
    triggerToast(`Pricing policy "${activatingPolicy.policyName}" activated successfully!`, 'success');
  };

  // --- Handlers cho Add Window (S5) ---
  const handleOpenAddWindow = (policyId: number) => {
    setAddWindowTargetPolicyId(policyId);
    setFormAddWindowName('');
    setFormAddWindowStartTime('06:00');
    setFormAddWindowEndTime('18:00');
    setFormAddWindowBasePrice(0);
    setFormAddWindowInitialDuration('4');
    setFormAddWindowBlockPrice(0);
    setFormAddWindowIncrement('1');
    setFormAddWindowEnableCap(false);
    setFormAddWindowMaxCap(0);
    setFormAddWindowGraceVal('15');
    setIsAddWindowOpen(true);
  };

  const handleCloseAddWindow = () => {
    setIsAddWindowOpen(false);
    setAddWindowTargetPolicyId(null);
  };

  const handleSaveAddWindow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addWindowTargetPolicyId) return;

    if (!formAddWindowName.trim()) {
      triggerToast('Please enter a window name.', 'error');
      return;
    }

    if (formAddWindowBasePrice <= 0 || formAddWindowBlockPrice <= 0) {
      triggerToast('Base price must be greater than 0.', 'error');
      return;
    }

    if (formAddWindowEnableCap && formAddWindowMaxCap <= formAddWindowBasePrice) {
      triggerToast('Daily cap must be greater than the base price.', 'error');
      return;
    }

    const parentPolicy = tariffs.find(p => p.pricingPolicyId === addWindowTargetPolicyId);
    if (!parentPolicy) return;

    const newWinReq: CreatePricingWindowRequest = {
      windowName: formAddWindowName,
      startTime: formAddWindowStartTime,
      endTime: formAddWindowEndTime,
      baseDurationMinutes: parseFloat(formAddWindowInitialDuration) * 60,
      basePrice: formAddWindowBasePrice,
      incrementBlockMinutes: parseFloat(formAddWindowIncrement) * 60,
      incrementPrice: formAddWindowBlockPrice,
      windowCap: formAddWindowEnableCap ? formAddWindowMaxCap : null,
      gracePeriodMinutes: parseInt(formAddWindowGraceVal)
    };

    const existingWinsMapped: CreatePricingWindowRequest[] = parentPolicy.pricingWindows.map(w => ({
      windowName: w.windowName,
      startTime: w.startTime.substring(0, 5),
      endTime: w.endTime.substring(0, 5),
      baseDurationMinutes: w.baseDurationMinutes,
      basePrice: w.basePrice,
      incrementBlockMinutes: w.incrementBlockMinutes,
      incrementPrice: w.incrementPrice,
      windowCap: w.windowCap,
      gracePeriodMinutes: w.gracePeriodMinutes
    }));

    const overlap = validateNoOverlap([...existingWinsMapped, newWinReq]);
    if (!overlap.isValid) {
      triggerToast(overlap.conflictPairs[0], 'error');
      return;
    }

    setTariffs(prev => prev.map(p => {
      if (p.pricingPolicyId === addWindowTargetPolicyId) {
        const newWindow: PricingWindow = {
          pricingWindowId: Date.now(),
          pricingPolicyId: p.pricingPolicyId,
          windowName: newWinReq.windowName,
          startTime: newWinReq.startTime + ':00',
          endTime: newWinReq.endTime + ':00',
          baseDurationMinutes: newWinReq.baseDurationMinutes,
          basePrice: newWinReq.basePrice,
          incrementBlockMinutes: newWinReq.incrementBlockMinutes,
          incrementPrice: newWinReq.incrementPrice,
          windowCap: newWinReq.windowCap,
          gracePeriodMinutes: newWinReq.gracePeriodMinutes
        };
        return {
          ...p,
          pricingWindows: [...p.pricingWindows, newWindow]
        };
      }
      return p;
    }));

    setIsAddWindowOpen(false);
    triggerToast('New pricing window added successfully!', 'success');
  };

  return {
    user,
    activeTab,
    setActiveTab,
    tariffs, // Dữ liệu StandardTariff[] gốc cho Policy Card View
    tariffRows, // flat rows nếu các component khác cần dùng
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

    // S1, S2, S5 control toggles
    isCreatePolicyOpen,
    isActivateDialogOpen,
    isAddWindowOpen,

    // Editing targets
    editingTariff,
    editingMembership,
    editingFee,
    activatingPolicy,

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
    formTariffEnableCap,
    setFormTariffEnableCap,
    removeWindowCap,
    setRemoveWindowCap,

    // S1 Form Fields
    newPolicyName,
    setNewPolicyName,
    newVehicleTypeId,
    setNewVehicleTypeId,
    newEffectiveStart,
    setNewEffectiveStart,
    newEffectiveEnd,
    setNewEffectiveEnd,
    newWindows,
    setNewWindows,

    // S5 Form Fields
    formAddWindowName,
    setFormAddWindowName,
    formAddWindowStartTime,
    setFormAddWindowStartTime,
    formAddWindowEndTime,
    setFormAddWindowEndTime,
    formAddWindowBasePrice,
    setFormAddWindowBasePrice,
    formAddWindowInitialDuration,
    setFormAddWindowInitialDuration,
    formAddWindowBlockPrice,
    setFormAddWindowBlockPrice,
    formAddWindowIncrement,
    setFormAddWindowIncrement,
    formAddWindowEnableCap,
    setFormAddWindowEnableCap,
    formAddWindowMaxCap,
    setFormAddWindowMaxCap,
    formAddWindowGraceVal,
    setFormAddWindowGraceVal,

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

    // S1 Handlers
    handleOpenCreatePolicy,
    handleCloseCreatePolicy,
    handleAddNewWindow,
    handleRemoveNewWindow,
    handleUpdateNewWindow,
    handleSaveCreatePolicy,

    // S2 Handlers
    handleOpenActivateDialog,
    handleCloseActivateDialog,
    handleConfirmActivate,

    // S5 Handlers
    handleOpenAddWindow,
    handleCloseAddWindow,
    handleSaveAddWindow,

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
