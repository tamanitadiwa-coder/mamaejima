"use client";

import { useEffect, useRef, useState } from "react";
import { useInstall, type SheetView } from "./InstallProvider";
import { CheckIcon, CloseIcon, PlusSquareIcon, ShareIcon } from "./Icons";

export function InstallSheet({ view, onClose }: { view: SheetView; onClose: () => void }) {
  const inst = useInstall();
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [declined, setDeclined] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  let content: React.ReactNode;

  if (view === "success") {
    content = (
      <div className="stack" style={{ ["--s" as string]: "18px", textAlign: "center", padding: "12px 0" }}>
        <div className="success-mark" style={{ margin: "0 auto" }}>
          <CheckIcon />
        </div>
        <h2>You’re all set!</h2>
        <p className="muted">
          Mama Ejima has been added to your Home Screen. You can now open your store directly from your device.
        </p>
        <button className="btn btn-block" onClick={onClose}>
          Start shopping
        </button>
      </div>
    );
  } else if (view === "ios-verify") {
    content = (
      <div className="stack" style={{ ["--s" as string]: "16px" }}>
        <p className="eyebrow">Almost there</p>
        <h2>Check your Home Screen</h2>
        <p className="muted">
          Look for the Mama Ejima icon — a bronze chevron on dark brown. Open it from there. If the store opens
          without Safari’s address bar, it’s installed.
        </p>
        <p className="muted small">Can’t find it? Swipe down on your Home Screen and search “Mama Ejima”.</p>
        <div className="row" style={{ marginTop: 24 }}>
          <button className="btn btn-outline grow" onClick={() => inst.open("auto")}>
            Show steps again
          </button>
          <button className="btn grow" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    );
  } else if (inst.installed) {
    content = (
      <div className="stack" style={{ ["--s" as string]: "16px" }}>
        <p className="eyebrow">Installed</p>
        <h2>Mama Ejima is on this device</h2>
        <p className="muted">
          Open it from your Home Screen or app list. If you removed it, you can add it again from your browser
          menu.
        </p>
        <button className="btn btn-block" onClick={onClose}>
          Close
        </button>
      </div>
    );
  } else if (inst.platform === "ios-safari") {
    content = <IosSteps onDone={inst.markIosManual} />;
  } else if (inst.platform === "ios-other") {
    content = (
      <div className="stack" style={{ ["--s" as string]: "16px" }}>
        <p className="eyebrow">Install on iPhone</p>
        <h2>Open this page in Safari first</h2>
        <p className="muted">
          On iPhone, apps like this are added to the Home Screen from Safari. Copy the link below, open Safari,
          paste it in the address bar, then tap Install again.
        </p>
        <CopyLink />
      </div>
    );
  } else if (inst.canPrompt && !declined) {
    content = (
      <div className="stack" style={{ ["--s" as string]: "16px" }}>
        <p className="eyebrow">Install the app</p>
        <h2>Install Mama Ejima</h2>
        <p className="muted">
          Add the store to your {inst.platform === "android" ? "phone" : "device"}. It opens like an app, keeps
          your basket, and works even when your signal drops.
        </p>
        <button
          className="btn btn-block"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const r = await inst.promptInstall();
            setBusy(false);
            if (r !== "accepted") setDeclined(true);
            // On "accepted" we wait for the browser's appinstalled event to show success.
            if (r === "accepted") onClose();
          }}
        >
          {busy ? <span className="spinner" /> : "Install Mama Ejima"}
        </button>
      </div>
    );
  } else {
    content = <ManualSteps platform={inst.platform} declined={declined} />;
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="sheet sheet-wrap"
        role="dialog"
        aria-modal="true"
        aria-label="Install Mama Ejima"
        ref={ref}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="icon-btn sheet-close" onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>
        {content}
      </div>
    </div>
  );
}

function IosSteps({ onDone }: { onDone: () => void }) {
  return (
    <div>
      <p className="eyebrow">Install on iPhone</p>
      <h2 style={{ marginTop: 10 }}>Add Mama Ejima to your Home Screen</h2>
      <p className="muted small" style={{ marginTop: 10 }}>
        iPhone doesn’t install web apps automatically. It takes four taps.
      </p>
      <ol className="ios-steps" style={{ padding: 0 }}>
        <li className="ios-step">
          <div className="ios-illus" aria-hidden>
            <SafariIllus />
          </div>
          <div>
            <span className="num-label">STEP 1</span>
            <p>Open Mama Ejima in <strong>Safari</strong>. You’re here now.</p>
          </div>
        </li>
        <li className="ios-step">
          <div className="ios-illus" aria-hidden>
            <ToolbarIllus />
          </div>
          <div>
            <span className="num-label">STEP 2</span>
            <p>
              Tap the <strong>Share</strong> icon <ShareInline /> — at the bottom of the screen, or next to the
              address bar.
            </p>
          </div>
        </li>
        <li className="ios-step">
          <div className="ios-illus" aria-hidden>
            <ShareSheetIllus />
          </div>
          <div>
            <span className="num-label">STEP 3</span>
            <p>
              Scroll down and choose <strong>Add to Home Screen</strong>.
            </p>
          </div>
        </li>
        <li className="ios-step">
          <div className="ios-illus" aria-hidden>
            <AddIllus />
          </div>
          <div>
            <span className="num-label">STEP 4</span>
            <p>
              Tap <strong>Add</strong> in the top corner.
            </p>
          </div>
        </li>
      </ol>
      <button className="btn btn-block" onClick={onDone}>
        I’ve added it
      </button>
      <p className="hint" style={{ textAlign: "center" }}>
        Don’t see “Add to Home Screen”? Tap <em>Edit Actions</em> at the bottom of the share list to add it.
      </p>
    </div>
  );
}

