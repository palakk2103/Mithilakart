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
  if (!keyId) {
    throw new Error('Razorpay is not configured. Missing key ID.');
  }
  if (!providerOrderId) {
    throw new Error('Payment session expired. Please try again.');
  }

  const Razorpay = await loadRazorpayScript();
  const isTestKey = String(keyId).startsWith('rzp_test_');

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
      ...(isTestKey
        ? {
            config: {
              display: {
                blocks: {
                  card: {
                    name: 'Pay using Card (recommended for test)',
                    instruments: [{ method: 'card' }],
                  },
                  upi: {
                    name: 'UPI (use success@razorpay in test)',
                    instruments: [{ method: 'upi' }],
                  },
                },
                sequence: ['block.card', 'block.upi'],
                preferences: { show_default_blocks: false },
              },
            },
          }
        : {}),
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
      const description = response.error?.description || 'Payment failed';
      const hint = isTestKey && /another method|validate|account/i.test(description)
        ? `${description}. Test mode: try Card 4111 1111 1111 1111 or UPI success@razorpay`
        : description;
      reject(new Error(hint));
    });

    rzp.open();
  });
};
