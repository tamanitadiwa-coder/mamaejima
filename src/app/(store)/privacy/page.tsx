export const metadata = { title: "Privacy" };

// Plain-language privacy notice. Have it reviewed for POPIA compliance before launch.
export default function PrivacyPage() {
  return (
    <div className="wrap">
      <header className="page-head">
        <p className="eyebrow">Privacy</p>
        <h1 style={{ marginTop: 10 }}>Your information</h1>
      </header>
      <div className="prose">
        <p>We collect only what we need to deliver your order and look after your account.</p>
        <h2>What we keep</h2>
        <ul>
          <li>Your name, mobile number and email address.</li>
          <li>Delivery addresses you save.</li>
          <li>Your basket and order history.</li>
        </ul>
        <h2>How we use it</h2>
        <ul>
          <li>To prepare, confirm and deliver your orders.</li>
          <li>To contact you about your order on WhatsApp.</li>
        </ul>
        <p>We don’t sell your information or share it for advertising.</p>
        <h2>On your device</h2>
        <p>
          The app saves your basket, checkout progress and recently viewed products on your device so it works
          offline. Clearing your browser data removes them; sign in again to restore your account data.
        </p>
        <h2>Your rights</h2>
        <p>
          Under the Protection of Personal Information Act (POPIA) you can ask to see, correct or delete your
          information. Contact us to do so.
        </p>
      </div>
    </div>
  );
}
