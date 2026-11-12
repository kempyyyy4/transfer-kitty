// Server-only parts of the account feature, for route handlers.
export {
  callbackQuerySchema,
  displayNameSchema,
  emailSignInSchema,
  type CallbackQuery,
} from "./schemas";
export {
  finishSignIn,
  getAccountStatus,
  rememberGuestForSignIn,
  setDisplayName,
  type NameOutcome,
  type SignInResult,
} from "./service";
