import type { UserRole } from "../types/profile";

interface Props {
  roles: UserRole[];
  busy: boolean;
  onSave: (roles: UserRole[]) => Promise<void>;
}

export function AccountTypeSelector({ roles, busy, onSave }: Props) {
  const toggle = (role: UserRole) => {
    const next = roles.includes(role) ? roles.filter((item) => item !== role) : [...roles, role];
    if (next.length > 0) void onSave(next);
  };

  return (
    <section className="profile-card account-type-card" aria-labelledby="account-type-title">
      <div>
        <h2 id="account-type-title">Account type</h2>
        <p className="profile-section-copy">Choose how you want to use the platform. You can update your account type at any time.</p>
      </div>
      <div className="role-options">
        {(["fan", "creator"] as const).map((role) => (
          <label className="role-option" key={role}>
            <input type="checkbox" checked={roles.includes(role)} disabled={busy}
              onChange={() => toggle(role)} />
            <span>
              <strong>{role === "fan" ? "Fan" : "Creator"}</strong>
              <small>{role === "fan"
                ? "Follow creators, discover content, and interact with posts."
                : "Create and publish content and build an audience."}</small>
            </span>
          </label>
        ))}
      </div>
      {roles.length === 0 && <span className="field-error">Select at least one account type.</span>}
    </section>
  );
}
