export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">Phishing Awareness Training</h1>
      <p className="text-lg mb-6">
        Security awareness and phishing simulation platform for Kenyan organizations.
      </p>
      <div className="space-y-4">
        <p>This platform helps organizations train their staff to recognize and avoid phishing attacks.</p>
        <ul className="list-disc list-inside space-y-2">
          <li>Simulated phishing campaigns tailored to Kenyan contexts (M-Pesa, SIM-swap, etc.)</li>
          <li>Track click rates and employee awareness over time</li>
          <li>Micro-learning modules in English and Swahili</li>
          <li>Dashboard for monitoring security posture</li>
        </ul>
      </div>
    </main>
  );
}
