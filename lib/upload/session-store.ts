export const sessionStore = (() => {
  let _verified = false;
  return {
    isVerified: () => _verified,
    setVerified: (v: boolean) => {
      _verified = v;
    },
    clear: () => {
      _verified = false;
    },
  };
})();
