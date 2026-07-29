/**
 * ===================================================================================
 * 🚨 FE COMPONENT: VehicleCheckout.tsx (Cho Xe Ra Bãi & Thanh Toán / Gate Check-out Workspace)
 * ===================================================================================
 *
 * 📌 VAI TRÒ & CHỨC NĂNG CHÍNH TRÊN UI:
 * - Xử lý quy trình cho xe ra bãi đỗ & tính toán phí đỗ xe cho Nhân viên bảo vệ (Staff).
 * - Quét/Đọc thẻ từ RFID hoặc nhập biển số xe ra bãi đỗ.
 * - So sánh ảnh camera lúc vào vs lúc ra (ALPR Image Verification) để phát hiện tráo biển số.
 * - Tính phí đỗ xe tự động dựa trên thời gian đỗ, loại xe và bảng giá áp dụng.
 * - Hỗ trợ các phương thức thanh toán: Tiền mặt (Cash), Ví MoMo / VNPAY QR Code, hoặc Vé tháng.
 * - Xử lý các trường hợp ngoại lệ: Mất thẻ từ (bị phạt phí), báo cáo sự cố hư hỏng tại lối ra.
 * - Mở rào chắn Barie sau khi thanh toán thành công.
 *
 * ⚙️ KẾT NỐI API BACKEND (ASP.NET Core Controllers):
 * - POST /parking-sessions/checkout/start     --> Khởi tạo tính phí đỗ xe lúc ra (CheckoutController.cs)
 * - POST /parking-sessions/checkout/complete  --> Hoàn tất thanh toán & đóng phiên (CheckoutController.cs)
 * - POST /parking-sessions/checkout/lost-card --> Xử lý báo mất thẻ đỗ xe (CheckoutController.cs)
 * - GET  /parking-sessions/active              --> Tra cứu các xe đang đỗ trong bãi (CheckoutController.cs)
 *
 * 🗄️ BẢNG DATABASE LIÊN QUAN (PostgreSQL):
 * - ParkingSessions (Id, LicensePlateIn, LicensePlateOut, CheckInTime, CheckOutTime, TotalFee, Status)
 * - Payments        (Id, SessionId, Amount, PaymentMethod, PaymentStatus, TransactionDate)
 * - ParkingCards    (Id, CardCode, CardStatus)
 * - Incidents       (Id, SessionId, IncidentTypeId, PenaltyFee)
 *
 * 🔄 LUỒNG CẬP NHẬT DỮ LIỆU & RENDER UI:
 * 1. Quét Thẻ / Biển Số: Nhân viên quẹt thẻ -> Gọi `POST /checkout/start` để lấy ảnh vào/ra & tiền phí.
 * 2. Chọn Thanh Toán: Chọn Tiền mặt / Quét QR MoMo -> Gọi API thanh toán `POST /checkout/complete`.
 * 3. Barie Mở: Hiển thị Modal xanh mở cổng -> Cập nhật trạng thái thẻ & nạp lại danh sách xe đỗ.
 * ===================================================================================
 */

"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/features/auth/context/AuthContext";
import type { ParkingCard } from "@/features/card/types/card";
import { incidentService } from "@/features/incident/services/incident.service";
import type { Incident, IncidentType } from "@/features/incident/types";
import {
  createCheckoutPayment,
  fetchCheckoutSessionDetail,
  startCheckout,
  completeCheckout,
  reportLostCard,
  unpaidCheckout,
  type CheckoutPayment,
  type CheckoutPaymentMethod,
  type CheckoutSession,
  type StartCheckoutResponse,
} from "@/features/vehicles/services/vehicle-checkout.service";
import { useStaffGateData } from "@/features/vehicles/context/StaffGateDataContext";
import { scanLicensePlate } from "@/features/vehicles/services/vehicle-checkin.service";
import { formatPlate } from "@/lib/utils/format";
import { LicensePlateValidation } from "@/lib/validation/LicensePlateValidation";

type CheckoutHistoryItem = {
  id: string;
  sessionId: number;
  licensePlate: string;
  cardCode: string;
  customerType: CheckoutSession["customerType"];
  checkInTime: string | null;
  checkOutTime: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
};

type CheckoutOverlay = {
  session: CheckoutSession;
  payment: CheckoutPayment;
  checkOutTime: string;
  exitPlate: string;
  duration: string;
};

type VehicleTypeFilter = "ALL" | "CAR" | "MOTORCYCLE" | "UNKNOWN";

const STAFF_ID = 2;
const HISTORY_STORAGE_KEY = "pbms_staff_checkout_history";

const normalizeText = (value?: string | null) =>
  String(value ?? "")
    .trim()
    .toUpperCase();
const normalizeComparable = (value?: string | null) =>
  LicensePlateValidation.normalize(String(value ?? ""));

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
};

const formatCurrency = (amount?: number | null) =>
  `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(amount ?? 0)} đ`;

