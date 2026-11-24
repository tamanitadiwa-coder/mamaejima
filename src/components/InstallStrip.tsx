"use client";
import { useInstall } from "./InstallProvider";
import { CloseIcon, Mark } from "./Icons";

/** Quiet, dismissible, shown once per device until dismissed or installed. */
export function InstallStrip() {
  const inst = useInstall();
  if (!inst.showInstall || inst.stripDismissed) return null;
  return (
    <div style={{ borderBottom: "1px solid var(--line)", background: "var(--paper)" }}>
      <div className="wrap row" style={{ padding: "12px var(--gutter)", gap: 14 }}>
        <span style={{ color: "var(--earth)", flex: "none" }}><Mark size={28} /></span>
        <p className="small grow">Add Mama Ejima to your Home Screen for quicker ordering.</p>
        <button className="btn btn-sm btn-outline" onClick={() => inst.open()}>Install</button>
        <button className="icon-btn" aria-label="Dismiss" onClick={inst.dismissStrip} style={{ width: 36 }}>
          <CloseIcon size={18} />
        </button>
      </div>
    </div>
  );
}
