export const tokenStore = (() => {
  let _token: string | null = null;
  return {
    get: () => _token,
    set: (t: string | null) => {
      _token = t;
    },
    clear: () => {
      _token = null;
    },
  };
})();
