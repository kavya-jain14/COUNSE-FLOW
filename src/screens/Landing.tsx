import { useAppActions } from '../state/store'

const PREP_ITEMS: Array<{ title: string; note: string }> = [
  { title: 'Your correct rank', note: 'Use the rank shown for the counselling you are filling.' },
  { title: 'Reservation details', note: 'Keep your category, region and eligible quotas ready.' },
  { title: 'Practical limits', note: 'Know your yearly budget, travel range and branch order.' },
]

const SAMPLE_OPTIONS = [
  ['01', 'HBTU Kanpur', 'CSE', '₹1,42,000', '75 km', 'Dream'],
  ['02', 'BIET Jhansi', 'CSE', '₹1,24,000', '284 km', 'Target'],
  ['03', 'IET Lucknow', 'IT', '₹1,38,000', '0 km', 'Target'],
  ['04', 'REC Banda', 'CSE', 'Not recorded', '164 km', 'No data'],
  ['05', 'HBTU Kanpur', 'EE', '₹1,18,000', '75 km', 'Safe'],
  ['06', 'UIET Kanpur', 'EE', '₹1,20,000', '75 km', 'Safe'],
  ['07', 'MMMUT Gorakhpur', 'ECE', '₹1,28,000', '241 km', 'Target'],
] as const

export function Landing() {
  const { goTo, loadDemoProfile } = useAppActions()

  return (
    <div className="landing-document">
      <section className="hero">
        <div className="hero__text">
          <span className="eyebrow">UPTAC · JoSAA · IPU preference strategy</span>
          <p className="hero__folio mono">PLAN ONCE · REVIEW CLEARLY · FILL WITH CONFIDENCE</p>
          <h1>Build the order you will actually fill.</h1>
          <p className="hero__lede">
            Enter your rank, priorities and real-world limits. CounselFlow turns them into an
            ordered college list, shows why each option is placed there, and brings every risky
            tradeoff to you before the list is saved.
          </p>
          <div className="hero__actions">
            <button className="btn btn--primary btn--lg" onClick={() => goTo('profile')}>
              Start my strategy
            </button>
            <button
              className="btn btn--lg"
              onClick={() => {
                loadDemoProfile()
                goTo('profile')
              }}
            >
              Try a sample profile
            </button>
          </div>

          <dl className="hero__facts">
            <div>
              <dt>Rank</dt>
              <dd className="mono">12,500 CRL</dd>
            </div>
            <div>
              <dt>Branch order</dt>
              <dd className="mono">CSE / IT / ECE</dd>
            </div>
            <div>
              <dt>Hard ceiling</dt>
              <dd className="mono">₹1,50,000 yearly</dd>
            </div>
            <div>
              <dt>Distance</dt>
              <dd className="mono">300 km from Lucknow</dd>
            </div>
          </dl>
        </div>

        <aside className="hero__aside" aria-label="What to keep ready">
          <div className="index-heading">
            <span>Before you begin</span>
            <span className="mono">03 essentials</span>
          </div>
          <ol className="steps">
            {PREP_ITEMS.map((item, index) => (
              <li key={item.title}>
                <span className="steps__number mono">{String(index + 1).padStart(2, '0')}</span>
                <span>
                  <b>{item.title}</b>
                  <small>{item.note}</small>
                </span>
              </li>
            ))}
          </ol>
          <p className="marginal-note">
            You stay in control. A hard limit never gets relaxed silently, and every warning asks
            for your decision before the list can be saved.
          </p>
        </aside>
      </section>

      <section className="sample-dossier" aria-labelledby="sample-title">
        <header className="sample-dossier__head">
          <div>
            <span className="section-label">Live product specimen · UPTAC</span>
            <h2 id="sample-title">Seven-option preference register</h2>
          </div>
          <p>
            UPTAC sample profile: General category, UP domicile and placements weighted highest.
            Open it to see how the complete planning journey works.
          </p>
        </header>

        <div className="sample-dossier__body">
          <div className="table-scroll">
            <table className="preview-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Institute</th>
                  <th>Branch</th>
                  <th>Annual fee</th>
                  <th>Distance</th>
                  <th>Band</th>
                </tr>
              </thead>
              <tbody>
                {SAMPLE_OPTIONS.map((option) => (
                  <tr key={`${option[0]}-${option[1]}`}>
                    {option.map((value, index) => (
                      <td key={value} className={index === 0 || index > 2 ? 'mono' : undefined}>
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <aside className="audit-margin" aria-label="Sample warning notes">
            <span className="section-label">What needs attention</span>
            <article>
              <span className="audit-margin__code mono">CF-01 / WARNING</span>
              <h3>Branch priority conflict</h3>
              <p>IET IT appears above REC CSE, while the candidate declared CSE above IT.</p>
            </article>
            <article>
              <span className="audit-margin__code mono">CF-08 / WARNING</span>
              <h3>Evidence gap</h3>
              <p>Annual fee, closing rank and placement evidence are missing for REC Banda.</p>
            </article>
            <button
              className="text-link"
              type="button"
              onClick={() => {
                loadDemoProfile()
                goTo('profile')
              }}
            >
              Explore this sample strategy
            </button>
          </aside>
        </div>
      </section>

      <section className="method-sheet" aria-labelledby="method-title">
        <header>
          <span className="section-label">How your choices behave</span>
          <h2 id="method-title">Know what can remove an option</h2>
        </header>
        <div className="method-sheet__rows">
          <article>
            <span className="mono">A</span>
            <h3>Hard limits</h3>
            <p>Budget, distance, and exclusions can remove an option and prevent locking.</p>
          </article>
          <article>
            <span className="mono">B</span>
            <h3>Soft preferences</h3>
            <p>Placements, fees, distance, campus and hostel alter ranking weight only.</p>
          </article>
          <article>
            <span className="mono">C</span>
            <h3>Your final call</h3>
            <p>Every proposed swap is visible. A kept warning requires a written reason.</p>
          </article>
        </div>
      </section>

      <footer className="document-foot">
        <span>Always verify final closing ranks, fees and notices on the selected counselling authority&apos;s website.</span>
        <span className="document-foot__links">
          <a href="/privacy.html">Privacy</a>
          <a href="/terms.html">Terms of use</a>
        </span>
        <span className="mono">CF-MVP / 2026</span>
      </footer>
    </div>
  )
}
