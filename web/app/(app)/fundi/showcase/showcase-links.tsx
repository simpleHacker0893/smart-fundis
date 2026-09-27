"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { ShowcaseLinksEditor } from "@/components/showcase-links-editor";

/** The Fundi's YouTube and TikTok links (US-3.8), stored by fundiProfiles. Mount behind FundiGuard. */
export function ShowcaseLinks() {
  const links = useQuery(api.fundiProfiles.myShowcaseLinks, {});
  const save = useMutation(api.fundiProfiles.setShowcaseLinks);
  return <ShowcaseLinksEditor links={links} onSave={save} />;
}
