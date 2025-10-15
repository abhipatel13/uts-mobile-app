// Global handlers for authentication state management
// This file breaks the circular dependency between App.js and CustomDrawerContent.js

let globalLogoutHandler = null;
let globalAuthRefreshHandler = null;

export const setGlobalLogoutHandler = (handler) => {
  globalLogoutHandler = handler;
};

export const setGlobalAuthRefreshHandler = (handler) => {
  globalAuthRefreshHandler = handler;
};

export const triggerGlobalLogout = () => {
  if (globalLogoutHandler) {
    globalLogoutHandler();
  }
};

export const triggerAuthRefresh = () => {
  if (globalAuthRefreshHandler) {
    globalAuthRefreshHandler();
  } else {
    console.warn('No global auth refresh handler registered');
  }
};
