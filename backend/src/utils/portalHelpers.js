// backend/src/utils/portalHelpers.js

/**
 * استخراج Portal ID من أي شكل:
 * - ObjectId
 * - String
 * - Populated Object { _id, name, slug }
 * - null/undefined
 */
export const extractPortalId = (portal) => {
  if (!portal) return null;
  
  // Populated object
  if (typeof portal === 'object' && portal._id) {
    return portal._id.toString();
  }
  
  // ObjectId أو string
  return portal.toString();
};

/**
 * مقارنة portalId بشكل آمن
 */
export const isSamePortal = (portal1, portal2) => {
  const id1 = extractPortalId(portal1);
  const id2 = extractPortalId(portal2);
  
  if (!id1 || !id2) return false;
  return id1 === id2;
};

/**
 * التحقق من أن الحساب ينتمي للبوابة
 */
export const accountBelongsToPortal = (account, portalId) => {
  if (!account || !portalId) return false;
  
  // Super admin: يمكنه الوصول لأي بوابة
  if (account.role === 'super_admin') {
    return true;
  }
  
  // باقي الأدوار: يجب أن يطابق portalId الحساب
  return isSamePortal(account.portalId, portalId);
};

/**
 * الحصول على Portal ID الفعلي من الطلب
 */
export const getEffectivePortalId = (req) => {
  return (
    req.portalId ||
    extractPortalId(req.portal) ||
    extractPortalId(req.user?.portalId) ||
    extractPortalId(req.account?.portalId) ||
    null
  );
};