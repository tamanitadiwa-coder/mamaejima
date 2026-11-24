import Link from "next/link";

// Stage 2 placeholder: sign in / register arrive in Stage 3.
export default function AccountPage() {
  return (
    <div className="wrap empty">
      <p className="eyebrow">Account</p>
      <h1>Accounts open soon</h1>
      <p className="muted" style={{ maxWidth: 440 }}>
        Sign in to keep your basket, saved addresses and order history on any device.
      </p>
      <Link href="/shop/" className="btn btn-outline">Browse the shop</Link>
    </div>
  );
}
