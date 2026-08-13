declare global {
  interface Window {
    Razorpay: any;
  }
}

interface OpenCheckoutParams {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  deviceName: string;
  userEmail?: string;
  userName?: string;
  onSuccess: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  onDismiss?: () => void;
}

export function openRazorpayCheckout(params: OpenCheckoutParams) {
  if (!window.Razorpay) {
    alert("Payment SDK not loaded. Please refresh and try again.");
    return;
  }

  const rzp = new window.Razorpay({
    key: params.keyId,
    amount: params.amount,
    currency: params.currency,
    order_id: params.orderId,
    name: "GridSphere",
    description: `Subscription for ${params.deviceName}`,
    prefill: { email: params.userEmail, name: params.userName },
    theme: { color: "#16A34A" },
    handler: (response: any) => params.onSuccess(response),
    modal: {
      ondismiss: () => params.onDismiss?.(),
    },
  });

  rzp.open();
}