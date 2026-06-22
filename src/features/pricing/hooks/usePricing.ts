import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/features/auth';
import { api } from '@/lib/api/client';

interface ApiErrorLike {
  status?: number;
  message?: string;
  name?: string;
  data?: {
    message?: string;
    errors?: Record<string, string[] | string> | string[];
  };
}

const simplifyErrorMessage = (message: string): string => {
  if (!message) return message;
  const lower = message.toLowerCase();
  if (
    message.includes('BR-FEE-029') || 
    lower.includes('active policies cannot be modified') || 
    lower.includes('cannot modify pricing configuration for active policy')
  ) {
    return 'Active policies cannot be modified.';
  }
  return message;
};

// Helper to extract clean error message from API response or JavaScript Error
const extractErrorMessage = (error: unknown): string => {
  let rawMsg = '';
  if (error && typeof error === 'object') {
    const err = error as ApiErrorLike;
    const isApiError = err.name === 'ApiError' || ('status' in err && 'data' in err);
    if (isApiError && err.data) {
      const errorData = err.data;
      
      // 1. Check validation errors dictionary
      if (errorData.errors && typeof errorData.errors === 'object' && !Array.isArray(errorData.errors)) {
        const msgList: string[] = [];
        const dict = errorData.errors as Record<string, string[] | string>;
        for (const key in dict) {
          const val = dict[key];
          if (Array.isArray(val)) {
            msgList.push(...val);
          } else if (typeof val === 'string') {
            msgList.push(val);
          }
        }
        if (msgList.length > 0) {
          rawMsg = msgList.join(' | ');
        }
      }
      
      // 2. Check array errors
      if (!rawMsg && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
        rawMsg = errorData.errors.join(', ');
      }
      
      // 3. Check message
      if (!rawMsg && errorData.message) {
        rawMsg = errorData.message;
      }
    }
    
    if (!rawMsg && 'status' in err) {
      rawMsg = `API Error ${err.status}: ${err.message || 'Request failed'}`;
    }
  }
  if (!rawMsg) {
    rawMsg = error instanceof Error ? error.message : 'Unknown connection error';
  }
  return simplifyErrorMessage(rawMsg);
};
import { 
  StandardTariff, 
  PricingWindow, 
  TariffRow, 
  MonthlyMembership, 
  ServiceFeeOrPenalty, 
  FeePenaltyType, 
  TriggerType,
  CreatePricingWindowRequest,
  VehicleType
} from '../types';
import { validate24hCoverage, validateNoOverlap } from '../utils/pricingValidation';

// Mock fallback vehicle types
const mockVehicleTypes: VehicleType[] = [
  { id: 1, name: 'Motorbike', vehicleTypeStatus: 'ACTIVE' },
  { id: 2, name: 'Car', vehicleTypeStatus: 'ACTIVE' }
];

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

interface RawVehicleType {
  id?: number;
  Id?: number;
  name?: string;
  TypeName?: string;
  typeName?: string;
  Name?: string;
  description?: string;
  Description?: string;
  vehicleTypeStatus?: string;
  VehicleTypeStatus?: string;
}

