export const metadata = { title: "Terms" };

// Plain-language terms. Have them reviewed before launch.
export default function TermsPage() {
  return (
    <div className="wrap">
      <header className="page-head">
        <p className="eyebrow">Terms</p>
        <h1 style={{ marginTop: 10 }}>Terms of sale</h1>
      </header>
      <div className="prose">
        <h2>Orders</h2>
        <p>
          Placing an order sends us your request on WhatsApp. Your order is confirmed only when we reply to confirm
          it. Until then, items, prices and your delivery date are not guaranteed.
        </p>
        <h2>Prices</h2>
        <p>Prices are in South African rand and are checked again when you place your order.</p>
        <h2>Delivery</h2>
        <p>We deliver on Mondays within Cape Town only. Someone should be available to receive the order.</p>
        <h2>Payment</h2>
        <p>We agree payment with you on WhatsApp when we confirm your order.</p>
        <h2>Changes and cancellations</h2>
        <p>Message us on WhatsApp as soon as possible if you need to change or cancel an order.</p>
      </div>
    </div>
  );
}
