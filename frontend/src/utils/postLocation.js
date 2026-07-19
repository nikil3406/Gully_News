const normalizeCoordinate = (value) => {
  if (value === '' || value === undefined || value === null) return '';
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : '';
};

export const getPostPayload = (formData, fallbackLocation = null, markerLocation = null) => {
  const latitude = formData.latitude !== '' && formData.latitude !== undefined && formData.latitude !== null
    ? normalizeCoordinate(formData.latitude)
    : normalizeCoordinate(markerLocation?.latitude ?? fallbackLocation?.latitude ?? '');

  const longitude = formData.longitude !== '' && formData.longitude !== undefined && formData.longitude !== null
    ? normalizeCoordinate(formData.longitude)
    : normalizeCoordinate(markerLocation?.longitude ?? fallbackLocation?.longitude ?? '');

  return {
    ...formData,
    latitude,
    longitude,
  };
};
