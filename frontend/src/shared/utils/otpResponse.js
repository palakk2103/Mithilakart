/**
 * Normalize OTP send API response for login/register screens.
 */
export function applyOtpSendResult(result, { setOtp, setSuccess, setOtpSent, setTimer }) {
  setOtpSent(true);
  if (setTimer) setTimer(60);

  if (result?.devOtp) {
    setOtp?.(result.devOtp);
    setSuccess(
      result.smsSent === false
        ? `OTP: ${result.devOtp} (SMS not delivered — use this code)`
        : `OTP sent. If SMS is delayed, use: ${result.devOtp}`
    );
    return;
  }

  if (result?.smsSent === false) {
    setSuccess('OTP generated. Check your phone or try again shortly.');
    return;
  }

  setSuccess('OTP sent successfully to your phone');
}

export function mapDeliveryVehicleType(value) {
  const map = {
    Bike: 'bike',
    'E-Bike': 'scooter',
    Cycle: 'bicycle',
    bike: 'bike',
    scooter: 'scooter',
    bicycle: 'bicycle',
    van: 'van',
  };
  return map[value] || 'bike';
}
