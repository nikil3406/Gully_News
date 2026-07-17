import { getPostPayload } from './postLocation';

describe('getPostPayload', () => {
  it('uses fallback coordinates when the form has not captured them yet', () => {
    const formData = {
      title: 'Test post',
      content: 'Hello',
      latitude: '',
      longitude: ''
    };

    const payload = getPostPayload(formData, { latitude: 12.9716, longitude: 77.5946 });

    expect(payload.latitude).toBe(12.9716);
    expect(payload.longitude).toBe(77.5946);
  });

  it('preserves the form coordinates when they are already set', () => {
    const formData = {
      title: 'Test post',
      content: 'Hello',
      latitude: 1.23,
      longitude: 4.56
    };

    const payload = getPostPayload(formData, { latitude: 12.9716, longitude: 77.5946 });

    expect(payload.latitude).toBe(1.23);
    expect(payload.longitude).toBe(4.56);
  });
});