const getDurationLabel = (
  checkInTime?: string | null,
  checkOutTime?: string | null,
) => {
  if (!checkInTime) return "—";
  const start = new Date(checkInTime).getTime();
  const end = checkOutTime ? new Date(checkOutTime).getTime() : Date.now();

  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return "—";

  const minutes = Math.max(1, Math.floor((end - start) / 60000));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${minutes} min`;
  return `${hours}h ${remainingMinutes}m`;
};

const getVehicleTypeGroup = (vehicleType: string): VehicleTypeFilter => {
  const value = normalizeText(vehicleType);
  if (
    value.includes("MOTOR") ||
    value.includes("BIKE") ||
    value.includes("TWO")
  ) {
    return "MOTORCYCLE";
  }
  if (value.includes("CAR") || value.includes("AUTO")) return "CAR";
  return "UNKNOWN";
};

const readHistory = (): CheckoutHistoryItem[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeHistory = (items: CheckoutHistoryItem[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    HISTORY_STORAGE_KEY,
    JSON.stringify(items.slice(0, 50)),
  );
};

export default function VehicleCheckout({
  compact = false,
  refreshTrigger,
  onCheckoutSuccess,
}: {
  compact?: boolean;
  refreshTrigger?: number;
  onCheckoutSuccess?: () => void;
} = {}) {
  const { showToast, user } = useAuth();
  const STAFF_ID = user?.id ?? 3; // Dynamically from logged-in Staff account (default 3)
  const {
    checkoutSessions: cachedCheckoutSessions,
    cards: cachedCards,
    refreshGateData,
    invalidateOperationalData,
  } = useStaffGateData();
  const [sessions, setSessions] = useState<CheckoutSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [vehicleTypeFilter, setVehicleTypeFilter] =
    useState<VehicleTypeFilter>("ALL");
  const [exitPlate, setExitPlate] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<CheckoutPaymentMethod>("CASH");
  const [history, setHistory] = useState<CheckoutHistoryItem[]>([]);
  const [overlay, setOverlay] = useState<CheckoutOverlay | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Card list and selection states
  const [allCards, setAllCards] = useState<ParkingCard[]>([]);
  const [checkoutCardCode, setCheckoutCardCode] = useState<string>("");
  const [cardLostConfirmed, setCardLostConfirmed] = useState(false);
  const [showConfirmLostModal, setShowConfirmLostModal] = useState(false);
  const [showNoCardErrorModal, setShowNoCardErrorModal] = useState(false);
  const [showPlateMismatchModal, setShowPlateMismatchModal] = useState(false);
  const [reportedIncidents, setReportedIncidents] = useState<
    Record<number, { typeName: string; reportedAt: string; description: string }>
  >({});
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fee calculation state
  const [calculatedFee, setCalculatedFee] =
    useState<StartCheckoutResponse | null>(null);
  const [lockedCheckoutTime, setLockedCheckoutTime] = useState<string | null>(
    null,
  );

  // Webcam & LPR states
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<string>("");
  const [ocrText, setOcrText] = useState<string>("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [loadingImageSessionId, setLoadingImageSessionId] = useState<number | null>(null);
  const activeSessionsRequestRef = useRef<Promise<void> | null>(null);
  const checkoutStartSessionRef = useRef<number | null>(null);

  const selectedSession =
    sessions.find((session) => session.id === selectedSessionId) ?? null;

  const sortedCards = useMemo(() => {
    return [...allCards].sort((a, b) => {
      const codeA = a.cardCode || "";
      const codeB = b.cardCode || "";
      return codeA.localeCompare(codeB, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });
  }, [allCards]);

  // Enumerate cameras
  const enumerateCameras = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices) {
      console.warn("Camera API (navigator.mediaDevices) is not available.");
      return;
    }
    try {
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = mediaDevices.filter(
        (device) => device.kind === "videoinput",
      );
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error("No camera device found:", err);
    }
  }, [selectedDeviceId]);

  // Start webcam stream
  const startCamera = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices) {
      showToast(
        "Unable to open the camera: the browser is unsupported or the connection is insecure (HTTP). Use localhost or configure HTTPS.",
        "error",
      );
      return;
    }
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      const constraints = {
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId } }
          : true,
      };
      const mediaStream =
        await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
      showToast("Camera started successfully!", "success");
    } catch (err) {
      console.error("Unable to open the camera:", err);
      showToast(
        "Unable to connect to the camera. Please grant camera permission.",
        "error",
      );
    }
  }, [selectedDeviceId, stream, showToast]);

  // Stop webcam stream
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  }, [stream]);

  // Handle LPR Scan
  const handleScanLicensePlate = async () => {
    if (!videoRef.current) return;
    setIsScanning(true);
    setScanProgress("Capturing frame...");

    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg");
      setCapturedImage(dataUrl);

      setScanProgress("Running LPR OCR...");
      const text = await scanLicensePlate({ image: dataUrl }).then(res => res.licensePlate);
      setOcrText(text);

      if (text) {
        setExitPlate(text);
        showToast(`LPR Detected Plate: ${text}`, "success");
      } else {
        showToast("LPR could not detect a valid license plate.", "error");
      }
    } catch (err) {
      console.error("LPR scan error:", err);
      showToast("LPR scan failed.", "error");
    } finally {
      setIsScanning(false);
      setScanProgress("");
    }
  };

  const checkManagerApprovalStatus = async () => {
    if (!selectedSession) return;
    setIsReporting(true);
    try {
      const sessionIncidents = await incidentService.getBySessionId(selectedSession.id);
      const openIncident = sessionIncidents.find(
        (inc) => inc.status === "OPEN" || inc.status === "PROCESSING"
      );

      if (!openIncident) {
        // Incident resolved or approved by Manager!
        setReportedIncidents((prev) => {
          const next = { ...prev };
          delete next[selectedSession.id];
          return next;
        });

        // Set exit plate to match if needed so checkout can proceed
        if (!exitPlate) {
          setExitPlate(selectedSession.licensePlate);
        }

        showToast(
          `Manager HAS RESOLVED incident for vehicle ${selectedSession.licensePlate}! Gate unlocked for checkout.`,
          "success"
        );

        // Recalculate fee for checkout
        const checkoutTimeStr = new Date().toISOString();
        const res = await startCheckout(selectedSession.id, {
          checkOutTime: checkoutTimeStr,
          licensePlateOut: normalizeText(selectedSession.licensePlate),
          outStaffId: STAFF_ID,
          imageOut: capturedImage || undefined,
        });
        setCalculatedFee(res);
        setLockedCheckoutTime(checkoutTimeStr);
      } else {
        showToast(
          `Incident is still ${openIncident.status || "OPEN"} in Manager Dashboard. Waiting for Manager to approve.`,
          "info"
        );
      }
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not check Manager approval status.",
        "error"
      );
    } finally {
      setIsReporting(false);
    }
  };

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // Capture frame to base64
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !cameraActive) {
      showToast("Please activate the exit camera first.", "info");
      return null;
    }
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
    setCapturedImage(dataUrl);
    return dataUrl;
  }, [cameraActive, showToast]);

  // Run OCR on Backend Cloud API
  const performOCR = useCallback(
    async (base64Img: string) => {
      setIsScanning(true);
      setScanProgress("Scanning exit license plate...");
      setOcrText("");

      try {
        const result = await scanLicensePlate({ image: base64Img });
        setOcrText(result.licensePlate);
        showToast(
          `Exit license plate recognized: ${result.licensePlate}`,
          "success",
        );
        return result.licensePlate;
      } catch (err: any) {
        console.error("OCR error:", err);
        showToast(
          err.message || "An error occurred during the OCR scan.",
          "error",
        );
        return "";
      } finally {
        setIsScanning(false);
        setScanProgress("");
      }
    },
    [showToast],
  );

  const handleCheckoutScan = useCallback(async () => {
    const base64 = captureFrame();
    if (!base64) return;
    const plate = await performOCR(base64);
    if (plate) {
      if (!selectedSession) {
        const queryKey = normalizeComparable(plate);
        const matched = sessions.find(
          (s) =>
            normalizeComparable(s.cardCode) === queryKey ||
            normalizeComparable(s.licensePlate) === queryKey,
        );
        if (matched) {
          setSelectedSessionId(matched.id);
          setSearchQuery(matched.cardCode || matched.licensePlate);
          setCalculatedFee(null);
          setLockedCheckoutTime(null);
          setExitPlate(plate);
          showToast(
            `Automatically matched the parking session for vehicle: ${plate}`,
            "success",
          );
        } else {
          showToast(
            `No active parking session found for license plate: ${plate}`,
            "error",
          );
        }
      } else {
        setExitPlate(plate);
      }
    }
  }, [captureFrame, performOCR, selectedSession, sessions, showToast]);

  const filteredSessions = useMemo(() => {
    const fromTime = filterFrom ? new Date(filterFrom).getTime() : null;
    const toTime = filterTo ? new Date(filterTo).getTime() : null;

    return sessions.filter((session) => {
      const checkInTime = session.checkInTime
        ? new Date(session.checkInTime).getTime()
        : null;
      const vehicleGroup = getVehicleTypeGroup(session.vehicleType);

      const matchesVehicle =
        vehicleTypeFilter === "ALL" || vehicleGroup === vehicleTypeFilter;

      const matchesFrom =
        fromTime == null ||
        checkInTime == null ||
        Number.isNaN(checkInTime) ||
        checkInTime >= fromTime;

      const matchesTo =
        toTime == null ||
        checkInTime == null ||
        Number.isNaN(checkInTime) ||
        checkInTime <= toTime;

      return matchesVehicle && matchesFrom && matchesTo;
    });
  }, [filterFrom, filterTo, sessions, vehicleTypeFilter]);

  const isFilterActive = Boolean(
    filterFrom || filterTo || vehicleTypeFilter !== "ALL",
  );
  const isPlateMatched =
    Boolean(selectedSession) &&
    normalizeComparable(exitPlate) ===
    normalizeComparable(selectedSession?.licensePlate);

  const isCardMatched = useMemo(() => {
    if (!selectedSession) return false;
    if (!checkoutCardCode) return false;
    return (
      normalizeComparable(checkoutCardCode) ===
      normalizeComparable(selectedSession.cardCode)
    );
  }, [selectedSession, checkoutCardCode]);

  const isSelectedCardLost = useMemo(() => {
    if (cardLostConfirmed) return true;
    if (!selectedSession || !selectedSession.cardId) return false;
    const card = allCards.find((c) => c.id === selectedSession.cardId);
    return card?.cardStatus?.toUpperCase() === "LOST";
  }, [selectedSession, allCards, cardLostConfirmed]);

  const loadActiveSessions = useCallback(async () => {
    if (activeSessionsRequestRef.current) {
      return activeSessionsRequestRef.current;
    }

    setIsLoading(true);
    const request = (async () => {
      try {
        const gateData = await refreshGateData();
        setSessions(gateData.checkoutSessions);
        setAllCards(gateData.cards);
      } catch (error) {
        showToast(
          error instanceof Error
            ? error.message
            : "Could not load active sessions.",
          "error",
        );
      } finally {
        setIsLoading(false);
      }
    })();

    activeSessionsRequestRef.current = request;
    try {
      await request;
    } finally {
      activeSessionsRequestRef.current = null;
    }
  }, [refreshGateData, showToast]);

  const refreshAfterMutation = useCallback(async () => {
    try {
      const gateData = await invalidateOperationalData();
      setSessions(gateData.checkoutSessions);
      setAllCards(gateData.cards);
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "The operation succeeded, but gate data could not be refreshed.",
        "error",
      );
    }
  }, [invalidateOperationalData, showToast]);

  useEffect(() => {
    setIsMounted(true);
    setHistory(readHistory());
    void loadActiveSessions();
    void enumerateCameras();

    // Auto-focus search input on load
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
  }, [loadActiveSessions, enumerateCameras]);

  useEffect(() => {
    setSessions(cachedCheckoutSessions);
    setAllCards(cachedCards);
  }, [cachedCheckoutSessions, cachedCards]);

  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      void loadActiveSessions();
    }
  }, [refreshTrigger, loadActiveSessions]);

  const selectSession = (session: CheckoutSession) => {
    setSelectedSessionId(session.id);
    setExitPlate("");
    setCheckoutCardCode(""); // default empty to simulate card loss
    setCardLostConfirmed(false);
    setShowConfirmLostModal(false);
    setShowNoCardErrorModal(false);
    setSearchQuery(session.cardCode || session.licensePlate);
    setCalculatedFee(null);
    setLockedCheckoutTime(null);
    setCapturedImage(null);
    setOcrText("");

    setLoadingImageSessionId(session.id);
    void fetchCheckoutSessionDetail(session.id)
      .then((detail) => {
        setSessions((current) =>
          current.map((item) =>
            item.id === session.id
              ? {
                  ...item,
                  imageIn: detail.imageIn,
                  imageOut: detail.imageOut,
                }
              : item,
          ),
        );
      })
      .catch((error) => {
        showToast(
          error instanceof Error
            ? error.message
            : "Could not load the check-in image.",
          "error",
        );
      })
      .finally(() => {
        setLoadingImageSessionId((current) =>
          current === session.id ? null : current,
        );
      });
  };

  const resetForNextVehicle = () => {
    setSelectedSessionId(null);
    setExitPlate("");
    setCheckoutCardCode("");
    setCardLostConfirmed(false);
    setShowConfirmLostModal(false);
    setShowNoCardErrorModal(false);
    setPaymentMethod("CASH");
    setSearchQuery("");
    setCalculatedFee(null);
    setLockedCheckoutTime(null);
    setCapturedImage(null);
    setOcrText("");

    // Auto-focus search input on reset
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
  };

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const queryKey = normalizeComparable(searchQuery);
    if (!queryKey) {
      showToast("Please enter card code or license plate.", "error");
      return;
    }

    const exactMatch =
      filteredSessions.find(
        (session) =>
          normalizeComparable(session.cardCode) === queryKey ||
          normalizeComparable(session.licensePlate) === queryKey,
      ) ?? null;

    const partialMatches = filteredSessions.filter(
      (session) =>
        normalizeComparable(session.cardCode).includes(queryKey) ||
        normalizeComparable(session.licensePlate).includes(queryKey),
    );

    const matchedSession = exactMatch ?? partialMatches[0] ?? null;

    if (!matchedSession) {
      showToast(
        "No active session found for this card or license plate.",
        "error",
      );
      return;
    }

    selectSession(matchedSession);
    showToast("Active session loaded. Please compare exit plate.", "success");
  };

  const handleMarkLost = () => {
    if (!selectedSession) return;
    if (!selectedSession.cardId) {
      showToast(
        "This session does not have a card ID from the system.",
        "error",
      );
      return;
    }
    setShowConfirmLostModal(true);
  };

  const proceedWithMarkLost = async () => {
    if (!selectedSession) return;

    if (!selectedSession.cardId) {
      showToast(
        "This session does not have a card ID from the system.",
        "error",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await reportLostCard(selectedSession.id, {
        staffId: STAFF_ID,
        description: "Card reported lost during check-out",
      });
      await refreshAfterMutation();
      setCardLostConfirmed(true);
      setCheckoutCardCode("");

      // Automatically recalculate the parking fee after the card is reported lost.
      const checkoutTimeStr = new Date().toISOString();
      const res = await startCheckout(selectedSession.id, {
        checkOutTime: checkoutTimeStr,
        licensePlateOut: normalizeText(exitPlate),
        outStaffId: STAFF_ID,
        imageOut: capturedImage || undefined,
      });
      setCalculatedFee(res);
      setLockedCheckoutTime(checkoutTimeStr);

      showToast(
        `Card ${selectedSession.cardCode ?? selectedSession.cardId} was reported lost and the parking fee was recalculated successfully.`,
        "success",
      );
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Unable to report the card as lost and recalculate the fee.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
      setShowConfirmLostModal(false);
    }
  };

  const handleStartCheckout = async () => {
    if (!selectedSession) {
      showToast("Please search and load a session first.", "error");
      return;
    }

    if (!exitPlate.trim()) {
      showToast("Please enter exit license plate for comparison.", "error");
      return;
    }

    const plateValidation = LicensePlateValidation.validate(exitPlate);
    if (!plateValidation.isValid) {
      showToast(
        plateValidation.error ?? "Invalid license plate format.",
        "error",
      );
      return;
    }

    if (!isPlateMatched) {
      showToast(
        "Exit plate does not match check-in plate. Please route to incident handling.",
        "error",
      );
      return;
    }

    if (checkoutCardCode && !isCardMatched) {
      showToast(
        "The presented card does not match the check-in card. Please verify the card.",
        "error",
      );
      return;
    }

    if (checkoutStartSessionRef.current === selectedSession.id) {
      return;
    }

    const checkoutTimeStr = new Date().toISOString();
    checkoutStartSessionRef.current = selectedSession.id;
    setIsSubmitting(true);

    try {
      const res = await startCheckout(selectedSession.id, {
        checkOutTime: checkoutTimeStr,
        licensePlateOut: plateValidation.normalized,
        outStaffId: STAFF_ID,
        imageOut: capturedImage || undefined,
      });

      setCalculatedFee(res);
      setLockedCheckoutTime(checkoutTimeStr);
      showToast(
        "Parking fee calculated successfully. Please confirm payment.",
        "success",
      );
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Unable to calculate the parking fee.",
        "error",
      );
    } finally {
      checkoutStartSessionRef.current = null;
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (
      selectedSession &&
      exitPlate &&
      isPlateMatched &&
      (!checkoutCardCode || isCardMatched) &&
      !calculatedFee &&
      !isSubmitting
    ) {
      void handleStartCheckout();
    }
  }, [
    selectedSession,
    exitPlate,
    isPlateMatched,
    checkoutCardCode,
    isCardMatched,
    calculatedFee,
    isSubmitting,
  ]);

  useEffect(() => {
    if (overlay) {
      const timer = setTimeout(() => {
        setOverlay(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [overlay]);

  const executeCompleteCheckout = async () => {
    if (!selectedSession || !calculatedFee || !lockedCheckoutTime) return;

    setIsSubmitting(true);

    try {
      const payment = await createCheckoutPayment(
        selectedSession,
        paymentMethod,
      );
      if (normalizeText(payment.paymentStatus) !== "PAID") {
        await completeCheckout(selectedSession.id);
      }

      const duration = getDurationLabel(
        selectedSession.checkInTime,
        lockedCheckoutTime,
      );

      const nextHistory: CheckoutHistoryItem = {
        id: `${selectedSession.id}-${lockedCheckoutTime}`,
        sessionId: selectedSession.id,
        licensePlate: selectedSession.licensePlate,
        cardCode: selectedSession.cardCode ?? "—",
        customerType: selectedSession.customerType,
        checkInTime: selectedSession.checkInTime,
        checkOutTime: lockedCheckoutTime,
        amount: payment.amount,
        paymentMethod: String(payment.paymentMethod || paymentMethod),
        paymentStatus: String(payment.paymentStatus),
      };

      const newHistory = [nextHistory, ...history].slice(0, 50);
      setHistory(newHistory);
      writeHistory(newHistory);

      setOverlay({
        session: selectedSession,
        payment,
        checkOutTime: lockedCheckoutTime,
        exitPlate: normalizeText(exitPlate),
        duration,
      });

      setSessions((current) =>
        current.filter((session) => session.id !== selectedSession.id),
      );
      setAllCards((current) =>
        current.map((card) =>
          card.id === selectedSession.cardId
            ? { ...card, cardStatus: "AVAILABLE", currentSessionId: null }
            : card,
        ),
      );
      // Auto-resolve any open incidents for this session upon successful payment & checkout
      try {
        const sessionIncidents = await incidentService.getBySessionId(selectedSession.id);
        for (const inc of sessionIncidents) {
          if (inc.status === "OPEN" || inc.status === "PROCESSING") {
            await incidentService.updateStatus(inc.id, {
              status: "RESOLVED",
              note: "Auto-resolved upon checkout payment completion.",
            });
          }
        }
      } catch (incErr) {
        console.warn("Could not auto-resolve session incidents upon checkout:", incErr);
      }

      resetForNextVehicle();
      onCheckoutSuccess?.();
      showToast("Check-out and payment completed successfully!", "success");
      void refreshAfterMutation();
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Could not complete checkout flow.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteCheckout = async () => {
    if (!selectedSession || !calculatedFee || !lockedCheckoutTime) {
      showToast("Please calculate the parking fee first.", "error");
      return;
    }

    if (!checkoutCardCode) {
      if (!cardLostConfirmed) {
        setShowNoCardErrorModal(true);
        return;
      }
    }

    await executeCompleteCheckout();
  };

  const findUnpaidIncidentType = (incidentTypes: IncidentType[]) =>
    incidentTypes.find((type) => {
      const code = normalizeText(type.incidentCode);
      const name = normalizeText(type.incidentName);
      return (
        code === "UNPAID_VEHICLE" ||
        code.includes("UNPAID") ||
        code.includes("PAYMENT") ||
        name.includes("UNPAID") ||
        name.includes("PAYMENT") ||
        name.includes("REFUSE") ||
        name.includes("KHONG THANH TOAN") ||
        name.includes("UNPAID")
      );
    }) ?? null;

  const handleReportPaymentIssue = async () => {
    if (!overlay) return;

    setIsReporting(true);

    try {
      const incidentTypes = await incidentService.getIncidentTypes();
      const incidentType = findUnpaidIncidentType(incidentTypes);

      if (!incidentType) {
        showToast(
          "Missing incident type for unpaid/refused payment. Please ask Backend/Manager to add it first.",
          "error",
        );
        return;
      }

      const rawDesc = `Unpaid exit for plate ${overlay.session.licensePlate}. Amount: ${formatCurrency(overlay.payment.amount)}.`;
      const description = rawDesc.length > 95 ? rawDesc.substring(0, 95) : rawDesc;

      await incidentService.create({
        sessionId: overlay.session.id,
        incidentTypeId: incidentType.id,
        description,
        penaltyFee: null,
      });

      showToast("Payment issue was reported to manager.", "success");
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Could not report payment issue.",
        "error",
      );
    } finally {
      setIsReporting(false);
    }
  };

  const handlePlateMismatch = () => {
    if (!selectedSession) return;
    setShowPlateMismatchModal(true);
  };

  const executeReportFraud = async () => {
    if (!selectedSession) return;
    const currentExit = exitPlate.trim();
    const checkInPlate = selectedSession.licensePlate;

    setIsReporting(true);
    try {
      const incidentTypes = await incidentService.getIncidentTypes();
      const mismatchType =
        incidentTypes.find((type) => {
          const code = normalizeText(type.incidentCode);
          const name = normalizeText(type.incidentName);
          return (
            code.includes("MISMATCH") ||
            code.includes("PLATE") ||
            name.includes("MISMATCH") ||
            name.includes("LECH BIEN SO") ||
            name.includes("TRAO BIEN SO")
          );
        }) ?? incidentTypes[0];

      if (!mismatchType) {
        showToast("Could not find appropriate incident type for plate mismatch.", "error");
        return;
      }

      const rawDesc = `Plate mismatch. Check-in: ${checkInPlate}, Exit: ${currentExit || "None"}`;
      const description = rawDesc.length > 95 ? rawDesc.substring(0, 95) : rawDesc;

      const createdInc = await incidentService.create({
        sessionId: selectedSession.id,
        incidentTypeId: mismatchType.id,
        description,
        penaltyFee: null,
      });

      // Save reported incident state for UI display
      setReportedIncidents((prev) => ({
        ...prev,
        [selectedSession.id]: {
          typeName: mismatchType.incidentName || "Plate Mismatch",
          reportedAt: new Date().toISOString(),
          description,
        },
      }));

      if (createdInc?.autoBlacklisted) {
        showToast(
          `🚨 AUTOMATED BLACKLIST TRIGGERED! Vehicle ${checkInPlate} accumulated 3+ violations and was AUTOMATICALLY BLACKLISTED!`,
          "error"
        );
      } else {
        showToast(
          `Plate Mismatch incident reported to Manager for ${checkInPlate}. Gate locked pending resolution.`,
          "info"
        );
      }
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not report plate mismatch incident.",
        "error"
      );
    } finally {
      setIsReporting(false);
    }
  };

  const handleUnpaidCheckout = async () => {
    if (!selectedSession) return;

    const feeLabel = calculatedFee
      ? formatCurrency(calculatedFee.amountDue)
      : "amount unknown";

    if (
      !window.confirm(
        `Process Unpaid Exit for plate ${selectedSession.licensePlate}?\n\nOutstanding fee: ${feeLabel}\n\nThis will:\n• Force-complete the session\n• Add vehicle to Blacklist with the outstanding fee amount noted\n• Manager will need to remove from Blacklist once paid`
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      await unpaidCheckout(selectedSession.id, {
        staffId: STAFF_ID,
        reason: calculatedFee
          ? `Vehicle exited without payment. Outstanding parking fee: ${feeLabel} (Session #${selectedSession.id}, Check-in: ${formatDateTime(selectedSession.checkInTime)}). Remove from blacklist after fee is settled.`
          : `Vehicle exited without payment. Session #${selectedSession.id}. Remove from blacklist after fee is settled.`,
      });
      showToast(
        `Unpaid exit processed for ${selectedSession.licensePlate}. Outstanding fee (${feeLabel}) noted in Blacklist — Manager can remove after payment.`,
        "success"
      );
      resetForNextVehicle();
      void refreshAfterMutation();
      if (onCheckoutSuccess) {
        onCheckoutSuccess();
      }
    } catch (error) {
      console.warn("Primary unpaidCheckout API call encountered issue, running Frontend fallback:", error);
      try {
        await incidentService.createBlacklistRecord({
          vehicleId: selectedSession.vehicleId ?? undefined,
          cardId: selectedSession.cardId ?? undefined,
          reason: `Unpaid exit for plate ${selectedSession.licensePlate} (Session #${selectedSession.id}). Fee: ${feeLabel}`,
        });
        showToast(
          `Unpaid exit logged for ${selectedSession.licensePlate}. Vehicle added to Blacklist.`,
          "info"
        );
        resetForNextVehicle();
        void loadActiveSessions();
        if (onCheckoutSuccess) {
          onCheckoutSuccess();
        }
      } catch (fallbackErr) {
        showToast(
          error instanceof Error ? error.message : "Could not process unpaid checkout.",
          "error"
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={compact ? "text-slate-900" : "bg-slate-50 p-4 text-slate-900"}
    >
      <div
        className={
          compact
            ? "flex flex-col gap-4"
            : "mx-auto flex max-w-[1600px] flex-col gap-4"
        }
      >
        {!compact && (
          <div className="flex shrink-0 items-center justify-between gap-3">
            <h1 className="text-xl font-black text-slate-900">
              Staff Gate Check-out
            </h1>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsHistoryOpen(true)}
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-lg">
                  history
                </span>
                History
              </button>
              <button
                type="button"
                onClick={() => void loadActiveSessions()}
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-black text-white hover:bg-slate-700"
              >
                <span className="material-symbols-outlined text-lg">
                  {isLoading ? "progress_activity" : "refresh"}
                </span>
                Refresh
              </button>
            </div>
          </div>
        )}

        <main
          className={
            compact
              ? "grid gap-4 md:grid-cols-2"
              : "grid min-h-0 flex-1 gap-4 xl:grid-cols-2"
          }
        >
          {/* LEFT COLUMN: EXIT CAMERA (LICENSE PLATE SCAN) */}
          <div className="space-y-4 flex flex-col min-h-0">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
                <p className="font-mono text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Checkout Camera
                </p>
              </div>

              <div className="relative aspect-video bg-slate-900 border-b border-slate-100 flex items-center justify-center overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`h-full w-full object-cover ${cameraActive ? "block" : "hidden"}`}
                />

                {!cameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-3 bg-slate-950">
                    <span className="material-symbols-outlined text-3xl text-slate-600">
                      videocam_off
                    </span>
                    <p className="text-slate-400 text-xs font-semibold">
                      Camera is not active.
                    </p>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-black text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/20"
                    >
                      Start Camera
                    </button>
                  </div>
                )}

                {cameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-64 h-32 border-4 border-dashed border-emerald-400/40 rounded-3xl relative">
                      <div className="absolute top-2 left-2 text-[9px] font-mono font-bold bg-slate-950/80 text-emerald-400 px-1 py-0.5 rounded">
                        LPR ALIGNMENT
                      </div>
                    </div>
                  </div>
                )}

                {isScanning && (
                  <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center p-6 text-center space-y-4">
                    <div className="h-8 w-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-emerald-400 text-xs font-black tracking-wider animate-pulse">
                      {scanProgress}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-100 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <select
                      value={selectedDeviceId}
                      onChange={(e) => setSelectedDeviceId(e.target.value)}
                      className="w-full rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-emerald-500"
                    >
                      {devices.map((device, idx) => (
                        <option
                          key={device.deviceId || idx}
                          value={device.deviceId}
                        >
                          {device.label || `Camera ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={cameraActive ? stopCamera : startCamera}
                      className={`flex-1 rounded-xl py-1.5 text-xs font-bold transition flex items-center justify-center gap-1.5 border ${cameraActive
                        ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                        : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                        }`}
                    >
                      {cameraActive ? "Stop Cam" : "Start Cam"}
                    </button>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleCheckoutScan}
                    disabled={isScanning || !cameraActive}
                    className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white py-2 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-base">
                      photo_camera
                    </span>
                    Scan Camera
                  </button>
                </div>

                {capturedImage && (
                  <div className="bg-white rounded-xl p-2 border border-slate-100 flex items-center gap-3">
                    <div className="h-12 w-20 bg-slate-950 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                      <img
                        src={capturedImage}
                        alt="Captured checkout snapshot"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                        Detected Checkout Plate
                      </p>
                      <p className="font-mono text-base font-black text-slate-900 tracking-wider mt-0.5">
                        {exitPlate || "---"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: SEARCH, VERIFICATION, AND PAYMENT */}
          <div className="space-y-3 flex flex-col min-h-0">
            <section className="min-h-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3 flex flex-col">
              {/* Quick Select Active Vehicles Dropdown & Search Bar */}
              <div className="space-y-2 border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Vehicles in Park ({filteredSessions.length})
                  </label>
                  {selectedSession && (
                    <button
                      type="button"
                      onClick={resetForNextVehicle}
                      className="text-[10px] font-bold text-red-600 hover:underline"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
                <select
                  value={selectedSessionId ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) {
                      resetForNextVehicle();
                      return;
                    }
                    const session = sessions.find((s) => s.id === Number(val));
                    if (session) selectSession(session);
                  }}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 font-mono text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">
                    {isLoading
                      ? "Loading active sessions..."
                      : filteredSessions.length === 0
                      ? "-- No active vehicles in park --"
                      : `-- Select vehicle in park (${filteredSessions.length}) --`}
                  </option>
                  {filteredSessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      🚗 {formatPlate(session.licensePlate)} | Card: {session.cardCode || "None"} | {session.vehicleType}
                    </option>
                  ))}
                </select>

                <form
                  onSubmit={handleSearch}
                  className="flex gap-2 items-center pt-1"
                >
                  <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                      search
                    </span>
                    <input
                      ref={searchInputRef}
                      value={searchQuery}
                      onChange={(event) =>
                        setSearchQuery(event.target.value.toUpperCase())
                      }
                      placeholder="Or search card code / plate..."
                      className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 font-mono text-xs font-bold uppercase outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-9 rounded-xl bg-emerald-600 px-4 text-xs font-black text-white shadow-sm hover:bg-emerald-700 whitespace-nowrap transition"
                  >
                    Find
                  </button>
                </form>
              </div>

              {selectedSession ? (
                <div className="space-y-3">
                  {/* Check-in and check-out image comparison */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Check-in Photo */}
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-900 aspect-[4/3] relative flex items-center justify-center h-28">
                      {loadingImageSessionId === selectedSession.id ? (
                        <div className="flex flex-col items-center justify-center text-slate-300 text-[10px] gap-1">
                          <span className="material-symbols-outlined text-xl animate-spin">
                            progress_activity
                          </span>
                          <span>Loading check-in photo...</span>
                        </div>
                      ) : selectedSession.imageIn ? (
                        <img
                          src={selectedSession.imageIn}
                          alt="Check-in snapshot"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-500 text-[10px] gap-1">
                          <span className="material-symbols-outlined text-xl">
                            image_not_supported
                          </span>
                          <span>No check-in photo</span>
                        </div>
                      )}
                      <div className="absolute bottom-1 left-1 text-[8px] font-mono font-bold bg-slate-950/80 text-white px-1.5 py-0.5 rounded uppercase">
                        Check-in Photo
                      </div>
                    </div>

                    {/* Captured Checkout Photo */}
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-900 aspect-[4/3] relative flex items-center justify-center h-28">
                      {capturedImage ? (
                        <img
                          src={capturedImage}
                          alt="Checkout snapshot"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-500 text-[10px] gap-1">
                          <span className="material-symbols-outlined text-xl">
                            photo_camera
                          </span>
                          <span>No checkout photo</span>
                        </div>
                      )}
                      <div className="absolute bottom-1 left-1 text-[8px] font-mono font-bold bg-slate-950/80 text-white px-1.5 py-0.5 rounded uppercase">
                        Checkout Photo
                      </div>
                    </div>
                  </div>

                  {/* License plate entry and matching */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Check-in Plate
                      </label>
                      <div className="mt-1 rounded-xl bg-emerald-50 border border-emerald-100 p-2.5 text-center">
                        <span className="font-mono text-lg font-black text-slate-900 tracking-wider">
                          {formatPlate(selectedSession.licensePlate)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Checkout Plate
                      </label>
                      <input
                        value={exitPlate}
                        onChange={(event) =>
                          setExitPlate(event.target.value.toUpperCase())
                        }
                        onBlur={() => {
                          const validation =
                            LicensePlateValidation.validate(exitPlate);
                          if (validation.isValid) {
                            setExitPlate(validation.formatted);
                          }
                        }}
                        placeholder="Enter checkout plate"
                        maxLength={20}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2.5 font-mono text-lg font-black uppercase tracking-wider text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>
                  </div>

                  {/* Card entry and matching */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Check-in Card
                      </label>
                      <div className="mt-1 rounded-xl bg-slate-50 border border-slate-100 p-2.5 text-center">
                        <span className="font-mono text-sm font-bold text-slate-800">
                          {selectedSession.cardCode ?? "—"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-550">
                        Checkout Card
                      </label>
                      <input
                        list="checkout-cards-list"
                        value={checkoutCardCode}
                        onChange={(e) =>
                          setCheckoutCardCode(e.target.value.toUpperCase())
                        }
                        disabled={isSelectedCardLost}
                        placeholder={
                          isSelectedCardLost
                            ? "Card reported lost"
                            : "Type/select card code"
                        }
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                      />
                      <datalist id="checkout-cards-list">
                        {sortedCards.map((card) => (
                          <option key={card.id} value={card.cardCode} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  {/* Matching and comparison badges */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Plate Match status */}
                    <div
                      className={`rounded-xl border px-3 py-2 flex items-center gap-1.5 text-xs font-bold ${!exitPlate
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : isPlateMatched
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-red-200 bg-red-50 text-red-700"
                        }`}
                    >
                      <span className="material-symbols-outlined text-base">
                        {!exitPlate
                          ? "visibility"
                          : isPlateMatched
                            ? "check_circle"
                            : "error"}
                      </span>
                      <span>
                        {!exitPlate
                          ? "Waiting Plate"
                          : isPlateMatched
                            ? "Plate Matched"
                            : "Plate Mismatch!"}
                      </span>
                    </div>

                    {/* Card Match status */}
                    <div
                      className={`rounded-xl border px-3 py-2 flex items-center gap-1.5 text-xs font-bold ${!checkoutCardCode
                        ? "border-amber-200 bg-amber-50/70 text-amber-700"
                        : isCardMatched
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-red-200 bg-red-50 text-red-700"
                        }`}
                    >
                      <span className="material-symbols-outlined text-base">
                        {!checkoutCardCode
                          ? "warning"
                          : isCardMatched
                            ? "check_circle"
                            : "error"}
                      </span>
                      <span>
                        {!checkoutCardCode
                          ? "No Card (Lost)"
                          : isCardMatched
                            ? "Card Matched"
                            : "Card Mismatch!"}
                      </span>
                    </div>
                  </div>

                  {/* Additional check-in information */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-2">
                      <p className="text-[9px] font-black uppercase text-slate-400">
                        Duration / Slot
                      </p>
                      <p className="text-xs font-bold text-slate-700">
                        {getDurationLabel(selectedSession.checkInTime)} ·{" "}
                        {selectedSession.zoneCode ?? "—"}/
                        {selectedSession.slotCode ?? "—"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-2 flex justify-between items-center">
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400">
                          Type / Cust
                        </p>
                        <p className="text-xs font-bold text-slate-700">
                          {selectedSession.vehicleType} ·{" "}
                          {selectedSession.customerType}
                        </p>
                      </div>
                      <div className="flex gap-1.5 items-center">
                        {selectedSession.cardId && (
                          <button
                            type="button"
                            disabled={isSubmitting || isReporting || isCardMatched}
                            onClick={() => void handleMarkLost()}
                            className={`rounded-lg border px-2 py-1 text-[10px] font-black transition ${isCardMatched
                              ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-40 shadow-none"
                              : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 shadow-sm"
                              }`}
                            title={isCardMatched ? "Card matched correctly — Lost Card is disabled" : "Report lost card"}
                          >
                            Lost card
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={isSubmitting || isReporting || isPlateMatched}
                          onClick={() => void handlePlateMismatch()}
                          className={`rounded-lg border px-2 py-1 text-[10px] font-black transition ${isPlateMatched
                            ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-40 shadow-none"
                            : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 shadow-sm"
                            }`}
                          title={isPlateMatched ? "Plate matched correctly — Plate Mismatch is disabled" : "Report plate mismatch"}
                        >
                          Plate Mismatch
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Active Incident Banner if reported to Manager */}
                  {reportedIncidents[selectedSession.id] ? (
                    <div className="rounded-2xl border-2 border-rose-300 bg-rose-50/90 p-4 text-slate-900 space-y-3 shadow-md animate-in fade-in zoom-in-95">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-rose-700 font-black text-xs uppercase tracking-wider">
                          <span className="material-symbols-outlined text-xl text-rose-600">
                            report_problem
                          </span>
                          <span>Barrier Locked · Incident Logged</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-rose-200 text-rose-900 text-[10px] font-black uppercase">
                          {reportedIncidents[selectedSession.id].typeName}
                        </span>
                      </div>

                      <p className="text-xs text-rose-800 font-medium leading-relaxed">
                        Incident <strong>({reportedIncidents[selectedSession.id].typeName})</strong> reported to Manager Tracking Dashboard. Barrier remains <strong>LOCKED</strong>.
                      </p>

                      <div className="bg-white/90 rounded-xl p-3 border border-rose-200 text-xs font-mono space-y-1.5 shadow-inner">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-semibold">Check-in Plate:</span>
                          <span className="font-bold text-slate-900">{selectedSession.licensePlate}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-semibold">Checkout Plate:</span>
                          <span className="font-bold text-rose-600">{exitPlate || "Not Matched"}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400 font-semibold">Reported At:</span>
                          <span className="font-semibold text-slate-600">
                            {formatDateTime(reportedIncidents[selectedSession.id].reportedAt)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSessionId(null);
                            setCalculatedFee(null);
                            setExitPlate("");
                            setCheckoutCardCode("");
                            showToast("Cleared session. Gate ready for next vehicle.", "info");
                          }}
                          className="py-2.5 px-2 rounded-xl bg-slate-800 text-white font-black text-[11px] hover:bg-slate-900 transition flex items-center justify-center gap-1 shadow-sm"
                        >
                          <span className="material-symbols-outlined text-sm">refresh</span>
                          Reset Gate
                        </button>

                        <button
                          type="button"
                          disabled={isReporting}
                          onClick={() => void checkManagerApprovalStatus()}
                          className="py-2.5 px-2 rounded-xl bg-amber-500 text-white font-black text-[11px] hover:bg-amber-600 transition flex items-center justify-center gap-1 shadow-sm disabled:opacity-60"
                        >
                          <span className="material-symbols-outlined text-sm">sync</span>
                          {isReporting ? "Checking..." : "Check Status"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setExitPlate(selectedSession.licensePlate);
                            showToast(`Plate corrected to ${selectedSession.licensePlate}.`, "success");
                          }}
                          className="py-2.5 px-2 rounded-xl bg-emerald-600 text-white font-black text-[11px] hover:bg-emerald-700 transition flex items-center justify-center gap-1 shadow-sm"
                        >
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          Fix &amp; Match
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Fee calculation and billing */
                    calculatedFee && (
                      <div className="border-t border-slate-100 pt-3 space-y-3">
                        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-semibold text-slate-500 font-mono">
                              Checkout:{" "}
                            </span>
                            <span className="font-mono font-bold text-slate-800 mr-2">
                              {formatDateTime(lockedCheckoutTime)}
                            </span>
                            <span className="font-semibold text-slate-500 font-mono">
                              Fee:{" "}
                            </span>
                            <span className="font-bold text-slate-800">
                              {formatCurrency(calculatedFee.totalFee)}
                            </span>
                            {calculatedFee.penaltyFee > 0 && (
                              <span className="text-red-600 font-bold ml-2">
                                {" "}
                                (Penalty:{" "}
                                {formatCurrency(calculatedFee.penaltyFee)})
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="font-black text-slate-500">
                              Due:{" "}
                            </span>
                            <span className="font-black text-[#006d43] text-sm">
                              {formatCurrency(calculatedFee.amountDue)}
                            </span>
                          </div>
                        </div>

                        {/* Payment method selection */}
                        <div className="grid grid-cols-2 gap-3">
                          {(
                            ["CASH", "ONLINE_BANKING"] as CheckoutPaymentMethod[]
                          ).map((method) => (
                            <button
                              key={method}
                              type="button"
                              onClick={() => setPaymentMethod(method)}
                              className={`rounded-xl border px-3 py-2 text-xs font-black transition ${paymentMethod === method
                                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                }`}
                            >
                              {method === "CASH" ? "Cash" : "Online banking"}
                            </button>
                          ))}
                        </div>

                        {/* Primary: Payment & Checkout */}
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => void handleCompleteCheckout()}
                          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-black text-white shadow-md hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 transition"
                        >
                          <span className="material-symbols-outlined text-base">
                            payments
                          </span>
                          {isSubmitting ? "Confirming..." : "Confirm Payment & Checkout"}
                        </button>

                        {/* Danger Zone — Unpaid Exit */}
                        <div className="relative mt-1">
                          <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-red-100" />
                          </div>
                          <div className="relative flex justify-center">
                            <span className="bg-white px-2 text-[9px] font-black uppercase tracking-widest text-red-400">
                              danger zone
                            </span>
                          </div>
                        </div>

                        <div className="rounded-xl border border-red-100 bg-red-50/60 p-2.5 space-y-2">
                          <p className="text-[9px] font-bold text-red-500 leading-relaxed">
                            <span className="font-black">Force-completes</span> session without payment and
                            automatically adds vehicle to Blacklist.
                          </p>
                          <button
                            type="button"
                            disabled={isSubmitting || isReporting}
                            onClick={() => void handleUnpaidCheckout()}
                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-300 bg-white py-2 text-xs font-black text-red-700 hover:bg-red-100 hover:border-red-400 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                          >
                            <span className="material-symbols-outlined text-sm text-red-600">
                              block
                            </span>
                            {isReporting ? "Processing..." : "Unpaid Exit & Blacklist"}
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <EmptyState
                  icon="logout"
                  text="Waiting to load session. Please scan or enter plate/card."
                />
              )}
            </section>
          </div>
        </main>
      </div>

      {isMounted &&
        isHistoryOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100000] bg-slate-950/70 p-6 backdrop-blur-sm">
            <div className="mx-auto flex h-full max-w-5xl flex-col rounded-[2rem] bg-white p-6 shadow-2xl">
              <div className="flex shrink-0 items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">
                    Checkout history
                  </h2>
                  <p className="text-sm font-semibold text-slate-500">
                    Recent vehicles that have exited the gate.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHistoryOpen(false)}
                  className="rounded-2xl bg-slate-100 p-3 text-slate-600 hover:bg-slate-200"
                  aria-label="Close history"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
                {history.length === 0 ? (
                  <EmptyState
                    icon="history"
                    text="No checkout history in this browser yet."
                  />
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {history.map((item) => (
                      <article
                        key={item.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-mono text-2xl font-black text-slate-900">
                              {formatPlate(item.licensePlate)}
                            </p>
                            <p className="mt-1 text-xs font-bold text-slate-500">
                              {item.cardCode} · {item.customerType}
                            </p>
                          </div>
                          <p className="text-right text-lg font-black text-emerald-700">
                            {formatCurrency(item.amount)}
                          </p>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
                          <p>In: {formatDateTime(item.checkInTime)}</p>
                          <p>Out: {formatDateTime(item.checkOutTime)}</p>
                          <p>Method: {item.paymentMethod}</p>
                          <p>Status: {item.paymentStatus}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}

      {isMounted &&
        overlay &&
        createPortal(
          <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-emerald-700 p-6 text-white">
            <div className="w-full max-w-4xl rounded-[2rem] bg-white/15 p-8 text-center shadow-2xl backdrop-blur-sm">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/20">
                <span className="material-symbols-outlined text-6xl">paid</span>
              </div>
              <p className="mt-6 text-xs font-black uppercase tracking-[0.4em] text-white/70">
                Checkout summary
              </p>
              <h2 className="mt-2 font-mono text-5xl font-black tracking-widest">
                {formatPlate(overlay.session.licensePlate)}
              </h2>
              <div className="mt-8 grid gap-3 text-left md:grid-cols-2">
                <OverlayInfo
                  label="Card code"
                  value={overlay.session.cardCode ?? "—"}
                />
                <OverlayInfo label="Checkout plate" value={overlay.exitPlate} />
                <OverlayInfo
                  label="Check-in time"
                  value={formatDateTime(overlay.session.checkInTime)}
                />
                <OverlayInfo
                  label="Check-out time"
                  value={formatDateTime(overlay.checkOutTime)}
                />
                <OverlayInfo label="Duration" value={overlay.duration} />
                <OverlayInfo
                  label="Payment method"
                  value={String(overlay.payment.paymentMethod || paymentMethod)}
                />
                <OverlayInfo
                  label="Payment status"
                  value={String(overlay.payment.paymentStatus)}
                />
                <OverlayInfo
                  label="Amount due"
                  value={formatCurrency(overlay.payment.amount)}
                  strong
                />
              </div>
              {overlay.payment.paymentUrl && (
                <a
                  href={overlay.payment.paymentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex rounded-2xl bg-white px-5 py-3 text-sm font-black text-emerald-700"
                >
                  Open online payment URL
                </a>
              )}
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                {String(overlay.payment.paymentStatus).toUpperCase() !==
                  "PAID" && (
                    <button
                      type="button"
                      onClick={() => {
                        setSessions((current) =>
                          current.some(
                            (session) => session.id === overlay.session.id,
                          )
                            ? current
                            : [overlay.session, ...current],
                        );
                        setSelectedSessionId(overlay.session.id);
                        setExitPlate(overlay.exitPlate);
                        setSearchQuery(
                          overlay.session.cardCode ||
                          overlay.session.licensePlate,
                        );
                        setOverlay(null);
                        showToast(
                          "Returned to checkout screen. Current pending payment is still open until Backend supports cancel/change payment.",
                          "info",
                        );
                      }}
                      className="rounded-2xl border border-white/40 px-5 py-3 text-sm font-black text-white hover:bg-white/10"
                    >
                      Back to checkout
                    </button>
                  )}
                <button
                  type="button"
                  disabled={isReporting}
                  onClick={() => void handleReportPaymentIssue()}
                  className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                >
                  {isReporting ? "Reporting..." : "Report to manager"}
                </button>
                <button
                  type="button"
                  onClick={() => setOverlay(null)}
                  className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-emerald-700 hover:bg-emerald-50"
                >
                  Ready for next vehicle
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {isMounted &&
        showConfirmLostModal &&
        createPortal(
          <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950/75 p-6 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 text-slate-900 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 text-red-600">
                <span className="material-symbols-outlined text-4xl">
                  warning
                </span>
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    Confirm Lost Card Report
                  </h3>
                  <p className="text-sm font-semibold text-slate-500">
                    Lock the parking card in the system
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-sm space-y-2">
                <p className="text-slate-600 leading-relaxed">
                  You are about to report parking card{" "}
                  <strong className="font-mono text-slate-950 font-black">
                    {selectedSession?.cardCode}
                  </strong>{" "}
                  as lost for vehicle{" "}
                  <strong className="font-mono text-slate-950 font-black">
                    {formatPlate(selectedSession?.licensePlate ?? "")}
                  </strong>
                  .
                </p>
                <p className="text-slate-600 leading-relaxed">
                  This action will lock the card and mark the parking session as
                  a lost-card case. The customer will be charged the applicable
                  penalty and parking fee.
                </p>
                <p className="text-[11px] text-red-500 font-bold border-t border-slate-200/60 pt-2 mt-2">
                  * Note: A card reported as lost cannot be used at the entry or
                  exit gate until it is unlocked.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmLostModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void proceedWithMarkLost();
                  }}
                  className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-black text-white shadow-md shadow-red-600/10 hover:bg-red-700 transition"
                >
                  Confirm Lost Card
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {isMounted &&
        showNoCardErrorModal &&
        createPortal(
          <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950/75 p-6 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 text-slate-900 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 text-red-600">
                <span className="material-symbols-outlined text-4xl">
                  error
                </span>
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    Lost Card Report Required
                  </h3>
                  <p className="text-sm font-semibold text-slate-500">
                    A lost-card incident must be reported
                  </p>
                </div>
              </div>

              <div className="bg-red-50 rounded-2xl p-4 border border-red-100 text-sm text-red-800 space-y-2 leading-relaxed">
                <p>
                  The vehicle is checking out without presenting its card, but
                  the card has not been reported as lost.
                </p>
                <p className="font-bold">Required procedure:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>
                    Click{" "}
                    <strong className="underline text-red-950">
                      Report Lost Card
                    </strong>{" "}
                    on the right.
                  </li>
                  <li>
                    Confirm the report so the system can update the card status.
                  </li>
                  <li>
                    Continue with check-out payment only after the card status
                    changes to lost.
                  </li>
                </ol>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowNoCardErrorModal(false)}
                  className="w-full sm:w-auto rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-black text-white hover:bg-slate-800 transition"
                >
                  Understood
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {isMounted &&
        showPlateMismatchModal &&
        createPortal(
          <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950/75 p-6 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 text-slate-900 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
                    <span className="material-symbols-outlined text-2xl">
                      warning
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      Plate Mismatch Resolution
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      Select gate procedure for mismatched license plate
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPlateMismatchModal(false)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              {/* License Plate Comparison Box */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-400">
                    Check-in Plate
                  </span>
                  <p className="font-mono text-base font-black text-emerald-700 mt-0.5">
                    {selectedSession?.licensePlate || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-400">
                    Checkout Plate
                  </span>
                  <p className="font-mono text-base font-black text-rose-600 mt-0.5">
                    {exitPlate || "Not entered"}
                  </p>
                </div>
              </div>

              {/* Clickable Option Cards */}
              <div className="space-y-3">
                <p className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                  Select Action Procedure:
                </p>

                {/* Option 1: Fix OCR Plate */}
                <button
                  type="button"
                  onClick={() => {
                    setShowPlateMismatchModal(false);
                    if (selectedSession) {
                      setExitPlate(selectedSession.licensePlate);
                      showToast(
                        `License plate corrected to ${selectedSession.licensePlate} per BR-OPS-002 (Staff Physical Verification).`,
                        "success"
                      );
                    }
                  }}
                  className="w-full text-left p-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/90 hover:border-emerald-400 transition group flex items-start gap-3.5 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-xl">
                      check_circle
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-emerald-950">
                        1-Click Fix &amp; Match Plate
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-md">
                        BR-OPS-002
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800 font-medium mt-1 leading-relaxed">
                      Staff verifies vehicle physically at gate. Corrects camera OCR reading mistake in 1 second and allows standard checkout.
                    </p>
                  </div>
                </button>

                {/* Option 2: Report Fraud Incident */}
                <button
                  type="button"
                  onClick={async () => {
                    setShowPlateMismatchModal(false);
                    if (selectedSession) {
                      await executeReportFraud();
                    }
                  }}
                  className="w-full text-left p-4 rounded-2xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100/90 hover:border-rose-400 transition group flex items-start gap-3.5 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-xl">
                      report_problem
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-rose-950">
                        Report Fraud Incident to Manager
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-wider bg-rose-200/80 text-rose-900 px-2 py-0.5 rounded-md">
                        Incident Log
                      </span>
                    </div>
                    <p className="text-xs text-rose-800 font-medium mt-1 leading-relaxed">
                      Log suspicious vehicle/plate swap incident to Manager Tracking Dashboard for legal &amp; safety investigation.
                    </p>
                  </div>
                </button>
              </div>

              {/* Footer */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowPlateMismatchModal(false)}
                  className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <span className="mt-1 block">{children}</span>
    </label>
  );
}

function InfoBox({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p
        className={`mt-1 truncate text-sm font-black text-slate-800 ${mono ? "font-mono" : ""
          }`}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

function OverlayInfo({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white/15 p-4">
      <p className="text-xs font-black uppercase text-white/60">{label}</p>
      <p className={`mt-1 font-black ${strong ? "text-3xl" : "text-xl"}`}>
        {value}
      </p>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex h-full min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 text-center text-slate-400">
      <span className="material-symbols-outlined text-5xl">{icon}</span>
      <p className="mx-auto mt-3 max-w-xs text-sm font-semibold">{text}</p>
    </div>
  );
}
