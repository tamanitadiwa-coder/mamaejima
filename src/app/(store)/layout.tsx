import { StoreShell } from "@/components/StoreShell";
import { Footer } from "@/components/Footer";
import { store } from "@/server/store";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await store.getSettings();
  const announcement = settings.announcementActive && settings.announcement.trim() ? settings.announcement : null;
  return (
    <StoreShell announcement={announcement} footer={<Footer settings={settings} />}>
      {children}
    </StoreShell>
  );
}
