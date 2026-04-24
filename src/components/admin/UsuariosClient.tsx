"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaPlus,
  FaSearch,
  FaTrash,
  FaEdit,
  FaTimes,
  FaEye,
  FaEyeSlash,
  FaCopy,
  FaCheck,
  FaKey,
} from "react-icons/fa";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/auth/roles";

interface UserListItem {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: Role;
  disabled: boolean;
  createdAt: string | null;
  lastSignInAt: string | null;
}

const inputClass =
  "bg-input-bg border border-border-default rounded-xl text-sm text-text-main placeholder:text-text-main/35 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200";

const ROLE_BADGE: Record<Role, string> = {
  admin: "bg-primary/15 text-primary",
  staff: "bg-info/15 text-info",
  cursos: "bg-warning/15 text-warning",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function UsuariosClient({ currentUid }: { currentUid: string }) {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserListItem | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserListItem | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/usuarios");
      if (!res.ok) {
        setError("No se pudo cargar la lista");
        return;
      }
      const data = (await res.json()) as { users: UserListItem[] };
      setUsers(data.users ?? []);
    } catch {
      setError("Error de conexion");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.email?.toLowerCase().includes(q) ||
        u.displayName?.toLowerCase().includes(q) ||
        u.role.includes(q),
    );
  }, [users, search]);

  return (
    <div>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-warm-950/40 to-background" />
        <div className="relative px-5 lg:px-8 pt-6 pb-4 md:pt-8 md:pb-6">
          <span className="inline-block text-[11px] font-medium tracking-[0.15em] uppercase text-primary/70 mb-1">
            Gestion
          </span>
          <h1 className="text-2xl font-semibold text-text-main">Usuarios</h1>
          <p className="text-sm text-text-main/50 mt-1">
            Miembros del equipo con acceso al panel.
          </p>
        </div>
      </div>

      <div className="h-px bg-linear-to-r from-transparent via-border-default to-transparent" />

      <div className="px-5 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-main/30" />
            <input
              type="text"
              placeholder="Buscar por email, nombre o rol…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${inputClass} w-full pl-9 pr-3 py-2.5`}
            />
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <FaPlus className="w-3.5 h-3.5" />
            Nuevo usuario
          </button>
        </div>

        {error && (
          <div className="bg-error/10 text-error p-3 rounded-lg text-sm mb-4">{error}</div>
        )}

        <div className="bg-surface-card border border-border-subtle rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="simple-spinner mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-text-main/50">
              {search ? "Sin resultados." : "Todavia no hay usuarios."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle bg-surface-elevated">
                    <th className="text-left p-4 font-medium text-text-main/50">Usuario</th>
                    <th className="text-left p-4 font-medium text-text-main/50">Rol</th>
                    <th className="text-left p-4 font-medium text-text-main/50">Creado</th>
                    <th className="text-left p-4 font-medium text-text-main/50">Ultimo login</th>
                    <th className="text-right p-4 font-medium text-text-main/50">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => {
                    const isSelf = u.uid === currentUid;
                    return (
                      <tr
                        key={u.uid}
                        className="border-b border-border-subtle hover:bg-surface-elevated transition-colors last:border-b-0"
                      >
                        <td className="p-4">
                          <div className="font-medium text-text-main">
                            {u.displayName || "(sin nombre)"}
                            {isSelf && (
                              <span className="ml-2 text-[10px] text-primary/70 font-mono">(vos)</span>
                            )}
                          </div>
                          <div className="text-xs text-text-main/50">{u.email ?? "—"}</div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_BADGE[u.role]}`}
                          >
                            {ROLE_LABELS[u.role]}
                          </span>
                        </td>
                        <td className="p-4 text-text-main/60 text-xs whitespace-nowrap">
                          {formatDate(u.createdAt)}
                        </td>
                        <td className="p-4 text-text-main/60 text-xs whitespace-nowrap">
                          {formatDate(u.lastSignInAt)}
                        </td>
                        <td className="p-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => setEditUser(u)}
                              disabled={isSelf}
                              className="inline-flex items-center gap-1.5 border border-border-default text-text-main/60 hover:text-text-main hover:bg-surface-elevated text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              title={isSelf ? "No puedes modificarte a vos mismo" : "Editar"}
                            >
                              <FaEdit className="w-3 h-3" />
                              Editar
                            </button>
                            <button
                              onClick={() => setDeleteUser(u)}
                              disabled={isSelf}
                              className="inline-flex items-center gap-1.5 border border-error/30 text-error hover:bg-error/10 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              title={isSelf ? "No puedes eliminarte a vos mismo" : "Eliminar"}
                            >
                              <FaTrash className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {createOpen && (
        <CreateUserModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            fetchUsers();
          }}
        />
      )}

      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={() => {
            setEditUser(null);
            fetchUsers();
          }}
        />
      )}

      {deleteUser && (
        <DeleteUserModal
          user={deleteUser}
          onClose={() => setDeleteUser(null)}
          onDeleted={() => {
            setDeleteUser(null);
            fetchUsers();
          }}
        />
      )}
    </div>
  );
}

function CreateUserModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(true);
  const [role, setRole] = useState<Role>("staff");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length >= 8 && !submitting;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        `Email: ${email}\nContrasena: ${password}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const handleSubmit = async () => {
    setError(null);
    if (password.length < 8) {
      setError("La contrasena debe tener al menos 8 caracteres");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          displayName: displayName.trim() || undefined,
          role,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error creando usuario");
        return;
      }
      onCreated();
    } catch {
      setError("Error de conexion");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title="Nuevo usuario" onClose={onClose} disabled={submitting}>
      <div className="space-y-4">
        <Field label="Email" required>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            autoFocus
            className={`${inputClass} w-full px-3 py-2.5`}
            placeholder="usuario@ejemplo.com"
          />
        </Field>

        <Field label="Nombre (opcional)">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={submitting}
            className={`${inputClass} w-full px-3 py-2.5`}
            placeholder="Maria Gonzalez"
          />
        </Field>

        <Field label="Contrasena" required hint="Minimo 8 caracteres. Dictala al usuario.">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              className={`${inputClass} w-full px-3 py-2.5 pr-20 font-mono`}
              placeholder="Ej: pau2026-flor"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="w-7 h-7 flex items-center justify-center text-text-main/40 hover:text-text-main hover:bg-surface-elevated rounded transition-colors"
                aria-label={showPassword ? "Ocultar" : "Mostrar"}
                tabIndex={-1}
              >
                {showPassword ? <FaEyeSlash className="w-3.5 h-3.5" /> : <FaEye className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!email || !password}
                className="w-7 h-7 flex items-center justify-center text-text-main/40 hover:text-text-main hover:bg-surface-elevated rounded transition-colors disabled:opacity-30"
                aria-label="Copiar"
                tabIndex={-1}
              >
                {copied ? <FaCheck className="w-3.5 h-3.5 text-success" /> : <FaCopy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </Field>

        <Field label="Rol" required>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            disabled={submitting}
            className={`${inputClass} w-full px-3 py-2.5`}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <RoleHelp role={role} />
        </Field>

        {error && <div className="bg-error/10 text-error p-3 rounded-lg text-sm">{error}</div>}
      </div>

      <ModalFooter>
        <button
          onClick={onClose}
          disabled={submitting}
          className="flex-1 border border-border-default text-text-main/60 hover:text-text-main hover:bg-surface-elevated font-medium py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold py-2.5 rounded-xl transition-colors cursor-pointer disabled:bg-surface-elevated disabled:text-text-main/30"
        >
          {submitting ? <div className="simple-spinner w-4! h-4! border-2! border-white! border-b-transparent!" /> : "Crear usuario"}
        </button>
      </ModalFooter>
    </ModalShell>
  );
}

function EditUserModal({
  user,
  onClose,
  onSaved,
}: {
  user: UserListItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [role, setRole] = useState<Role>(user.role);
  const [displayName, setDisplayName] = useState(user.displayName ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty =
    role !== user.role ||
    displayName !== (user.displayName ?? "") ||
    password.length > 0;

  const handleSubmit = async () => {
    setError(null);
    if (password.length > 0 && password.length < 8) {
      setError("La contrasena debe tener al menos 8 caracteres");
      return;
    }
    const payload: Record<string, string> = {};
    if (role !== user.role) payload.role = role;
    if (displayName !== (user.displayName ?? "")) {
      payload.displayName = displayName.trim();
    }
    if (password.length > 0) payload.password = password;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/usuarios/${user.uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error actualizando usuario");
        return;
      }
      onSaved();
    } catch {
      setError("Error de conexion");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title={`Editar ${user.email ?? user.uid}`} onClose={onClose} disabled={submitting}>
      <div className="space-y-4">
        <Field label="Nombre">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={submitting}
            className={`${inputClass} w-full px-3 py-2.5`}
            placeholder="(sin nombre)"
          />
        </Field>

        <Field label="Rol" required>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            disabled={submitting}
            className={`${inputClass} w-full px-3 py-2.5`}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <RoleHelp role={role} />
        </Field>

        <Field
          label="Nueva contrasena"
          hint="Dejar vacio para no cambiar. Minimo 8 caracteres si se especifica."
        >
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              className={`${inputClass} w-full px-3 py-2.5 pr-12 font-mono`}
              placeholder="(sin cambios)"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-text-main/40 hover:text-text-main hover:bg-surface-elevated rounded transition-colors"
              aria-label={showPassword ? "Ocultar" : "Mostrar"}
              tabIndex={-1}
            >
              {showPassword ? <FaEyeSlash className="w-3.5 h-3.5" /> : <FaEye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </Field>

        <div className="text-[11px] text-text-main/40 bg-surface-elevated/60 border border-border-subtle rounded-lg p-3 flex gap-2">
          <FaKey className="w-3 h-3 mt-0.5 shrink-0 text-warning" />
          <span>
            Al cambiar el rol o la contrasena, la sesion actual del usuario sera revocada.
            Tendra que volver a iniciar sesion.
          </span>
        </div>

        {error && <div className="bg-error/10 text-error p-3 rounded-lg text-sm">{error}</div>}
      </div>

      <ModalFooter>
        <button
          onClick={onClose}
          disabled={submitting}
          className="flex-1 border border-border-default text-text-main/60 hover:text-text-main hover:bg-surface-elevated font-medium py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={!dirty || submitting}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold py-2.5 rounded-xl transition-colors cursor-pointer disabled:bg-surface-elevated disabled:text-text-main/30"
        >
          {submitting ? <div className="simple-spinner w-4! h-4! border-2! border-white! border-b-transparent!" /> : "Guardar"}
        </button>
      </ModalFooter>
    </ModalShell>
  );
}

function DeleteUserModal({
  user,
  onClose,
  onDeleted,
}: {
  user: UserListItem;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailLower = (user.email ?? "").toLowerCase();
  const matches = confirmText.trim().toLowerCase() === emailLower && emailLower.length > 0;

  const handleDelete = async () => {
    if (!matches) return;
    setSubmitting(true);
    setError(null);
    try {
      const url = `/api/admin/usuarios/${user.uid}?confirmEmail=${encodeURIComponent(emailLower)}`;
      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error eliminando usuario");
        return;
      }
      onDeleted();
    } catch {
      setError("Error de conexion");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title="Eliminar usuario" onClose={onClose} disabled={submitting}>
      <div className="space-y-4">
        <div className="bg-error/10 border border-error/20 rounded-lg p-3 text-sm text-error">
          Esta accion es permanente. El usuario <strong>{user.email}</strong> perdera acceso inmediatamente.
        </div>

        <Field
          label="Para confirmar, escribe el email del usuario"
          hint={`Debe coincidir con: ${user.email ?? ""}`}
        >
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            disabled={submitting}
            autoFocus
            className={`${inputClass} w-full px-3 py-2.5`}
            placeholder={user.email ?? ""}
          />
        </Field>

        {error && <div className="bg-error/10 text-error p-3 rounded-lg text-sm">{error}</div>}
      </div>

      <ModalFooter>
        <button
          onClick={onClose}
          disabled={submitting}
          className="flex-1 border border-border-default text-text-main/60 hover:text-text-main hover:bg-surface-elevated font-medium py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleDelete}
          disabled={!matches || submitting}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-error hover:bg-error/90 text-white font-semibold py-2.5 rounded-xl transition-colors cursor-pointer disabled:bg-surface-elevated disabled:text-text-main/30"
        >
          {submitting ? (
            <div className="simple-spinner w-4! h-4! border-2! border-white! border-b-transparent!" />
          ) : (
            <>
              <FaTrash className="w-3.5 h-3.5" />
              Eliminar
            </>
          )}
        </button>
      </ModalFooter>
    </ModalShell>
  );
}

function ModalShell({
  title,
  onClose,
  disabled,
  children,
}: {
  title: string;
  onClose: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-card border border-border-subtle rounded-xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-start justify-between p-5 border-b border-border-subtle">
          <h2 className="font-cormorant text-xl font-semibold text-text-main truncate">{title}</h2>
          <button
            onClick={onClose}
            disabled={disabled}
            className="w-8 h-8 flex items-center justify-center text-text-main/40 hover:text-text-main hover:bg-surface-elevated rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Cerrar"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function ModalFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 mt-5 pt-5 border-t border-border-subtle -mx-5 px-5 -mb-5 pb-5 bg-surface-elevated/30">
      {children}
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-main/60 mb-1.5">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-text-main/40 mt-1">{hint}</p>}
    </div>
  );
}

function RoleHelp({ role }: { role: Role }) {
  const text: Record<Role, string> = {
    admin: "Acceso total. Puede gestionar otros usuarios.",
    staff: "Pedidos, productos, promociones, plan novios, auditoria.",
    cursos: "Solo enrollments del taller.",
  };
  return <p className="text-[11px] text-text-main/40 mt-1">{text[role]}</p>;
}
