"use client";
import { useInstall } from "./InstallProvider";

export function FooterInstall() {
  const inst = useInstall();
  return (
    <button className="link" style={{ borderBottom: 0, fontSize: "inherit" }} onClick={() => inst.open()}>
      {inst.installed ? "App installed" : "Install the app"}
    </button>
  );
}
