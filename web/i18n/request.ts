import { getRequestConfig } from "next-intl/server";
import { defaultLocale } from "./config";

// No locale routing: every request uses the default locale.
export default getRequestConfig(async () => {
  const locale = defaultLocale;
  return {
    locale,
    // Kenya only; a fixed zone keeps server and client dates the same.
    timeZone: "Africa/Nairobi",
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
