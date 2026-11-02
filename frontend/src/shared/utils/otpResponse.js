import i18n from '../../i18n';

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
        ? i18n.t('x.otpTestActive', { code: otpCode })
        : i18n.t('x.otpSentTest', { code: otpCode })
    );
    return;
  }

  if (result?.smsSent === false) {
    setSuccess(i18n.t('x.otpGenerated'));
    return;
  }

  setSuccess(i18n.t('x.otpSentPhone'));
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