export function usePricing() {
  const { user } = useAuth();



  // Main feature state lists
  const [tariffs, setTariffs] = useState<StandardTariff[]>(initialTariffs);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>(mockVehicleTypes);

  // Fetch vehicle types from API, fallback to mock data on error
  const fetchVehicleTypes = async () => {
    try {
      const response = await api.get<{ data?: RawVehicleType[], success?: boolean }>('/vehicle-types');
      if (response && response.success && Array.isArray(response.data)) {
        const mapped: VehicleType[] = response.data
          .filter((item: RawVehicleType) => (item.id ?? item.Id) !== undefined && (item.name ?? item.TypeName ?? item.typeName ?? item.Name) !== undefined)
          .map((item: RawVehicleType) => ({
            id: (item.id ?? item.Id) as number,
            name: (item.name ?? item.TypeName ?? item.typeName ?? item.Name) as string,
            description: item.description ?? item.Description,
            vehicleTypeStatus: item.vehicleTypeStatus ?? item.VehicleTypeStatus ?? 'ACTIVE'
          }));
        setVehicleTypes(mapped);
      } else {
        setVehicleTypes(mockVehicleTypes);
      }
    } catch (error) {
      console.error('Failed to fetch vehicle types from API, using mock fallback:', error);
      setVehicleTypes(mockVehicleTypes);
    }
  };

interface WindowApiResponse {
  pricingWindowId?: number;
  id?: number;
  pricingPolicyId?: number;
  windowName: string;
  startTime: string;
  endTime: string;
  baseDurationMinutes: number;
  basePrice: number;
  incrementBlockMinutes: number;
  incrementPrice: number;
  windowCap: number | null;
  gracePeriodMinutes: number;
}

interface PolicyApiResponse {
  pricingPolicyId?: number;
  id?: number;
  vehicleTypeId: number;
  policyName: string;
  effectiveStart: string;
  effectiveEnd: string | null;
  pricingPolicyStatus: string;
  pricingWindows: WindowApiResponse[];
}

  // Fetch pricing policies on component mount
  const fetchPolicies = async () => {
    try {
      const response = await api.get<{ data: PolicyApiResponse[], success: boolean }>('/pricing-policies');
      if (response && response.success && Array.isArray(response.data)) {
        if (response.data.length > 0) {
          const mappedPolicies: StandardTariff[] = response.data.map((policy: PolicyApiResponse) => ({
            pricingPolicyId: policy.pricingPolicyId ?? policy.id ?? 0,
            vehicleTypeId: policy.vehicleTypeId,
            policyName: policy.policyName,
            effectiveStart: policy.effectiveStart,
            effectiveEnd: policy.effectiveEnd,
            pricingPolicyStatus: policy.pricingPolicyStatus === 'Active' || policy.pricingPolicyStatus === 'ACTIVE' ? 'Active' : 'Inactive',
            pricingWindows: (policy.pricingWindows || []).map((win: WindowApiResponse) => ({
              pricingWindowId: win.pricingWindowId ?? win.id ?? 0,
              pricingPolicyId: win.pricingPolicyId ?? policy.id ?? policy.pricingPolicyId ?? 0,
              windowName: win.windowName,
              startTime: win.startTime,
              endTime: win.endTime,
              baseDurationMinutes: win.baseDurationMinutes,
              basePrice: win.basePrice,
              incrementBlockMinutes: win.incrementBlockMinutes,
              incrementPrice: win.incrementPrice,
              windowCap: win.windowCap,
              gracePeriodMinutes: win.gracePeriodMinutes
            }))
          }));
          setTariffs(mappedPolicies);
        }
      }
    } catch (error) {
      console.error('Failed to fetch pricing policies from API, using mock fallback:', error);
    }
  };

  useEffect(() => {
    fetchVehicleTypes();
    fetchPolicies();
  }, []);
  const [memberships, setMemberships] = useState<MonthlyMembership[]>(initialMemberships);
  const [fees, setFees] = useState<ServiceFeeOrPenalty[]>(initialFees);

  // Adapter Layer: Flatten nested StandardTariff schema to flat structure for the UI Table
  const tariffRows = useMemo(() => {
    const rows: TariffRow[] = [];
    tariffs.forEach((policy) => {
      policy.pricingWindows.forEach((window: PricingWindow) => {
        const matchingVehicle = vehicleTypes.find(v => v.id === policy.vehicleTypeId);
        const vehicleTypeName = matchingVehicle ? matchingVehicle.name : (policy.vehicleTypeId === 1 ? 'Motorbike' : 'Car');
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
  }, [tariffs, vehicleTypes]);

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
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  // --- State cho Modal Chỉnh sửa thông tin chính sách (Edit Policy) ---
  const [isEditPolicyOpen, setIsEditPolicyOpen] = useState(false);
  const [editPolicyTarget, setEditPolicyTarget] = useState<StandardTariff | null>(null);
  const [editPolicyName, setEditPolicyName] = useState('');
  const [editEffectiveStart, setEditEffectiveStart] = useState('');
  const [editEffectiveEnd, setEditEffectiveEnd] = useState('');

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
    setSubmitError(null);
    setEditingTariff(tariffRow);
    setFormTariffName(tariffRow.vehicleType + ' ' + (tariffRow.timeSlot.includes('Night') ? 'Night' : 'Day') + ' Tariff');
    const matchingVehicle = vehicleTypes.find(v => tariffRow.vehicleType.toLowerCase().includes(v.name.toLowerCase()));
    setFormTariffVehicleType(matchingVehicle ? matchingVehicle.name : (tariffRow.vehicleType.includes('Motorbike') ? 'Motorbike' : 'Car'));
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
    setSubmitError(null);
    setIsEditTariffOpen(false);
    setEditingTariff(null);
  };

  const handleSaveTariff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTariff) return;
    setSubmitError(null);

    if (formTariffBasePrice <= 0 || formTariffBlockPrice <= 0) {
      setSubmitError('Please input positive values for rates.');
      triggerToast('Please input positive values for rates.', 'error');
      return;
    }

    const hasCap = formTariffEnableCap && !removeWindowCap;
    if (hasCap && formTariffMaxCap <= formTariffBasePrice) {
      setSubmitError('Daily Cap must be greater than Base Price.');
      triggerToast('Daily Cap must be greater than Base Price.', 'error');
      return;
    }

    const [policyIdStr, windowIdStr] = editingTariff.id.split('-');
    const policyId = parseInt(policyIdStr);
    const windowId = parseInt(windowIdStr);

    const targetWindow = tariffs.find(p => p.pricingPolicyId === policyId)?.pricingWindows.find(w => w.pricingWindowId === windowId);
    if (!targetWindow) return;

    const requestBody = {
      windowName: targetWindow.windowName,
      startTime: formTariffStartTime + (formTariffStartTime.length === 5 ? ':00' : ''),
      endTime: formTariffEndTime + (formTariffEndTime.length === 5 ? ':00' : ''),
      baseDurationMinutes: parseFloat(formTariffInitialDuration) * 60,
      basePrice: formTariffBasePrice,
      incrementBlockMinutes: parseFloat(formTariffIncrement) * 60,
      incrementPrice: formTariffBlockPrice,
      windowCap: hasCap ? formTariffMaxCap : null,
      removeWindowCap: !hasCap,
      gracePeriodMinutes: parseInt(formTariffGraceVal)
    };

    try {
      const res = await api.put<{ success: boolean }>(`/pricing-policies/windows/${windowId}`, requestBody);
      if (res && res.success) {
        await fetchPolicies();
        triggerToast('Pricing Policy updated successfully!', 'success');
        handleCloseEditTariff();
      } else {
        setSubmitError('Failed to update pricing window.');
        triggerToast('Failed to update pricing window.', 'error');
      }
    } catch (error) {
      console.error('Failed to update pricing window via API:', error);
      const errorMsg = extractErrorMessage(error);
      setSubmitError(errorMsg);
      triggerToast(errorMsg, 'error');
    }
  };

  const handleToggleTariffStatus = async (id: string) => {
    const [policyIdStr] = id.split('-');
    const policyId = parseInt(policyIdStr);
    const policy = tariffs.find(p => p.pricingPolicyId === policyId);
    if (!policy) return;

    const nextStatus = policy.pricingPolicyStatus === 'Active' ? 'Inactive' : 'Active';
    const matchingVehicle = vehicleTypes.find(v => v.id === policy.vehicleTypeId);
    const vehicleName = matchingVehicle ? matchingVehicle.name : (policy.vehicleTypeId === 1 ? 'Motorbike' : 'Car');

    if (nextStatus === 'Active') {
      try {
        const res = await api.post<{ success: boolean }>(`/pricing-policies/${policyId}/activate`, {});
        if (res && res.success) {
          await fetchPolicies();
          triggerToast(`${vehicleName} Policy status updated to Active!`, 'success');
        } else {
          triggerToast(`Failed to activate ${vehicleName} Policy.`, 'error');
        }
      } catch (error) {
        console.error('Failed to activate policy:', error);
        const errorMsg = extractErrorMessage(error);
        triggerToast(errorMsg, 'error');
      }
    } else {
      triggerToast(`To deactivate this policy, please activate another policy for the same vehicle type.`, 'error');
    }
  };

  const handleDeleteTariff = async (id: string) => {
    const [_, windowIdStr] = id.split('-');
    const windowId = parseInt(windowIdStr);

    try {
      const res = await api.delete<{ success: boolean }>(`/pricing-policies/windows/${windowId}`);
      if (res && res.success) {
        await fetchPolicies();
        triggerToast('Policy window deleted successfully!', 'success');
      } else {
        triggerToast('Failed to delete pricing window.', 'error');
      }
    } catch (error) {
      console.error('Failed to delete pricing window via API:', error);
      const errorMsg = extractErrorMessage(error);
      triggerToast(errorMsg, 'error');
    }
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
    setSubmitError(null);
    setNewPolicyName('');
    setNewVehicleTypeId(1);
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const tzOffset = tomorrow.getTimezoneOffset() * 60000;
    const localTomorrowISO = new Date(tomorrow.getTime() - tzOffset).toISOString().slice(0, 10);
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
    setSubmitError(null);
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

  const handleSaveCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!newPolicyName.trim()) {
      setSubmitError('Please enter the pricing policy name.');
      triggerToast('Please enter the pricing policy name.', 'error');
      return;
    }
    if (!newEffectiveStart) {
      setSubmitError('Please select the effective start date.');
      triggerToast('Please select the effective start date.', 'error');
      return;
    }
    if (newWindows.length === 0) {
      setSubmitError('The policy must contain at least 1 pricing window.');
      triggerToast('The policy must contain at least 1 pricing window.', 'error');
      return;
    }

    const coverage = validate24hCoverage(newWindows);
    if (!coverage.isValid) {
      setSubmitError(coverage.message);
      triggerToast(coverage.message, 'error');
      return;
    }

    const overlap = validateNoOverlap(newWindows);
    if (!overlap.isValid) {
      setSubmitError(overlap.conflictPairs[0]);
      triggerToast(overlap.conflictPairs[0], 'error');
      return;
    }

    const todayLocal = new Date();
    const tzOffset = todayLocal.getTimezoneOffset() * 60000;
    const todayStr = new Date(todayLocal.getTime() - tzOffset).toISOString().slice(0, 10);
    if (newEffectiveStart < todayStr) {
      setSubmitError('Start date cannot be in the past.');
      triggerToast('Start date cannot be in the past.', 'error');
      return;
    }

    if (newEffectiveEnd) {
      if (newEffectiveEnd <= newEffectiveStart) {
        setSubmitError('End date must be after start date.');
        triggerToast('End date must be after start date.', 'error');
        return;
      }
    }

    const requestBody = {
      vehicleTypeId: newVehicleTypeId,
      policyName: newPolicyName,
      effectiveStart: `${newEffectiveStart}T00:00:00.000Z`,
      effectiveEnd: newEffectiveEnd ? `${newEffectiveEnd}T00:00:00.000Z` : null,
      pricingWindows: newWindows.map(w => ({
        windowName: w.windowName,
        startTime: w.startTime + (w.startTime.length === 5 ? ':00' : ''),
        endTime: w.endTime + (w.endTime.length === 5 ? ':00' : ''),
        baseDurationMinutes: w.baseDurationMinutes,
        basePrice: w.basePrice,
        incrementBlockMinutes: w.incrementBlockMinutes,
        incrementPrice: w.incrementPrice,
        windowCap: w.windowCap,
        gracePeriodMinutes: w.gracePeriodMinutes
      }))
    };

    try {
      const res = await api.post<{ success: boolean }>('/pricing-policies', requestBody);
      if (res && res.success) {
        await fetchPolicies();
        triggerToast('New pricing policy created successfully!', 'success');
        setIsCreatePolicyOpen(false);
      } else {
        setSubmitError('Failed to create pricing policy.');
        triggerToast('Failed to create pricing policy.', 'error');
      }
    } catch (error) {
      console.error('Failed to create pricing policy via API:', error);
      const errorMsg = extractErrorMessage(error);
      setSubmitError(errorMsg);
      triggerToast(errorMsg, 'error');
    }
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

  const handleConfirmActivate = async () => {
    if (!activatingPolicy) return;
    
    const targetPolicyId = activatingPolicy.pricingPolicyId;

    try {
      const res = await api.post<{ success: boolean }>(`/pricing-policies/${targetPolicyId}/activate`, {});
      if (res && res.success) {
        await fetchPolicies();
        triggerToast(`Pricing policy "${activatingPolicy.policyName}" activated successfully!`, 'success');
        setIsActivateDialogOpen(false);
        setActivatingPolicy(null);
      } else {
        triggerToast(`Failed to activate pricing policy.`, 'error');
      }
    } catch (error) {
      console.error('Failed to activate pricing policy via API:', error);
      const errorMsg = extractErrorMessage(error);
      triggerToast(errorMsg, 'error');
    }
  };

  // --- Handlers cho Edit Policy ---
  const handleOpenEditPolicy = (policy: StandardTariff) => {
    setSubmitError(null);
    setEditPolicyTarget(policy);
    setEditPolicyName(policy.policyName);
    
    const startStr = policy.effectiveStart ? policy.effectiveStart.split('T')[0] : '';
    const endStr = policy.effectiveEnd ? policy.effectiveEnd.split('T')[0] : '';
    
    setEditEffectiveStart(startStr);
    setEditEffectiveEnd(endStr);
    setIsEditPolicyOpen(true);
  };

  const handleCloseEditPolicy = () => {
    setIsEditPolicyOpen(false);
    setEditPolicyTarget(null);
    setEditPolicyName('');
    setEditEffectiveStart('');
    setEditEffectiveEnd('');
    setSubmitError(null);
  };

  const handleSaveEditPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPolicyTarget) return;

    setSubmitError(null);
    if (!editPolicyName.trim()) {
      setSubmitError('Please enter the pricing policy name.');
      triggerToast('Please enter the pricing policy name.', 'error');
      return;
    }

    try {
      if (editEffectiveEnd && editEffectiveStart && editEffectiveEnd < editEffectiveStart) {
        throw new Error('End date must be after start date.');
      }

      const isActive = editPolicyTarget.pricingPolicyStatus?.toLowerCase() === 'active';
      const requestBody: {
        policyName: string;
        pricingPolicyStatus: string | null;
        effectiveStart?: string;
        effectiveEnd: string | null;
      } = {
        policyName: editPolicyName.trim(),
        pricingPolicyStatus: null,
        effectiveEnd: editEffectiveEnd ? `${editEffectiveEnd}T00:00:00.000Z` : null
      };

      if (!isActive) {
        if (!editEffectiveStart) {
          throw new Error('Please select the effective start date.');
        }
        requestBody.effectiveStart = `${editEffectiveStart}T00:00:00.000Z`;
      }

      const res = await api.put<{ success: boolean }>(`/pricing-policies/${editPolicyTarget.pricingPolicyId}`, requestBody);
      if (res && res.success) {
        await fetchPolicies();
        triggerToast('Pricing policy updated successfully!', 'success');
        handleCloseEditPolicy();
      } else {
        setSubmitError('Failed to update pricing policy.');
        triggerToast('Failed to update pricing policy.', 'error');
      }
    } catch (error) {
      console.error('Failed to update pricing policy via API:', error);
      const errorMsg = extractErrorMessage(error);
      setSubmitError(errorMsg);
      triggerToast(errorMsg, 'error');
    }
  };

  // --- Handlers cho Add Window (S5) ---
  const handleOpenAddWindow = (policyId: number) => {
    setSubmitError(null);
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
    setSubmitError(null);
    setIsAddWindowOpen(false);
    setAddWindowTargetPolicyId(null);
  };

  const handleSaveAddWindow = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!addWindowTargetPolicyId) return;

    if (!formAddWindowName.trim()) {
      setSubmitError('Please enter a window name.');
      triggerToast('Please enter a window name.', 'error');
      return;
    }

    if (formAddWindowBasePrice <= 0 || formAddWindowBlockPrice <= 0) {
      setSubmitError('Base price and Block price must be greater than 0.');
      triggerToast('Base price and Block price must be greater than 0.', 'error');
      return;
    }

    if (formAddWindowEnableCap && formAddWindowMaxCap <= formAddWindowBasePrice) {
      setSubmitError('Daily cap must be greater than the base price.');
      triggerToast('Daily cap must be greater than the base price.', 'error');
      return;
    }

    const parentPolicy = tariffs.find(p => p.pricingPolicyId === addWindowTargetPolicyId);
    if (!parentPolicy) return;

    const newWinReq = {
      windowName: formAddWindowName,
      startTime: formAddWindowStartTime + (formAddWindowStartTime.length === 5 ? ':00' : ''),
      endTime: formAddWindowEndTime + (formAddWindowEndTime.length === 5 ? ':00' : ''),
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

    const overlap = validateNoOverlap([...existingWinsMapped, {
      ...newWinReq,
      startTime: formAddWindowStartTime.substring(0, 5),
      endTime: formAddWindowEndTime.substring(0, 5)
    }]);
    if (!overlap.isValid) {
      setSubmitError(overlap.conflictPairs[0]);
      triggerToast(overlap.conflictPairs[0], 'error');
      return;
    }

    try {
      const res = await api.post<{ success: boolean }>(`/pricing-policies/${addWindowTargetPolicyId}/windows`, newWinReq);
      if (res && res.success) {
        await fetchPolicies();
        triggerToast('New pricing window added successfully!', 'success');
        setIsAddWindowOpen(false);
      } else {
        setSubmitError('Failed to add pricing window.');
        triggerToast('Failed to add pricing window.', 'error');
      }
    } catch (error) {
      console.error('Failed to add pricing window via API:', error);
      const errorMsg = extractErrorMessage(error);
      setSubmitError(errorMsg);
      triggerToast(errorMsg, 'error');
    }
  };

  return {
    user,
    activeTab,
    setActiveTab,
    tariffs, // Dữ liệu StandardTariff[] gốc cho Policy Card View
    tariffRows, // flat rows nếu các component khác cần dùng
    memberships,
    fees,
    vehicleTypes,
    fetchVehicleTypes,
    showToast,
    toastMessage,
    toastType,
    triggerToast,
    submitError,
    setSubmitError,

    // Modal control toggles
    isEditTariffOpen,
    isEditMembershipOpen,
    isFeeModalOpen,

    // S1, S2, S5 control toggles
    isCreatePolicyOpen,
    isActivateDialogOpen,
    isAddWindowOpen,
    isEditPolicyOpen,

    // Editing targets
    editingTariff,
    editingMembership,
    editingFee,
    activatingPolicy,
    editPolicyTarget,

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

    // Edit Policy Handlers & Fields
    editPolicyName,
    setEditPolicyName,
    editEffectiveStart,
    setEditEffectiveStart,
    editEffectiveEnd,
    setEditEffectiveEnd,
    handleOpenEditPolicy,
    handleCloseEditPolicy,
    handleSaveEditPolicy,

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
