export const normalizeNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const normalizeInteger = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = typeof value === "number" ? value : parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

export const normalizeOptionalText = (value) => {
  if (value === undefined || value === null || value === "") return null;
  return value;
};
