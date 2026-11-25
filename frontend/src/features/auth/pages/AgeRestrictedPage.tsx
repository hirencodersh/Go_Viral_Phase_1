export function AgeRestrictedPage() {
  return (
    <main className="age-restricted-page">
      <header className="dashboard-header age-restricted-header">
        <div className="brand">
          <span className="brand-symbol">s</span>
          <span>socially</span>
        </div>
      </header>
      <div className="age-restricted-content">
        <section className="age-restricted-card" aria-labelledby="age-restricted-title">
          <span className="age-restricted-icon" aria-hidden="true">18+</span>
          <span className="eyebrow">Age requirement</span>
          <h1 id="age-restricted-title">Access is not available</h1>
          <p>
            Socially is available only to people who are 18 or older. You can’t
            create an account or use platform features until you meet this age
            requirement.
          </p>
        </section>
      </div>
    </main>
  );
}
