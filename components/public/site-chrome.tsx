import Image from "next/image";
import Link from "next/link";
export function SiteHeader() {
    return <header className="site-header">
    <div className="site-container header-inner">
      <Link href="/" className="wordmark" aria-label="MarketGB home"><Image className="brand-logo" src="/brand/marketgb/marketgb-logo-primary-v1.png" alt="MarketGB" width={1200} height={249} priority /></Link>
      <nav className="public-nav" aria-label="Main navigation">
        <Link href="/#brokers">Broker reviews</Link><Link href="/#education">Learn forex</Link><Link href="/#guides">Trading guides</Link>
      </nav>
      <Link className="button button-dark header-cta" href="/global/best-brokers/best-forex-brokers-for-beginners/">Explore brokers <span aria-hidden="true">↗</span></Link>
    </div>
  </header>;
}
export function SiteFooter() {
    return <footer className="site-footer"><div className="site-container">
    <div className="footer-top"><Link className="wordmark" href="/" aria-label="MarketGB home"><Image className="brand-logo" src="/brand/marketgb/marketgb-logo-primary-v1.png" alt="MarketGB" width={1200} height={249} /></Link><p>Insights for a brighter tomorrow.</p><nav aria-label="Footer navigation"><Link href="/#education">Education</Link><Link href="/#guides">Guides</Link><Link href="/#brokers">Brokers</Link></nav></div>
    <div className="footer-bottom"><p>Forex trading involves risk. Our content is for education, not personal investment advice.</p><p>Some links are affiliate links. We may earn a commission when you use them.</p></div>
  </div></footer>;
}
