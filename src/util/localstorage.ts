export const getLocalstorageJsonOrNull = (key: string) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "") || null;
  } catch (_) {
    return null;
  }
};
