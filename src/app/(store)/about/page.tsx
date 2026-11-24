import Link from "next/link";

export const metadata = { title: "Our Story" };

export default function AboutPage() {
  return (
    <div className="wrap">
      <header className="page-head">
        <p className="eyebrow">Our story</p>
        <h1 style={{ marginTop: 10, maxWidth: 760 }}>A little of home, in Cape Town.</h1>
      </header>
      <div className="prose">
        <p>
          Mama Ejima is a Zimbabwean store for Zimbabweans and friends of Zimbabwe living in Cape Town. We bring
          together the ingredients and everyday things that make a kitchen feel like home.
        </p>
        <p>
          Every order is packed by hand and delivered across Cape Town on Mondays. We confirm each one with you
          personally on WhatsApp.
        </p>
        <p style={{ marginTop: 32 }}>
          <Link href="/shop/" className="btn">Visit the shop</Link>
        </p>
      </div>
    </div>
  );
}
