export const metadata = {
  title: "Cancellation & Refund Policy | CourtBooker",
  description: "Cancellation and Refund Policy for CourtBooker platform",
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            🔁 Cancellation & Refund Policy
          </h1>
          <div className="text-sm text-slate-600 mb-8">
            <p className="font-semibold">Platform: CourtBooker</p>
            <p>Last Updated: January 9, 2026</p>
          </div>

          <div className="prose prose-slate max-w-none">
            <div className="bg-amber-50 border-l-4 border-amber-500 p-6 mb-8 rounded-r-lg">
              <h2 className="text-xl font-bold text-amber-900 mb-3">
                ⚠️ Important Notice
              </h2>
              <ul className="space-y-2 text-amber-900">
                <li>CourtBooker acts only as a booking facilitator.</li>
                <li>
                  All cancellation and refund matters are handled directly by
                  the respective sports institution.
                </li>
              </ul>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                💡 Payment Advisory
              </h2>
              <p className="text-slate-700 mb-3">
                CourtBooker recommends paying directly at the sports institution
                after personally visiting the venue.
              </p>
              <p className="text-slate-700 font-semibold mb-2">
                If a user chooses to make an online payment:
              </p>
              <ul className="space-y-2 text-slate-700">
                <li>It is made voluntarily</li>
                <li>Refunds are not guaranteed</li>
                <li>All refund decisions are made solely by the institution</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                1. Cancellations
              </h2>
              <ul className="space-y-2 text-slate-700">
                <li>Cancellation policies vary by institution</li>
                <li>
                  Users must review the institution's cancellation policy before
                  booking
                </li>
                <li>
                  All cancellation requests must be made directly to the
                  institution
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                2. Refunds
              </h2>
              <ul className="space-y-2 text-slate-700">
                <li>
                  Refund eligibility, amount, and processing time are decided by
                  the institution
                </li>
                <li>
                  CourtBooker does not issue refunds under any circumstances
                </li>
                <li>
                  Approved refunds, if any, are processed by the institution via
                  the original payment method
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                3. Platform Responsibility
              </h2>
              <p className="text-slate-700 mb-2">
                CourtBooker is not responsible for:
              </p>
              <ul className="space-y-2 text-slate-700">
                <li>Rejected or delayed refunds</li>
                <li>Partial or full refund decisions</li>
                <li>Payment disputes between users and institutions</li>
              </ul>
            </section>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mt-8 rounded-r-lg">
              <p className="text-blue-900 font-medium">
                By completing a booking or payment, users acknowledge and accept
                this policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
