const REVIEW_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  HIDDEN: 'hidden',
};

const REVIEW_STATUS_VALUES = Object.values(REVIEW_STATUS);

const QNA_STATUS = {
  PENDING: 'pending',
  ANSWERED: 'answered',
  HIDDEN: 'hidden',
};

const QNA_STATUS_VALUES = Object.values(QNA_STATUS);

const MAX_WISHLIST_ITEMS = 200;
const MAX_REVIEWS_PER_DAY = 5;

module.exports = {
  REVIEW_STATUS,
  REVIEW_STATUS_VALUES,
  QNA_STATUS,
  QNA_STATUS_VALUES,
  MAX_WISHLIST_ITEMS,
  MAX_REVIEWS_PER_DAY,
};
