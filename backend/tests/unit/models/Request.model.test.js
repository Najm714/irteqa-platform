// backend/tests/unit/models/Request.model.test.js
import mongoose from 'mongoose';
import { Request } from '../../../src/models/Request.model.js';

describe('Request Model', () => {
  let testRequest;

  beforeEach(() => {
    testRequest = new Request({
      portalId: new mongoose.Types.ObjectId(),
      accountId: new mongoose.Types.ObjectId(),
      serviceId: new mongoose.Types.ObjectId(),
      formSchemaSnapshot: {},
      formData: { title: 'Test Request' },
      status: 'new',
    });
  });

  describe('canTransitionTo', () => {
    it('should allow transition from new to under_review', () => {
      expect(testRequest.canTransitionTo('under_review')).toBe(true);
    });

    it('should allow transition from new to cancelled', () => {
      expect(testRequest.canTransitionTo('cancelled')).toBe(true);
    });

    it('should not allow transition from new to completed', () => {
      expect(testRequest.canTransitionTo('completed')).toBe(false);
    });

    it('should allow transition from in_progress to under_review', () => {
      testRequest.status = 'in_progress';
      expect(testRequest.canTransitionTo('under_review')).toBe(true);
    });

    it('should allow transition from completed to closed', () => {
      testRequest.status = 'completed';
      expect(testRequest.canTransitionTo('closed')).toBe(true);
    });

    it('should not allow transition from closed to anything', () => {
      testRequest.status = 'closed';
      expect(testRequest.canTransitionTo('under_review')).toBe(false);
      expect(testRequest.canTransitionTo('completed')).toBe(false);
    });
  });

  describe('addActivity', () => {
    it('should add activity to log', () => {
      const actorId = new mongoose.Types.ObjectId().toString();
      
      testRequest.addActivity('test_action', actorId, 'customer', 'old', 'new');
      
      expect(testRequest.activityLog).toHaveLength(1);
      expect(testRequest.activityLog[0]).toHaveProperty('action', 'test_action');
      expect(testRequest.activityLog[0]).toHaveProperty('actorId');
      expect(testRequest.activityLog[0].actorId.toString()).toBe(actorId);
      expect(testRequest.activityLog[0]).toHaveProperty('actorRole', 'customer');
      expect(testRequest.activityLog[0]).toHaveProperty('oldValue', 'old');
      expect(testRequest.activityLog[0]).toHaveProperty('newValue', 'new');
      expect(testRequest.activityLog[0]).toHaveProperty('timestamp');
    });

    it('should update updatedAt timestamp', () => {
      const oldUpdatedAt = testRequest.updatedAt;
      
      testRequest.addActivity('test_action', new mongoose.Types.ObjectId(), 'customer');
      
      expect(testRequest.updatedAt.getTime()).toBeGreaterThanOrEqual(oldUpdatedAt.getTime());
    });
  });
});