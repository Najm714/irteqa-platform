// backend/src/middleware/requestAuth.js
import { Request } from '../models/Request.model.js';

// ============================================================
// ✅ التحقق من وجود الطلب وصلاحية الوصول
// ============================================================
export const getRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId;
    const accountId = req.accountId;
    const role = req.account?.role;

    console.log('🔍 getRequest middleware:');
    console.log('  - Request ID:', id);
    console.log('  - Portal ID:', portalId);
    console.log('  - Account ID:', accountId);
    console.log('  - Account ID (string):', accountId?.toString());
    console.log('  - Role:', role);

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
      });
    }

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const request = await Request.findOne({ 
      _id: id, 
      portalId,
      isDeleted: { $ne: true },
    });

    if (!request) {
      console.log('❌ Request not found');
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    // ✅ تحويل كلاهما إلى String للمقارنة
    const requestAccountId = request.accountId?.toString();
    const requestSpecialistId = request.specialistId?.toString();
    const currentAccountId = accountId.toString();

    console.log('  - Request found:', request._id);
    console.log('  - Request accountId (string):', requestAccountId);
    console.log('  - Request specialistId (string):', requestSpecialistId);
    console.log('  - Current accountId (string):', currentAccountId);
    console.log('  - Request status:', request.status);

    // ✅ التحقق من صلاحية الوصول - مع تحويل الكل إلى String
    const isOwner = requestAccountId === currentAccountId;
    const isSpecialist = requestSpecialistId === currentAccountId;
    const isAdmin = role === 'portal_admin' || role === 'super_admin';

    console.log('  - isOwner:', isOwner);
    console.log('  - isSpecialist:', isSpecialist);
    console.log('  - isAdmin:', isAdmin);

    // ✅ السماح للعميل صاحب الطلب، والمختص المسند، والمدير
    if (!isOwner && !isSpecialist && !isAdmin) {
      console.log('❌ Access denied - user does not have permission');
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this request',
      });
    }

    console.log('✅ Access granted');
    req.request = request;
    next();
  } catch (error) {
    console.error('❌ Error in getRequest middleware:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ التحقق من صلاحية المختص للطلب
// ============================================================
export const requireSpecialistAccess = async (req, res, next) => {
  try {
    const request = req.request;
    const accountId = req.accountId;
    const role = req.account?.role;

    if (!request) {
      return res.status(400).json({
        success: false,
        message: 'Request not found in request context',
      });
    }

    // ✅ تحويل كلاهما إلى String للمقارنة
    const requestSpecialistId = request.specialistId?.toString();
    const currentAccountId = accountId?.toString();

    const isSpecialist = requestSpecialistId === currentAccountId;
    const isAdmin = role === 'portal_admin' || role === 'super_admin';

    if (!isSpecialist && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned specialist or admin can perform this action',
      });
    }

    next();
  } catch (error) {
    console.error('❌ Error in requireSpecialistAccess:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ التحقق من صلاحية العميل للطلب
// ============================================================
export const requireCustomerAccess = async (req, res, next) => {
  try {
    const request = req.request;
    const accountId = req.accountId;
    const role = req.account?.role;

    if (!request) {
      return res.status(400).json({
        success: false,
        message: 'Request not found in request context',
      });
    }

    // ✅ تحويل كلاهما إلى String للمقارنة
    const requestAccountId = request.accountId?.toString();
    const currentAccountId = accountId?.toString();

    const isOwner = requestAccountId === currentAccountId;
    const isAdmin = role === 'portal_admin' || role === 'super_admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the request owner or admin can perform this action',
      });
    }

    next();
  } catch (error) {
    console.error('❌ Error in requireCustomerAccess:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ التحقق من صلاحية تغيير الحالة
// ============================================================
export const canTransitionStatus = async (req, res, next) => {
  try {
    const request = req.request;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'New status is required',
      });
    }

    // ✅ التحقق من أن الحالة الجديدة مسموحة
    const allowedTransitions = {
      'new': ['under_review', 'cancelled'],
      'under_review': ['assigned', 'cancelled'],
      'assigned': ['scope_definition', 'cancelled'],
      'scope_definition': ['awaiting_approval', 'cancelled'],
      'awaiting_approval': ['awaiting_payment', 'scope_definition', 'cancelled'],
      'awaiting_payment': ['in_progress', 'cancelled'],
      'in_progress': ['under_review_2', 'cancelled'],
      'under_review_2': ['modification', 'completed', 'cancelled'],
      'modification': ['in_progress', 'cancelled'],
      'completed': ['closed'],
      'closed': [],
      'cancelled': [],
    };

    const allowed = allowedTransitions[request.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from "${request.status}" to "${status}"`,
      });
    }

    req.newStatus = status;
    next();
  } catch (error) {
    console.error('❌ Error in canTransitionStatus:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};