const ShareInline = () => (
  <span style={{ display: "inline-flex", verticalAlign: "-4px", color: "#2f6fd6" }}>
    <ShareIcon size={18} />
  </span>
);

// Simple interface-style drawings, in brand colours, not screenshots.
function SafariIllus() {
  return (
    <svg width="96" height="64" viewBox="0 0 96 64" fill="none">
      <rect x="8" y="6" width="80" height="12" rx="6" fill="#ece3d4" />
      <text x="48" y="15" textAnchor="middle" fontSize="7" fill="#6e655b" fontFamily="system-ui">
        mamaejima
      </text>
      <rect x="8" y="24" width="80" height="34" fill="#3b2a1e" />
      <g transform="translate(38 30)">
        <svg width="20" height="20" viewBox="0 0 100 100">
          <path d="M 10 61 L 30 33 L 50 61 L 70 33 L 90 61 M 10 80 L 30 52 L 50 80 L 70 52 L 90 80 M 10 42 L 30 14 L 50 42 L 70 14 L 90 42" stroke="#b08d5b" strokeWidth="8" fill="none" />
        </svg>
      </g>
    </svg>
  );
}
function ToolbarIllus() {
  return (
    <svg width="96" height="64" viewBox="0 0 96 64" fill="none">
      <rect x="4" y="36" width="88" height="22" rx="4" fill="#ece3d4" />
      <path d="M16 47h6M30 44l-3 3 3 3M62 47h10" stroke="#948a7e" strokeWidth="1.5" />
      <circle cx="48" cy="47" r="10" fill="none" stroke="#2f6fd6" strokeWidth="1.2" />
      <g transform="translate(40 39)" color="#2f6fd6">
        <ShareIcon size={16} />
      </g>
    </svg>
  );
}
function ShareSheetIllus() {
  return (
    <svg width="96" height="64" viewBox="0 0 96 64" fill="none">
      <rect x="6" y="6" width="84" height="52" rx="6" fill="#fbf8f2" stroke="#ddd2c0" />
      <rect x="12" y="13" width="72" height="10" rx="2" fill="#ece3d4" />
      <rect x="12" y="27" width="72" height="12" rx="2" fill="#1a1714" />
      <text x="17" y="35.5" fontSize="6.5" fill="#f6f1e8" fontFamily="system-ui">
        Add to Home Screen
      </text>
      <g transform="translate(70 28.5)" color="#f6f1e8">
        <PlusSquareIcon size={9} />
      </g>
      <rect x="12" y="43" width="72" height="10" rx="2" fill="#ece3d4" />
    </svg>
  );
}
function AddIllus() {
  return (
    <svg width="96" height="64" viewBox="0 0 96 64" fill="none">
      <rect x="6" y="6" width="84" height="52" rx="6" fill="#fbf8f2" stroke="#ddd2c0" />
      <text x="12" y="19" fontSize="7" fill="#6e655b" fontFamily="system-ui">
        Cancel
      </text>
      <rect x="64" y="11" width="22" height="12" rx="3" fill="#1a1714" />
      <text x="75" y="19.5" textAnchor="middle" fontSize="7" fill="#f6f1e8" fontFamily="system-ui" fontWeight="600">
        Add
      </text>
      <rect x="12" y="30" width="20" height="20" rx="5" fill="#3b2a1e" />
      <path d="M15 42l3.5-4 3.5 4 3.5-4 3.5 4" stroke="#b08d5b" strokeWidth="1.4" fill="none" />
      <text x="38" y="43" fontSize="7" fill="#1a1714" fontFamily="system-ui">
        Mama Ejima
      </text>
    </svg>
  );
}

function ManualSteps({ platform, declined }: { platform: string; declined: boolean }) {
  return (
    <div className="stack" style={{ ["--s" as string]: "16px" }}>
      <p className="eyebrow">Install the app</p>
      <h2>Add Mama Ejima to your {platform === "android" ? "phone" : "device"}</h2>
      {declined && <p className="notice">No problem. You can install it any time using the steps below.</p>}
      {platform === "android" ? (
        <ol className="prose" style={{ paddingBottom: 0, paddingLeft: 18 }}>
          <li>Open this page in Chrome.</li>
          <li>
            Tap the <strong>⋮</strong> menu in the top corner.
          </li>
          <li>
            Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.
          </li>
          <li>Confirm. The icon appears with your other apps.</li>
        </ol>
      ) : (
        <ol className="prose" style={{ paddingBottom: 0, paddingLeft: 18 }}>
          <li>Use Chrome or Edge on your computer.</li>
          <li>
            Look for the install icon at the right of the address bar, or open the browser menu and choose{" "}
            <strong>Install Mama Ejima</strong>.
          </li>
          <li>Confirm. The store opens in its own window.</li>
        </ol>
      )}
      <p className="hint">Some browsers don’t support installing. Chrome works best.</p>
    </div>
  );
}

function CopyLink() {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.origin : "";
  return (
    <div className="stack" style={{ ["--s" as string]: "10px" }}>
      <input className="input" readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
      <button
        className="btn btn-block"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
          } catch {}
        }}
      >
        {copied ? "Link copied" : "Copy link"}
      </button>
    </div>
  );
}
