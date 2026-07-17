export const getPostPayload = (formData, fallbackLocation = null, markerLocation = null) => {
  const latitude = formData.latitude !== '' && formData.latitude !== undefined && formData.latitude !== null
    ? formData.latitude
    : markerLocation?.latitude ?? fallbackLocation?.latitude ?? '';

  const longitude = formData.longitude !== '' && formData.longitude !== undefined && formData.longitude !== null
    ? formData.longitude
    : markerLocation?.longitude ?? fallbackLocation?.longitude ?? '';

  return {
    ...formData,
    latitude,
    longitude,
  };
};
