import Link from "next/link";
import { getCatalog } from "@/server/catalog";
import { ProductCard } from "@/components/ProductCard";
import { InstallStrip } from "@/components/InstallStrip";
import { formatZAR } from "@/lib/money";
import { availableMondays, describeCutoff, formatDeliveryDate } from "@/lib/delivery";
import { whatsappChatLink } from "@/lib/whatsapp";

export default async function HomePage() {
  const { products, categories, settings } = await getCatalog();
  const catById = new Map(categories.map((c) => [c.id, c]));
  const visible = products.filter((p) => p.available);
  const featured = visible.filter((p) => p.featured).slice(0, 4);
  const popular = visible.filter((p) => p.popular).slice(0, 6);
  const nextMonday = availableMondays(settings.delivery)[0];
  const d = settings.delivery;
  const wa = whatsappChatLink(settings.whatsappNumber, "Hi Mama Ejima, I have a question.");

  return (
    <>
      <InstallStrip />

      <section className="hero">
        <div className="hero-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={settings.heroImage || "/placeholders/hero.svg"} alt="" fetchPriority="high" />
        </div>
        <div className="hero-copy fade-in">
          <p className="eyebrow">Zimbabwean groceries · Cape Town</p>
          <h1 className="display">The taste of home, closer to you.</h1>
          <p className="lede">
            Discover Zimbabwean favourites, traditional ingredients and everyday essentials, carefully selected
            for your home.
          </p>
          <div>
            <Link href="/shop" className="btn">
              Shop now
            </Link>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="section">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="eyebrow">Featured</p>
                <h2 style={{ marginTop: 8 }}>This week’s picks</h2>
              </div>
              <Link href="/shop">View all</Link>
            </div>
            <div className="rail">
              {featured.map((p, i) => (
                <ProductCard key={p.id} product={p} category={catById.get(p.categoryId)} priority={i < 2} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="section-head">
            <div>
              <p className="eyebrow">Shop by category</p>
              <h2 style={{ marginTop: 8 }}>Find your way around</h2>
            </div>
          </div>
          <div className="cat-list">
            {categories.map((c, i) => (
              <Link key={c.id} href={`/shop/${c.slug}`} className="cat-row">
                <span className="row" style={{ alignItems: "baseline", gap: 8 }}>
                  <span className="idx">{String(i + 1).padStart(2, "0")}</span>
                  <span className="serif">{c.name}</span>
                </span>
                <span className="arrow" aria-hidden>
                  →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {popular.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="eyebrow">Popular</p>
                <h2 style={{ marginTop: 8 }}>Favourites</h2>
              </div>
              <Link href="/shop">Shop all</Link>
            </div>
            <div className="grid">
              {popular.map((p) => (
                <ProductCard key={p.id} product={p} category={catById.get(p.categoryId)} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section" style={{ borderTop: "1px solid var(--line)" }}>
        <div className="wrap narrow" style={{ textAlign: "center" }}>
          <p className="eyebrow">Mama Ejima</p>
          <p className="serif" style={{ fontSize: "clamp(28px, 4.4vw, 44px)", lineHeight: 1.2, marginTop: 20 }}>
            The flavours we grew up with, found in Cape Town. Packed with care and brought to your door.
          </p>
          <p style={{ marginTop: 28 }}>
            <Link href="/about" className="link">
              Our story
            </Link>
          </p>
        </div>
      </section>

      <section className="band section">
        <div className="wrap band-grid">
          <div className="stack" style={{ ["--s" as string]: "18px" }}>
            <p className="eyebrow">Delivery</p>
            <h2>Every Monday, across Cape Town.</h2>
            <p style={{ color: "rgba(246,241,232,0.75)", maxWidth: 420 }}>
              Choose your Monday at checkout. We confirm every order with you on WhatsApp.
            </p>
            <div>
              <Link href="/delivery" className="btn btn-light">
                Delivery details
              </Link>
            </div>
          </div>
          <div className="facts">
            <div>
              <span>Next delivery</span>
              <span>{nextMonday ? formatDeliveryDate(nextMonday) : "To be announced"}</span>
            </div>
            <div>
              <span>Order by</span>
              <span>{describeCutoff(d.cutoffHours)}</span>
            </div>
            <div>
              <span>Delivery fee</span>
              <span>
                {d.feeCents === 0 ? "Free" : formatZAR(d.feeCents)}
                {d.freeOverCents != null && d.feeCents > 0 ? ` · free over ${formatZAR(d.freeOverCents)}` : ""}
              </span>
            </div>
            <div>
              <span>Area</span>
              <span>
                {d.city}, {d.province}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap row wrap-flex between" style={{ gap: 24, alignItems: "end" }}>
          <div>
            <p className="eyebrow">Questions?</p>
            <h2 style={{ marginTop: 8 }}>Talk to us on WhatsApp.</h2>
          </div>
          {wa ? (
            <a href={wa} className="btn btn-outline" target="_blank" rel="noopener noreferrer">
              Message us
            </a>
          ) : (
            <Link href="/contact" className="btn btn-outline">
              Contact
            </Link>
          )}
        </div>
      </section>
    </>
  );
}
