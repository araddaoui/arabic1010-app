const productionFlag = import.meta.env.VITE_ENABLE_PRODUCTION_SERVICES === "true";

export const appConfig = {
  environment: import.meta.env.VITE_APP_ENV || "demo",
  productionServicesEnabled: productionFlag,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "",
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
  checkoutFunctionUrl: import.meta.env.VITE_CHECKOUT_FUNCTION_URL || "",
} as const;

export const isProductionMode =
  appConfig.productionServicesEnabled &&
  Boolean(appConfig.supabaseUrl && appConfig.supabaseAnonKey && appConfig.checkoutFunctionUrl);

export function assertProductionServicesEnabled(): void {
  if (!isProductionMode) throw new Error("Production services are disabled; demo mode remains active.");
}
