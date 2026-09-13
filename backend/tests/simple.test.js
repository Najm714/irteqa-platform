// backend/tests/simple.test.js
// ✅ اختبارات بسيطة لا تعتمد على قاعدة البيانات

describe('Simple Test', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });

  it('should handle async', async () => {
    const result = await Promise.resolve('success');
    expect(result).toBe('success');
  });

  it('should test basic math', () => {
    expect(2 + 2).toBe(4);
  });

  it('should test string operations', () => {
    expect('hello'.toUpperCase()).toBe('HELLO');
  });
});