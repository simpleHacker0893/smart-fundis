import { getRequestConfig } from "next-intl/server";

// English only for now (AGENTS.md rule 5): no locale routing, no sw.json.
export default getRequestConfig(async () => {
  const locale = "en";
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
