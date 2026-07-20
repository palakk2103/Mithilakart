export const loadRazorpayScript = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(window.Razorpay);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error('Failed to load Razorpay'));
    document.body.appendChild(script);
  });

export const openRazorpayCheckout = async ({
  keyId,
  amountInPaise,
  currency = 'INR',
  orderId,
  providerOrderId,
  name = 'Mithilakart',
  description = 'Order payment',
  prefill = {},
}) => {
  const Razorpay = await loadRazorpayScript();

  return new Promise((resolve, reject) => {
    const rzp = new Razorpay({
      key: keyId,
      amount: amountInPaise,
      currency,
      name,
      description,
      order_id: providerOrderId,
      prefill,
      theme: { color: '#3E5A44' },
      handler: (response) => {
        resolve({
          providerPaymentId: response.razorpay_payment_id,
          providerOrderId: response.razorpay_order_id,
          signature: response.razorpay_signature,
        });
      },
      modal: {
        ondismiss: () => reject(new Error('Payment cancelled')),
      },
    });

    rzp.on('payment.failed', (response) => {
      reject(new Error(response.error?.description || 'Payment failed'));
    });

    rzp.open();
  });
};
