// Server-only parts of the account feature, for route handlers.
export {
  callbackQuerySchema,
  deleteAccountSchema,
  displayNameSchema,
  emailCodeSchema,
  emailSignInSchema,
  type CallbackQuery,
} from "./schemas";
export {
  deleteAccount,
  finishSignIn,
  getAccountStatus,
  rememberGuestForSignIn,
  setDisplayName,
  type NameOutcome,
  type SignInResult,
} from "./service";
