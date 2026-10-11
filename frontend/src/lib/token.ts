const TOKEN_KEY = 'access_token'

// localStorage keeps the user logged in across reloads. The trade-off is that
// scripts on the page can read it, so the app must not render untrusted HTML.
export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}
