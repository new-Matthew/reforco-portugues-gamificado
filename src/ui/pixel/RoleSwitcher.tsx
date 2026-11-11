export type AppRole = "student" | "teacher";

interface RoleSwitcherProps {
  readonly role: AppRole;
  readonly onChange: (role: AppRole) => void;
}

const ROLES: readonly { value: AppRole; label: string }[] = [
  { value: "student", label: "Aluno" },
  { value: "teacher", label: "Professor" },
];

export function RoleSwitcher({ role, onChange }: RoleSwitcherProps) {
  return (
    <div className="role-switcher" role="group" aria-label="Alternar perfil de uso">
      {ROLES.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={role === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
