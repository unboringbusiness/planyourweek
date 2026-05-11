export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px', color: 'var(--text-1)', lineHeight: 1.8, fontSize: 14 }}>
      <a href="/" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', marginBottom: 24, display: 'inline-block' }}>&larr; Back to app</a>

      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Privacy Policy</h1>
      <p style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 32 }}>Last updated: May 11, 2026</p>

      <p>Plan Your Week ("we", "us", "our") operates planyourweek.co. This policy explains how we collect, use, store, and protect your personal information in compliance with Canada's Personal Information Protection and Electronic Documents Act (PIPEDA) and Quebec's Law 25.</p>

      <h2>1. Information We Collect</h2>
      <p><strong>Account information:</strong> When you sign in, we collect your email address and display name via Google OAuth or magic link. We do not collect or store your Google password.</p>
      <p><strong>Content you create:</strong> Tasks, milestones, weekly plans, project names, and any text you enter into the app.</p>
      <p><strong>Technical data:</strong> We may collect basic analytics such as page views, browser type, and device type. We do not use tracking cookies for advertising.</p>
      <p><strong>API keys:</strong> If you generate an API key for Claude integration, we store a one-way cryptographic hash (SHA-256) of your key. We never store your raw API key.</p>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To provide the Plan Your Week service and sync your data across devices</li>
        <li>To authenticate your identity</li>
        <li>To process your data through the Claude AI integration, only when you explicitly enable it by generating an API key</li>
        <li>To respond to support requests</li>
      </ul>
      <p>We do not use your data for advertising, profiling, or automated decision-making.</p>

      <h2>3. AI Integration and Data Processing</h2>
      <p>When you connect Plan Your Week to Claude (via MCP integration), the following data may be sent to Anthropic's Claude API:</p>
      <ul>
        <li>Task names and descriptions</li>
        <li>Milestone text</li>
        <li>Weekly plan structure</li>
      </ul>
      <p><strong>Anthropic does not use API data to train their AI models.</strong> API data is retained by Anthropic for up to 30 days for trust and safety purposes only, per their commercial API terms.</p>
      <p>This integration is entirely opt-in. If you do not generate an API key, no data is ever sent to Anthropic.</p>

      <h2>4. Cross-Border Data Transfers</h2>
      <p>Your data is stored and processed in the <strong>United States</strong> through our service providers:</p>
      <ul>
        <li><strong>Supabase</strong> (database and authentication) &mdash; US-hosted</li>
        <li><strong>Vercel</strong> (hosting and serverless functions) &mdash; US-hosted</li>
        <li><strong>Anthropic</strong> (AI processing, only if you opt in) &mdash; US-based</li>
      </ul>
      <p>By using Plan Your Week, you acknowledge that your personal information may be transferred to, stored, and processed in the United States, where data protection laws may differ from those in Canada. Your data may be subject to access by US law enforcement under applicable US legislation.</p>
      <p>We maintain contractual safeguards with our processors to ensure a comparable level of protection for your data.</p>

      <h2>5. Data Retention</h2>
      <p>We retain your data for as long as your account is active. If you delete your account, we will delete all your personal information and content within 30 days. Backups may persist for up to 90 days before being purged.</p>

      <h2>6. Your Rights</h2>
      <p>Under PIPEDA and Quebec's Law 25, you have the right to:</p>
      <ul>
        <li><strong>Access</strong> your personal information</li>
        <li><strong>Correct</strong> inaccurate information</li>
        <li><strong>Delete</strong> your account and all associated data</li>
        <li><strong>Withdraw consent</strong> at any time (by deleting your account or revoking your API key)</li>
        <li><strong>Data portability</strong> &mdash; request your data in a machine-readable format</li>
      </ul>
      <p>To exercise any of these rights, contact us at <strong>privacy@ultrafocus.co</strong>.</p>

      <h2>7. Security</h2>
      <p>We protect your data using:</p>
      <ul>
        <li>Encryption in transit (HTTPS/TLS) and at rest</li>
        <li>Row-level security in our database (each user can only access their own data)</li>
        <li>API keys stored as cryptographic hashes, never in plain text</li>
        <li>OAuth 2.0 for authentication (we never handle your Google password)</li>
      </ul>

      <h2>8. Data Breach Notification</h2>
      <p>In the event of a data breach that poses a real risk of significant harm, we will notify the Office of the Privacy Commissioner of Canada and affected individuals as required by PIPEDA, and the Commission d'acces a l'information du Quebec as required by Law 25.</p>

      <h2>9. Children</h2>
      <p>Plan Your Week is not intended for users under 16 years of age. We do not knowingly collect personal information from children under 16.</p>

      <h2>10. Third-Party Links</h2>
      <p>Our service may contain links to external sites. We are not responsible for the privacy practices of third-party websites.</p>

      <h2>11. Changes to This Policy</h2>
      <p>We may update this privacy policy from time to time. We will notify users of material changes by posting a notice in the app. Continued use of the service after changes constitutes acceptance of the updated policy.</p>

      <h2>12. Contact</h2>
      <p>Privacy Officer: Preet Sagar<br />
      Email: <strong>privacy@ultrafocus.co</strong><br />
      Organization: UltraFocus<br />
      Location: Toronto, Ontario, Canada</p>

      <div style={{ borderTop: '1px solid var(--border)', marginTop: 40, paddingTop: 20, fontSize: 12, color: 'var(--text-2)' }}>
        Built by UltraFocus. This document is not legal advice. Consult a licensed attorney for legal guidance specific to your situation.
      </div>
    </div>
  )
}
