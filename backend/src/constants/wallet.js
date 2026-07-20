const WALLET_TX_TYPE = {
  CREDIT: 'credit',
  DEBIT: 'debit',
};

const WALLET_TX_TYPE_VALUES = Object.values(WALLET_TX_TYPE);

const WALLET_TX_REFERENCE = {
  REFUND: 'refund',
  ORDER: 'order',
  PROMOTION: 'promotion',
  ADJUSTMENT: 'adjustment',
};

const WALLET_TX_REFERENCE_VALUES = Object.values(WALLET_TX_REFERENCE);

const REFUND_METHOD = {
  WALLET: 'wallet',
  SOURCE: 'source',
};

const REFUND_METHOD_VALUES = Object.values(REFUND_METHOD);

const REFUND_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REJECTED: 'rejected',
};

const REFUND_STATUS_VALUES = Object.values(REFUND_STATUS);

module.exports = {
  WALLET_TX_TYPE,
  WALLET_TX_TYPE_VALUES,
  WALLET_TX_REFERENCE,
  WALLET_TX_REFERENCE_VALUES,
  REFUND_METHOD,
  REFUND_METHOD_VALUES,
  REFUND_STATUS,
  REFUND_STATUS_VALUES,
};
