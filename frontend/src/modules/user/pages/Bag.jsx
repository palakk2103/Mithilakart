import { Navigate } from 'react-router-dom';

/** Bag route redirects to the live wishlist (API-backed). */
const Bag = () => <Navigate to="/wishlist" replace />;

export default Bag;
