import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";
import { useNavigate } from "react-router";

export default function Profile() {
  const { user, updateProfile, uploadAvatar, logout, tasks, notes } = useApp();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");
    const { error } = await updateProfile({ name, bio });
    setSaving(false);
    setSaveMsg(error ? `Error: ${error}` : "Saved");
    setTimeout(() => setSaveMsg(""), 2500);
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please upload an image file");
      return;
    }
    setAvatarError("");
    setAvatarUploading(true);
    const { error } = await uploadAvatar(file);
    setAvatarUploading(false);
    if (error) setAvatarError(error);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const initials = (user?.name || "U").split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);
  const completedTasks = tasks.filter((t) => t.completed).length;

  return (
    <div
      className="h-full overflow-y-auto"
      style={{ background: "var(--background)" }}
    >
      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}
          className="flex items-center justify-between mb-10"
        >
          <div>
            <p className="font-mono-data text-xs tracking-widest uppercase mb-1" style={{ color: "var(--muted)" }}>Account</p>
            <h1 className="font-display text-3xl" style={{ color: "var(--foreground)" }}>Your Profile</h1>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => navigate("/dashboard")}
            className="text-sm px-4 py-2 rounded-lg transition-all"
            style={{ color: "var(--muted)", border: "1px solid var(--card-border)", background: "var(--card)" }}
          >
            â† Back
          </motion.button>
        </motion.div>

        {/* Avatar + Name card */}
        <motion.div
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, duration: 0.3 }}
          className="rounded-2xl p-6 md:p-8 mb-5"
          style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
        >
          <div className="flex flex-col md:flex-row items-center md:items-start gap-5 md:gap-7 text-center md:text-left">
            {/* Avatar upload zone */}
            <div
              className="relative flex-shrink-0 cursor-pointer group"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFile(file);
              }}
            >
              <motion.div
                animate={{ scale: dragOver ? 1.04 : 1 }}
                className="w-24 h-24 rounded-2xl overflow-hidden relative"
                style={{
                  border: dragOver ? "1.5px solid color-mix(in srgb, var(--foreground) 40%, transparent)" : "1.5px solid var(--card-border)",
                  background: "color-mix(in srgb, var(--foreground) 5%, transparent)",
                }}
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-display text-2xl" style={{ color: "var(--foreground)" }}>
                    {initials}
                  </div>
                )}
                {/* Hover overlay */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "color-mix(in srgb, var(--background) 65%, transparent)" }}
                >
                  {avatarUploading ? (
                    <svg className="animate-spin" width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <circle cx="9" cy="9" r="7" stroke="white" strokeWidth="1.5" strokeDasharray="14 30" />
                    </svg>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 3v8M4 7l4-4 4 4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2 13h12" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
                      </svg>
                      <span className="text-white font-mono-data" style={{ fontSize: 9 }}>Upload</span>
                    </>
                  )}
                </div>
              </motion.div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </div>

            {/* Name + email info */}
            <div className="flex-1 min-w-0 pt-1 w-full">
              <p className="font-display text-2xl mb-0.5 truncate" style={{ color: "var(--foreground)" }}>{user?.name || "-"}</p>
              <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>{user?.email}</p>
              <div className="flex justify-center md:justify-start gap-4 md:gap-5 w-full">
                {[
                  ["Tasks", tasks.length],
                  ["Done", completedTasks],
                  ["Notes", notes.length],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <p className="font-display text-xl" style={{ color: "var(--foreground)" }}>{value}</p>
                    <p className="font-mono-data text-xs" style={{ color: "var(--muted)" }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {avatarError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-xs mt-3"
                style={{ color: "rgba(255,100,100,0.9)" }}
              >
                {avatarError}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Edit form */}
        <motion.form
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.3 }}
          onSubmit={handleSave}
          className="rounded-2xl p-6 md:p-8 mb-5"
          style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
        >
          <h2 className="font-display text-lg mb-6" style={{ color: "var(--foreground)" }}>Personal Info</h2>

          <div className="flex flex-col gap-5">
            <div>
              <label className="font-mono-data text-xs tracking-widest uppercase block mb-2" style={{ color: "var(--muted)" }}>
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-150"
                style={{ background: "color-mix(in srgb, var(--foreground) 4%, transparent)", border: "1px solid var(--card-border)", color: "var(--foreground)" }}
                onFocus={(e) => (e.target.style.borderColor = "color-mix(in srgb, var(--foreground) 20%, transparent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--card-border)")}
              />
            </div>

            <div>
              <label className="font-mono-data text-xs tracking-widest uppercase block mb-2" style={{ color: "var(--muted)" }}>
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A short bio..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-150 resize-none"
                style={{ background: "color-mix(in srgb, var(--foreground) 4%, transparent)", border: "1px solid var(--card-border)", color: "var(--foreground)" }}
                onFocus={(e) => (e.target.style.borderColor = "color-mix(in srgb, var(--foreground) 20%, transparent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--card-border)")}
              />
            </div>

            <div>
              <label className="font-mono-data text-xs tracking-widest uppercase block mb-2" style={{ color: "var(--muted)" }}>
                Email
              </label>
              <input
                type="email"
                value={user?.email ?? ""}
                disabled
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={{ background: "color-mix(in srgb, var(--foreground) 2%, transparent)", border: "1px solid var(--card-border)", color: "var(--muted)", cursor: "not-allowed" }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 mt-6">
            <motion.button
              whileHover={{ scale: saving ? 1 : 1.02 }} whileTap={{ scale: saving ? 1 : 0.98 }}
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 flex items-center gap-2"
              style={{
                background: saving ? "color-mix(in srgb, var(--foreground) 10%, transparent)" : "var(--foreground)",
                color: saving ? "var(--muted)" : "var(--background)",
              }}
            >
              {saving && (
                <svg className="animate-spin" width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="9 22" />
                </svg>
              )}
              {saving ? "Saving..." : "Save changes"}
            </motion.button>

            <AnimatePresence>
              {saveMsg && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className="text-sm"
                  style={{ color: saveMsg.startsWith("Error") ? "rgba(255,100,100,0.9)" : "color-mix(in srgb, var(--foreground) 55%, transparent)" }}
                >
                  {saveMsg}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </motion.form>

        {/* Danger zone */}
        <motion.div
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.3 }}
          className="rounded-2xl p-6 md:p-8 mb-6"
          style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
        >
          <h2 className="font-display text-lg mb-2" style={{ color: "var(--foreground)" }}>Session</h2>
          <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
            You are signed in as <span style={{ color: "var(--foreground)" }}>{user?.email}</span>
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ border: "1px solid rgba(255,80,80,0.2)", color: "rgba(255,100,100,0.8)", background: "rgba(255,80,80,0.06)" }}
          >
            Sign out
          </motion.button>
        </motion.div>

      </div>
    </div>
  );
}
