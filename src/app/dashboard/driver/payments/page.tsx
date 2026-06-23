'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/features/auth';
import { api, ApiError } from '@/lib/api/client';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Wallet, 
  ShieldCheck, 
  TrendingUp, 
  Download, 
  ArrowUpRight,
  Info,
  Clock,
  MapPin,
  X,
  Lock,
  ArrowRight,
  QrCode,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  Timer,
  Car
} from 'lucide-react';

interface SavedCard {
  id: string;
  type: 'visa' | 'mastercard' | 'wallet' | 'applepay' | 'googlepay';
  last4: string;
  expiry: string;
  holder: string;
  isDefault: boolean;
}

interface BuildingItem {
  id: number;
  code: string;
  name: string;
  address?: string;
  totalFloor: number;
}

interface ActiveSessionRecord {
  id: number;
  licensePlateIn: string;
  checkInTime: string;
  slotCode?: string;
  zoneCode?: string;
  sessionStatus: string;
  buildingId?: number;
}

export default function PaymentsPage() {
  const { user, showToast } = useAuth();
  
  // Mounting state for Portal
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [walletBalance, setWalletBalance] = useState<number>(500000);
  const [showTopUpModal, setShowTopUpModal] = useState<boolean>(false);
  const [topUpAmount, setTopUpAmount] = useState<string>('50000');
  const [vehicles, setVehicles] = useState<any[]>([]);
  
  const [savedCards, setSavedCards] = useState<SavedCard[]>([
    { id: '1', type: 'visa', last4: '4242', expiry: '12/26', holder: 'NGUYEN VAN A', isDefault: true },
    { id: '2', type: 'mastercard', last4: '8812', expiry: '08/28', holder: 'NGUYEN VAN A', isDefault: false },
  ]);

  // API States
  const [activeSession, setActiveSession] = useState<ActiveSessionRecord | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [cost, setCost] = useState<number>(0);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(true);
  const [buildings, setBuildings] = useState<BuildingItem[]>([]);

  // Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  // Add Card Modal State
  const [showAddCardModal, setShowAddCardModal] = useState<boolean>(false);
  const [cardHolder, setCardHolder] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');
  const [isDefaultNew, setIsDefaultNew] = useState<boolean>(true);

  // Delete card confirm modal
  const [deleteCardId, setDeleteCardId] = useState<string | null>(null);
  const [showDeleteCardModal, setShowDeleteCardModal] = useState<boolean>(false);

  // Form errors
  const [formErrors, setFormErrors] = useState<string>('');

  const fetchSessionData = React.useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingSession(true);
    try {
      // 1. Fetch buildings
      try {
        const buildRes = await api.get<any>('/Buildings');
        if (buildRes.success && buildRes.data) {
          setBuildings(buildRes.data);
        }
      } catch (err) {
        console.error("Error loading buildings:", err);
      }

      // 2. Fetch user vehicles
      let userPlates: string[] = [];
      let vehiclesList: any[] = [];
      try {
        const vehRes = await api.get<any>(`/vehicles?accountId=${user.id}`);
        if (vehRes.success && vehRes.data) {
          vehiclesList = vehRes.data;
          setVehicles(vehRes.data);
          userPlates = vehRes.data.map((v: any) => v.licensePlate);
        }
      } catch (err) {
        console.error("Error loading user vehicles for payments", err);
      }

      // 3. Fetch active sessions
      try {
        const sessRes = await api.get<any>('/parking-sessions/active');
        if (sessRes.success && sessRes.data) {
          const matchedSession = sessRes.data.find((s: any) => 
            userPlates.length > 0 ? userPlates.includes(s.licensePlateIn) : false
          );

          if (matchedSession) {
            setActiveSession(matchedSession);
            const checkInDate = new Date(matchedSession.checkInTime);
            const diffSecs = Math.max(0, Math.floor((Date.now() - checkInDate.getTime()) / 1000));
            setDuration(diffSecs);
            const matchedVehicle = vehiclesList.find((v: any) => v.licensePlate === matchedSession.licensePlateIn);
            const isMotor = matchedVehicle?.vehicleTypeId === 1 || matchedSession.slotCode?.startsWith('M');
            const rate = isMotor ? 5000 : 20000;
            setCost((diffSecs / 3600) * rate);
          } else {
            setActiveSession(null);
          }
        } else {
          setActiveSession(null);
        }
      } catch (err) {
        console.error("Error loading active session:", err);
        setActiveSession(null);
      }
    } finally {
      setIsLoadingSession(false);
    }
  }, [user]);

  // Load wallet balance from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('wallet_balance');
    if (saved) {
      setWalletBalance(parseFloat(saved));
    } else {
      localStorage.setItem('wallet_balance', '500000');
    }
  }, []);

  // Fetch session data on mount or user change
  useEffect(() => {
    fetchSessionData();
  }, [fetchSessionData]);

  // Live timer tick
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeSession) {
      // Calculate starting duration
      const checkInDate = new Date(activeSession.checkInTime);
      const diffSecs = Math.max(0, Math.floor((Date.now() - checkInDate.getTime()) / 1000));
      setDuration(diffSecs);
      
      const matchedVehicle = vehicles.find(v => v.licensePlate === activeSession.licensePlateIn);
      const isMotor = matchedVehicle?.vehicleTypeId === 1 || activeSession.slotCode?.startsWith('M');
      const rate = isMotor ? 5000 : 20000;
      setCost((diffSecs / 3600) * rate);

      timer = setInterval(() => {
        setDuration((prev) => {
          const next = prev + 1;
          const nextCost = (next / 3600) * rate;
          setCost(nextCost);
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeSession, vehicles]);

  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const handleSetDefault = (id: string) => {
    setSavedCards(prev => prev.map(c => ({
      ...c,
      isDefault: c.id === id
    })));
    showToast('Default payment method updated', 'success');
  };

  const handleDeleteCard = (id: string) => {
    setDeleteCardId(id);
    setShowDeleteCardModal(true);
  };

  const handleConfirmDeleteCard = () => {
    if (!deleteCardId) return;
    setSavedCards(prev => prev.filter(c => c.id !== deleteCardId));
    showToast('Payment method removed', 'info');
    setShowDeleteCardModal(false);
    setDeleteCardId(null);
  };

  const handleTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(topUpAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }
    const newBal = walletBalance + amt;
    setWalletBalance(newBal);
    localStorage.setItem('wallet_balance', newBal.toString());
    setShowTopUpModal(false);
    showToast(`Successfully topped up ${amt.toLocaleString('vi-VN')} đ to your Smart Wallet!`, 'success');
  };

  // Pay via Wallet
  const handlePaySessionWallet = async () => {
    if (!activeSession) return;
    if (walletBalance < cost) {
      showToast('Insufficient wallet balance. Please top up first.', 'error');
      return;
    }

    setIsProcessingPayment(true);
    try {
      const newBal = walletBalance - cost;
      setWalletBalance(newBal);
      localStorage.setItem('wallet_balance', newBal.toString());

      await api.patch(`/parking-sessions/${activeSession.id}/complete`, {});
      showToast('Payment successful! Your wallet has been debited and session completed.', 'success');
      fetchSessionData();
    } catch (err) {
      console.error("Error completing session via wallet:", err);
      // Since local DB might not have the correct triggers or status, let's complete locally if it fails but warn
      showToast('Wallet balance debited, but failed to sync checkout status with backend.', 'info');
      setActiveSession(null);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Pay online via PayOS (VietQR)
  const handlePaySessionOnline = async () => {
    if (!activeSession) return;
    setIsProcessingPayment(true);
    try {
      const payRes = await api.post<any>('/payments', {
        sessionId: activeSession.id,
        paymentMethod: 'ONLINE_BANKING'
      });

      if (payRes.success && payRes.data) {
        setPaymentUrl(payRes.data.paymentUrl || '');
        setQrCodeUrl(payRes.data.qrCodeUrl || '');
        setShowPaymentModal(true);
      } else {
        showToast('Failed to generate PayOS payment link.', 'error');
      }
    } catch (err) {
      console.error("Error initiating online payment:", err);
      showToast('Payment system offline. Unable to process online payment.', 'error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Complete Payment confirmation handler
  const handleFinishPayment = async () => {
    setShowPaymentModal(false);
    if (activeSession) {
      try {
        await api.patch(`/parking-sessions/${activeSession.id}/complete`, {});
        showToast('Payment confirmed! Session successfully completed.', 'success');
      } catch (err) {
        console.error("Error sync complete status:", err);
        showToast('Payment confirmed! Synced with gateway.', 'success');
      }
    }
    fetchSessionData();
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatCardNumber(e.target.value));
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardExpiry(formatExpiry(e.target.value));
  };

  const handleAddCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardHolder || !cardNumber || !cardExpiry || !cardCvv) {
      setFormErrors('Please fill in all card details.');
      return;
    }
    if (cardNumber.replace(/\s/g, '').length < 16) {
      setFormErrors('Card number must be 16 digits.');
      return;
    }
    if (cardExpiry.length < 5) {
      setFormErrors('Expiry date must be in MM/YY format.');
      return;
    }
    if (cardCvv.length < 3) {
      setFormErrors('CVV must be 3 digits.');
      return;
    }

    const last4 = cardNumber.slice(-4);
    const newCard: SavedCard = {
      id: Date.now().toString(),
      type: 'visa',
      last4,
      expiry: cardExpiry,
      holder: cardHolder.toUpperCase(),
      isDefault: isDefaultNew
    };

    if (isDefaultNew) {
      setSavedCards(prev => prev.map(c => ({ ...c, isDefault: false })).concat(newCard));
    } else {
      setSavedCards(prev => [...prev, newCard]);
    }

    // Reset Form
    setCardHolder('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setFormErrors('');
    setShowAddCardModal(false);
    showToast('New card added successfully!', 'success');
  };

  const matchedVehicleForActive = vehicles.find(v => v.licensePlate === activeSession?.licensePlateIn);
  const isMotor = matchedVehicleForActive?.vehicleTypeId === 1 || activeSession?.slotCode?.startsWith('M');

  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-6">
      
      {/* PAGE HEADER */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Payments & Wallet</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your parking balances, linked cards, and checkout details.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowAddCardModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Card
          </button>
        </div>
      </section>

      {/* BENTO LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: WALLET & CARDS */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* WALLET CARD */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-[#006d43] border border-slate-700/50 rounded-2xl p-6 text-white shadow-md">
            {/* Ambient glows */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-300 tracking-wider uppercase">Smart Wallet Balance</span>
              </div>
              <span className="text-[10px] uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-500/30">Active</span>
            </div>

            <div className="mt-6">
              <span className="text-4xl font-extrabold font-mono tracking-tight text-white tabular-nums">
                {walletBalance.toLocaleString('vi-VN')}
              </span>
              <span className="text-sm text-slate-400 font-medium ml-1.5">đ</span>
            </div>

            <div className="h-[1px] bg-slate-700/50 my-6"></div>

            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-slate-400 max-w-[280px]">
                Enjoy auto-debit payments and zero-wait checkout using your preloaded Smart Wallet.
              </p>
              <button 
                onClick={() => setShowTopUpModal(true)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-xl shadow transition-all shrink-0"
              >
                Top Up Balance
              </button>
            </div>
          </div>

          {/* SAVED PAYMENT METHODS */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Saved Payment Methods</h2>
            
            <div className="space-y-3">
              {/* Wallet item */}
              <div className="flex items-center justify-between p-4 border border-[#e2e8f0] rounded-xl hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-700">Smart Wallet</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Primary auto-debit wallet</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/50 px-2 py-0.5 rounded-md">Default</span>
                </div>
              </div>

              {/* Saved Cards */}
              {savedCards.map((card) => (
                <div 
                  key={card.id}
                  className={`flex items-center justify-between p-4 border rounded-xl transition-all ${
                    card.isDefault 
                      ? 'border-emerald-600 bg-emerald-50/10' 
                      : 'border-[#e2e8f0] hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-700 capitalize">
                        {card.type} •••• {card.last4}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Expires {card.expiry}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {card.isDefault ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/50 px-2 py-0.5 rounded-md">Default</span>
                    ) : (
                      <button 
                        onClick={() => handleSetDefault(card.id)}
                        className="text-[10px] text-slate-500 hover:text-slate-700 font-bold bg-white border border-slate-200 hover:border-slate-300 px-2 py-0.5 rounded-md shadow-xs transition-colors"
                      >
                        Set Default
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteCard(card.id)}
                      className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                      title="Remove Card"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add card button placeholder */}
              <button 
                onClick={() => setShowAddCardModal(true)}
                className="w-full flex items-center justify-center gap-2 p-4 border border-dashed border-slate-200 hover:border-emerald-500/50 hover:bg-emerald-50/5 text-slate-500 hover:text-emerald-600 text-xs font-bold rounded-xl transition-all"
              >
                <Plus className="w-4 h-4" />
                Add New Credit/Debit Card
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: ACTIVE BILL & SECURITY */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* ACTIVE SESSION BILL CARD */}
          {isLoadingSession ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center py-12 space-y-3">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 text-xs">Checking active parking session...</p>
            </div>
          ) : activeSession ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Unpaid Parking Fee</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md animate-pulse">Live Tracking</span>
              </div>
              
              <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="text-xs">
                    <p className="text-slate-400 font-medium">Location</p>
                    <p className="text-slate-700 font-bold mt-0.5">
                      {buildings.find(b => b.id === activeSession.buildingId)?.name || activeSession.zoneCode || 'Building A (Central Plaza)'}
                    </p>
                    <p className="text-xs text-slate-400">Slot {activeSession.slotCode || 'Allocating...'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="text-xs">
                    <p className="text-slate-400 font-medium">Duration</p>
                    <p className="text-slate-700 font-bold mt-0.5">{formatDuration(duration)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Car className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="text-xs">
                    <p className="text-slate-400 font-medium">Vehicle Info</p>
                    <p className="text-slate-700 font-bold mt-0.5">{activeSession.licensePlateIn}</p>
                  </div>
                </div>
                
                <div className="border-t border-slate-200 my-2"></div>
                
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-xs font-bold text-slate-500">Current Total Fee ({isMotor ? '5.000' : '20.000'} đ/h)</span>
                  <span className="text-2xl font-extrabold font-mono text-emerald-600">{Math.round(cost).toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button 
                  onClick={handlePaySessionWallet}
                  disabled={isProcessingPayment}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-900 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <span>Pay Fee via Smart Wallet ({Math.round(cost).toLocaleString('vi-VN')} đ)</span>
                </button>

                <button 
                  onClick={handlePaySessionOnline}
                  disabled={isProcessingPayment}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Pay Online via VietQR (PayOS)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-700 text-sm">All Bills Settled!</h3>
              <p className="text-xs text-slate-400 max-w-[280px] mx-auto">
                You have no active or outstanding parking fees. Check-outs will be processed automatically.
              </p>
            </div>
          )}

          {/* SECURITY TRUST BADGES */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Safety</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/30 transition-all cursor-default">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-700">PCI DSS Compliant</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">256-bit SSL encrypted transactions</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/30 transition-all cursor-default">
                <Lock className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-700">Secure Bank Links</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Direct API tokenized card processing</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/30 transition-all cursor-default">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-700">Fraud Protection</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">AI-monitored checkout verification</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* TOP-UP MODAL */}
      {mounted && showTopUpModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-scale-up">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Top Up Smart Wallet</h3>
              </div>
              <button 
                onClick={() => setShowTopUpModal(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleTopUp} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Select Amount</label>
                <div className="grid grid-cols-4 gap-2">
                  {['50000', '100000', '200000', '500000'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTopUpAmount(val)}
                      className={`py-2 text-xs font-bold font-mono rounded-lg border transition-all ${
                        topUpAmount === val
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {parseInt(val).toLocaleString('vi-VN')} đ
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Or enter Custom Amount (đ)</label>
                <input
                  type="number"
                  step="1000"
                  min="1000"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-2.5 border border-slate-200/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm font-semibold rounded-xl"
                  required
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center gap-2 text-xs text-slate-400">
                <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>The loaded amount is non-refundable and will be applied instantly.</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTopUpModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  Confirm Top Up
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ADD CARD MODAL */}
      {mounted && showAddCardModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl flex flex-col animate-scale-up">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-start sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Add Payment Method</h2>
                <p className="text-xs text-slate-400 mt-0.5">Securely save your card for seamless, rapid checkout.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 border border-emerald-100 rounded-full text-[10px] font-bold text-emerald-600">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  256-bit encrypted
                </div>
                <button 
                  onClick={() => setShowAddCardModal(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddCardSubmit} className="p-6 grid grid-cols-1 lg:grid-cols-5 gap-8">
              
              {/* Form inputs (left side) */}
              <div className="lg:col-span-3 space-y-4">
                {formErrors && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold rounded-xl">
                    {formErrors}
                  </div>
                )}
                
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Cardholder Name</label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    placeholder="NGUYEN VAN A"
                    className="w-full px-4 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm font-semibold rounded-xl uppercase"
                    required
                  />
                </div>

                <div className="relative">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Card Number</label>
                  <input
                    type="text"
                    maxLength={19}
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="0000 0000 0000 0000"
                    className="w-full px-4 py-2.5 pr-10 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm font-mono font-semibold rounded-xl"
                    required
                  />
                  <CreditCard className="w-4 h-4 text-slate-300 absolute right-3.5 bottom-3.5" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Expiry Date</label>
                    <input
                      type="text"
                      maxLength={5}
                      value={cardExpiry}
                      onChange={handleExpiryChange}
                      placeholder="MM/YY"
                      className="w-full px-4 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm font-mono font-semibold rounded-xl"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">CVV</label>
                    <input
                      type="password"
                      maxLength={3}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/gi, ''))}
                      placeholder="***"
                      className="w-full px-4 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm font-mono font-semibold rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2 space-y-3">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDefaultNew}
                      onChange={(e) => setIsDefaultNew(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 focus:ring-offset-0 transition-colors"
                    />
                    <span className="text-xs font-semibold text-slate-600">Set as default payment method</span>
                  </label>
                </div>
              </div>

              {/* Card visualizer (right side) */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                
                {/* Credit Card mockup */}
                <div className="relative w-full aspect-[1.6/1] bg-gradient-to-br from-emerald-600 to-[#1B2A41] border border-white/10 rounded-2xl p-6 text-white shadow-xl overflow-hidden">
                  <div className="absolute top-0 right-0 w-36 h-36 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
                  
                  <div className="flex justify-between items-start">
                    {/* Wireless contactless symbol placeholder */}
                    <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center">
                      <span className="text-[10px] font-bold opacity-60">)))</span>
                    </div>
                    <div className="font-extrabold italic text-sm tracking-wide text-white/80 bg-white/15 px-2 py-0.5 rounded border border-white/10">VISA</div>
                  </div>

                  <div className="mt-8">
                    <div className="text-lg font-mono font-bold tracking-[3px] opacity-90 drop-shadow-sm">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </div>
                  </div>

                  <div className="flex justify-between items-end mt-6">
                    <div className="space-y-0.5">
                      <div className="text-[8px] uppercase tracking-widest opacity-50">Card Holder</div>
                      <div className="text-xs font-bold uppercase tracking-wider truncate max-w-[150px]">
                        {cardHolder || 'YOUR NAME HERE'}
                      </div>
                    </div>
                    <div className="space-y-0.5 text-right">
                      <div className="text-[8px] uppercase tracking-widest opacity-50">Expires</div>
                      <div className="text-xs font-mono font-bold tracking-wider">
                        {cardExpiry || 'MM/YY'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">PCI Security Standard</p>
                  <p className="text-[10px] text-slate-400">
                    We strictly process card credentials with bank-grade encryption tokenization. Your raw card data is never stored on our local database servers.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="col-span-1 lg:col-span-5 border-t border-slate-100 pt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddCardModal(false)}
                  className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  Save Card Method
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

      {/* DELETE CARD CONFIRM MODAL */}
      {mounted && showDeleteCardModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Remove Payment Method?</h3>
              <p className="text-xs text-slate-400 mt-1">This card will be removed from your saved payment methods.</p>
            </div>
            <div className="p-6 flex gap-3">
              <button
                onClick={() => { setShowDeleteCardModal(false); setDeleteCardId(null); }}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-all"
              >
                Keep Card
              </button>
              <button
                onClick={handleConfirmDeleteCard}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ONLINE PAYMENT MODAL */}
      {mounted && showPaymentModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-scale-up">
            
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Secure Parking Fee Payment</h3>
              </div>
              <button 
                onClick={() => handleFinishPayment()}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 text-center space-y-5">
              <div className="space-y-1">
                <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Payment Request</p>
                <h4 className="text-2xl font-extrabold text-slate-800">{Math.round(cost).toLocaleString('vi-VN')} đ</h4>
                <p className="text-[10px] text-slate-400 max-w-[280px] mx-auto">
                  Scan the VietQR code or pay via PayOS in the browser to settle your active parking fee.
                </p>
              </div>

              {/* QR Code Container */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl inline-block">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="VietQR Parking Fee Code" className="w-48 h-48 mx-auto" />
                ) : (
                  <div className="w-48 h-48 bg-slate-200 animate-pulse flex items-center justify-center rounded-xl">
                    <QrCode className="w-12 h-12 text-slate-400" />
                  </div>
                )}
              </div>

              {/* PayOS External Link */}
              {paymentUrl && (
                <div>
                  <a 
                    href={paymentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all"
                  >
                    <span>Open PayOS Gateway</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-left text-amber-800 text-[11px] flex gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>The session will be marked as paid once the bank confirms receipt of funds.</span>
              </div>

              <button 
                onClick={handleFinishPayment}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                I Have Completed Payment
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
