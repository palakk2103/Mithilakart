/**
 * Normalize OTP send API response for login/register screens.
 */
export function applyOtpSendResult(result, { setOtp, setSuccess, setOtpSent, setTimer }) {
  setOtpSent(true);
  if (setTimer) setTimer(60);

  const otpCode = result?.devOtp || result?.defaultOtp;
  if (otpCode) {
    setOtp?.(otpCode);
    setSuccess(
      result.smsSent === false
        ? `OTP: ${otpCode} (SMS not required — test code active)`
        : `OTP sent. Test code: ${otpCode}`
    );
    return;
  }

  if (result?.smsSent === false) {
    setSuccess('OTP generated. Use test code 123456 if SMS is not received.');
    return;
  }

  setSuccess('OTP sent successfully to your phone (Test code: 123456)');
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
