/**
 * App — the TraceLens dashboard shell.
 *
 * OWNER: Member 4 (Frontend & OSS / Release Engineering)
 *
 * TODO (issue + PR per item):
 *  - [ ] Incident list view (GET /incidents).
 *  - [ ] Incident detail: timeline, evidence explorer, "What changed?" panel.
 *  - [ ] Dependency graph visualization (React Flow or Cytoscape).
 *  - [ ] API client against @tracelens/shared API_ROUTES + auth/login.
 *
 * This placeholder confirms the toolchain is wired end to end.
 */
export function App() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', maxWidth: 720 }}>
      <h1>TraceLens</h1>
      <p>
        <em>From Alert to Root Cause.</em>
      </p>
      <p>
        Dashboard scaffold is live. Build the incident list, incident detail
        (timeline + evidence + &ldquo;what changed&rdquo;), and the dependency graph here.
      </p>
    </main>
  );
}
