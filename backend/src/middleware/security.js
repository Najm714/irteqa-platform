// backend/src/middleware/security.js

export const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
};

export const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (id && !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      });
    }
    next();
  };
};

export const preventIDOR = (resourceModel, resourceIdParam = 'id', accountIdField = 'accountId') => {
  return async (req, res, next) => {
    try {
      const { portalId } = req.portal;
      const { id: userId } = req.user;
      const resourceId = req.params[resourceIdParam];

      const resource = await resourceModel.findOne({
        _id: resourceId,
        portalId,
      });

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found',
        });
      }

      if (req.user.role !== 'portal_admin' && req.user.role !== 'super_admin') {
        const ownerId = resource[accountIdField] || resource.accountId;
        if (ownerId && ownerId.toString() !== userId) {
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to access this resource',
          });
        }
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error('❌ IDOR prevention error:', error);
      res.status(500).json({
        success: false,
        message: 'Authorization error',
      });
    }
  };
};

// ✅ تصدير نفس الدالة باسمين (للتوافق)
export const protectIDOR = preventIDOR;

export const validatePortalId = (req, res, next) => {
  const portalId = req.headers['x-portal-id'] || req.query.portalId || req.body.portalId;
  
  if (!portalId && req.path !== '/health' && req.path !== '/api/health') {
    return res.status(400).json({
      success: false,
      message: 'Portal ID is required',
    });
  }
  
  next();
};

export default {
  securityHeaders,
  validateObjectId,
  preventIDOR,
  protectIDOR,
  validatePortalId,
};