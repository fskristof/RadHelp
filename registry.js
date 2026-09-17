// Egyszerű regisztrátor a score modulokhoz, hogy könnyű legyen új scoring rendszert hozzáadni.
window.RadHelpRegistry = (function () {
  const modules = [];
  return {
    register(mod) {
      modules.push(mod);
    },
    all() {
      return modules;
    },
    get(id) {
      return modules.find((m) => m.id === id);
    },
  };
})();
