import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Terms of Service · Gather" };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 text-[15px] leading-relaxed">
      <Link href="/login" className="muted text-sm hover:underline">‹ Gather</Link>
      <h1 className="mb-1 mt-4 text-3xl font-semibold">Terms of Service</h1>
      <p className="muted mb-8 text-sm">Last updated: November 17, 2026</p>

      <div className="space-y-6">
        <section>
          <h2 className="mb-2 text-lg font-semibold">1. Agreement</h2>
          <p>These terms cover your use of Gather, which includes the Gather Chrome extension and the web app at gatherme.vercel.app. By installing the extension or signing in, you agree to these terms. If you do not agree, please do not use Gather.</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">2. Your account</h2>
          <p>You sign in with your Google account. You are responsible for activity on your account and for keeping access to your Google account secure. You must be old enough to use Google services in your country.</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">3. Your content</h2>
          <p>The highlights and notes you save belong to you. You give us permission to store, process and display them only so we can provide Gather to you: saving them, showing them in your library and on the pages where you made them, and searching them. We do not claim ownership of your content and do not use it for any other purpose.</p>
          <p className="mt-2">Text you highlight comes from other websites and may be protected by copyright. Gather is for personal reference. You are responsible for how you use and share what you save.</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">4. Acceptable use</h2>
          <p>Please do not:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>use Gather for anything illegal, or to store content you have no right to keep;</li>
            <li>try to access other people&apos;s accounts or data, or get around Gather&apos;s security;</li>
            <li>overload, disrupt, scrape or reverse-engineer the service, or use it to build automated bulk tools;</li>
            <li>resell or redistribute Gather without permission.</li>
          </ul>
          <p className="mt-2">We may suspend accounts that break these rules.</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">5. Privacy</h2>
          <p>How we handle your data is explained in our <Link href="/privacy" className="underline">Privacy Policy</Link>.</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">6. The service</h2>
          <p>Gather is currently free. We work to keep it running and your data safe, but it is provided &ldquo;as is&rdquo;, without guarantees that it will always be available, error-free, or that a saved highlight can always be found again on a page that has changed. Please keep your own copy of anything important; you can export everything as Markdown at any time.</p>
          <p className="mt-2">We may change, pause or discontinue features. If we decide to shut Gather down, we will give reasonable notice so you can export your data.</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">7. Limitation of liability</h2>
          <p>To the extent the law allows, Gather and its maker are not liable for indirect or consequential losses, or for loss of data, arising from your use of the service. Nothing in these terms limits rights you have under consumer law that cannot be excluded.</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">8. Ending your use</h2>
          <p>You can stop using Gather at any time by uninstalling the extension. To delete your account and data, email us at the address below. We may end access for accounts that seriously or repeatedly break these terms.</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">9. Changes to these terms</h2>
          <p>We may update these terms as Gather evolves. We will change the date at the top when we do, and for significant changes we will let you know in the app. Continuing to use Gather after a change means you accept the updated terms.</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">10. Contact</h2>
          <p>Questions about these terms: email <a className="underline" href="mailto:shubhradia33@gmail.com">shubhradia33@gmail.com</a>.</p>
        </section>
      </div>
    </main>
  );
}
