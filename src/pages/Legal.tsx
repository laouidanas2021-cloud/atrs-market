import { Link, useLocation } from 'react-router-dom'
const NAME = "ATR"
const EM = import.meta.env.VITE_CONTACT_EMAIL || 'support@example.com'
type P = { title: string; intro: string; s: [string, string][] }
const PAGES: Record<string, P> = {
  about: { title: `About ${NAME}`, intro: `${NAME} is an online marketplace for software, applications, utilities, games, templates and other digital files.`, s: [
    ['What we do', 'We publish and sell digital products directly. Every product page shows what you get, the version, file size, system requirements and changelog before you download or buy.'],
    ['How delivery works', 'Free products download instantly. Paid products are unlocked on your account as soon as your payment is confirmed, and stay in your personal library so you can download them again.'],
    ['Security', 'Product files are stored privately and are only released to accounts that are allowed to download them, using short-lived download links.'],
    ['Contact', `Questions? Email us at ${EM}.`]] },
  contact: { title: 'Contact us', intro: 'We usually reply within one to two business days.', s: [
    ['Support', `For help with downloads, your account or an order, email ${EM}. Please include the email you used on ${NAME} and your order details.`],
    ['Refund requests', 'See our Refund Policy for how to request a refund.'],
    ['Business and legal', `For legal or copyright notices, email ${EM} with the subject line “Legal”.`]] },
  terms: { title: 'Terms of Service', intro: `Last updated: November 21, 2026. By using ${NAME} you agree to these terms.`, s: [
    ['1. Accounts', 'You must provide accurate information and keep your login details secure. You are responsible for activity on your account.'],
    ['2. Products and licence', 'When you download a free product or buy a paid one, you receive a personal, non-exclusive, non-transferable licence to use it, unless the product page states otherwise. You may not resell, redistribute, share or sublicense products or access to them.'],
    ['3. Payments', 'Prices are shown on each product page. Payments are processed securely by our payment provider, which acts as the seller of record and may collect applicable taxes. Access to a paid product is granted after the payment is confirmed.'],
    ['4. Downloads', 'Downloads are delivered through temporary links. Do not attempt to bypass access controls or share download links.'],
    ['5. Acceptable use', 'You agree not to misuse the service, attempt unauthorised access, upload malicious content, or use the products to break the law or infringe others’ rights.'],
    ['6. Intellectual property', `All content on ${NAME}, including products, text, logos and design, is protected by intellectual property laws and remains the property of its owners.`],
    ['7. Disclaimer', 'Products are provided “as is”. We do not guarantee they will be error-free or fit every purpose. Check system requirements before purchasing.'],
    ['8. Limitation of liability', 'To the extent permitted by law, our liability is limited to the amount you paid for the product concerned.'],
    ['9. Suspension', 'We may suspend or close accounts that breach these terms.'],
    ['10. Changes', 'We may update these terms. Continued use after changes means you accept them.'],
    ['11. Contact', `Questions about these terms: ${EM}.`]] },
  privacy: { title: 'Privacy Policy', intro: `Last updated: November 21, 2026. This policy explains what data ${NAME} collects and how it is used.`, s: [
    ['Data we collect', 'Account data (name, email), order and download history, and basic technical data needed to run the site securely.'],
    ['How we use it', 'To create and manage your account, deliver products, process orders, provide support, prevent fraud and abuse, and keep the service secure.'],
    ['Payments', 'Card and payment details are handled by our payment provider and are never stored on our servers. We receive confirmation of the order and basic customer details.'],
    ['Service providers', 'We use trusted providers for hosting, database and authentication, file storage and payment processing. They process data only to provide their services to us.'],
    ['Cookies and local storage', 'We use essential storage to keep you signed in. We do not use advertising trackers.'],
    ['Retention', 'We keep account and order records as long as needed to provide the service and meet legal and accounting obligations.'],
    ['Your rights', `You can request access, correction or deletion of your personal data by emailing ${EM}.`],
    ['Contact', `Privacy questions: ${EM}.`]] },
  refund: { title: 'Refund Policy', intro: `Last updated: November 21, 2026. We want you to be happy with what you buy on ${NAME}.`, s: [
    ['Free products', 'Free products are not charged, so refunds do not apply.'],
    ['Paid products', 'You can request a refund within 14 days of purchase if the product does not work as described, has a technical problem we cannot resolve, or you were charged in error.'],
    ['How to request', `Email ${EM} from the address on your account with your order details and the reason. We may ask for more information.`],
    ['Processing', 'Approved refunds are returned to your original payment method by our payment provider. Timing depends on your bank or card issuer.'],
    ['After a refund', 'Access to the refunded product is removed from your library.'],
    ['Exceptions', 'Refunds may be refused in cases of abuse, repeated refund requests or a breach of our Terms of Service.']] },
}
export default function Legal() {
  const key = useLocation().pathname.replace('/', ''); const p = PAGES[key]
  if (!p) return <p className="py-20 text-center text-mute">Page not found.</p>
  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight">{p.title}</h1><p className="mt-3 text-mute">{p.intro}</p>
      <div className="mt-8 space-y-6">{p.s.map(([h, t]) => <section key={h}><h2 className="mb-1.5 font-medium">{h}</h2><p className="text-sm leading-relaxed text-mute">{t}</p></section>)}</div>
      {key === 'contact' && <a href={`mailto:${EM}`} className="btn mt-8">Email support</a>}
      <div className="mt-12 flex flex-wrap gap-4 border-t border-line pt-6 text-sm text-mute">{['terms', 'privacy', 'refund', 'about', 'contact'].filter(k => k !== key).map(k => <Link key={k} to={`/${k}`} className="hover:text-ink">{PAGES[k].title}</Link>)}</div>
    </article>)
}
