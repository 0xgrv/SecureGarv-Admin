import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Globe, Star, Eye, EyeOff, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_KEY = import.meta.env.VITE_ADMIN_API_KEY || '';

interface CommunityEntry {
  _id: string;
  organisation: string;
  role: string;
  description: string;
  activities: string[];
  websiteUrl: string;
  isFeatured: boolean;
  isActive: boolean;
  order: number;
  whyVolunteer: string;
  createdAt?: string;
}

const EMPTY_FORM: Omit<CommunityEntry, '_id' | 'createdAt'> = {
  organisation: '',
  role: '',
  description: '',
  activities: [],
  websiteUrl: '',
  isFeatured: false,
  isActive: true,
  order: 0,
  whyVolunteer: '',
};

const authHeaders = {
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
};

// ─── Tag input ────────────────────────────────────────────────────────────────

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

const TagInput = ({ tags, onChange, placeholder = 'Type and press Enter' }: TagInputProps) => {
  const [input, setInput] = useState('');

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput('');
  };

  return (
    <div className="flex flex-wrap gap-1.5 p-2 border border-slate-600 rounded-lg bg-slate-700 min-h-[42px]">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-teal-900/40 text-teal-300 border border-teal-700"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            className="text-teal-400 hover:text-white ml-0.5"
            aria-label={`Remove ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); addTag(); }
          if (e.key === 'Backspace' && !input && tags.length) {
            onChange(tags.slice(0, -1));
          }
        }}
        placeholder={placeholder}
        className="flex-1 min-w-[120px] bg-transparent text-sm text-white outline-none placeholder-slate-500"
      />
    </div>
  );
};

// ─── Form ─────────────────────────────────────────────────────────────────────

interface FormProps {
  initial: Omit<CommunityEntry, '_id' | 'createdAt'>;
  onSave: (data: Omit<CommunityEntry, '_id' | 'createdAt'>) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

const EntryForm = ({ initial, onSave, onCancel, saving }: FormProps) => {
  const [form, setForm] = useState(initial);

  const set = (field: keyof typeof form, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.organisation.trim() || !form.role.trim() || !form.description.trim()) return;
    await onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-750 border border-slate-600 rounded-xl p-6 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">
            Organisation <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.organisation}
            onChange={(e) => set('organisation', e.target.value)}
            required
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            placeholder="e.g. SecurityBoat Community"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">
            Your Role <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.role}
            onChange={(e) => set('role', e.target.value)}
            required
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            placeholder="e.g. Cybersecurity Volunteer"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1.5">
          Description <span className="text-red-400">*</span>
        </label>
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          required
          rows={3}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
          placeholder="Describe your involvement and contribution..."
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1.5">
          Why I Volunteer (shown in side card when featured)
        </label>
        <textarea
          value={form.whyVolunteer}
          onChange={(e) => set('whyVolunteer', e.target.value)}
          rows={2}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
          placeholder="A short sentence about why you do this..."
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1.5">
          Activities / Tags <span className="text-slate-500">(press Enter to add)</span>
        </label>
        <TagInput
          tags={form.activities}
          onChange={(tags) => set('activities', tags)}
          placeholder="e.g. Workshops, CTF Events..."
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">
            Website URL
          </label>
          <input
            type="url"
            value={form.websiteUrl}
            onChange={(e) => set('websiteUrl', e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            placeholder="https://securityboat.net"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">
            Display Order <span className="text-slate-500">(lower = first)</span>
          </label>
          <input
            type="number"
            value={form.order}
            onChange={(e) => set('order', Number(e.target.value))}
            min={0}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-6 pt-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isFeatured}
            onChange={(e) => set('isFeatured', e.target.checked)}
            className="w-4 h-4 rounded accent-purple-500"
          />
          <span className="text-sm text-slate-300 flex items-center gap-1">
            <Star size={12} className="text-amber-400" />
            Featured (primary card)
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => set('isActive', e.target.checked)}
            className="w-4 h-4 rounded accent-purple-500"
          />
          <span className="text-sm text-slate-300">Active (visible on site)</span>
        </label>
      </div>

      <div className="flex gap-3 pt-2 border-t border-slate-700">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 text-sm font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Entry'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 text-sm font-semibold rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

// ─── Entry card ───────────────────────────────────────────────────────────────

interface EntryCardProps {
  entry: CommunityEntry;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (field: 'isActive' | 'isFeatured') => void;
  toggling: string | null;
}

const EntryCard = ({ entry, onEdit, onDelete, onToggle, toggling }: EntryCardProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`border rounded-xl p-5 transition-all duration-200 ${entry.isActive
        ? 'bg-slate-800 border-slate-700'
        : 'bg-slate-800/50 border-slate-700/50 opacity-60'
        }`}
    >
      <div className="flex items-start gap-3">
        <GripVertical size={16} className="text-slate-600 mt-1 flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-semibold text-white text-sm">{entry.organisation}</h3>
            {entry.isFeatured && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-900/40 text-amber-300 border border-amber-700">
                Featured
              </span>
            )}
            {!entry.isActive && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">
                Hidden
              </span>
            )}
          </div>
          <p className="text-xs text-teal-400 font-mono mb-1">{entry.role}</p>
          <p className="text-xs text-slate-400 line-clamp-2">{entry.description}</p>

          {/* Activities */}
          {entry.activities.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {entry.activities.map((act) => (
                <span key={act} className="text-[10px] px-2 py-0.5 rounded-full bg-teal-900/30 text-teal-400 border border-teal-800">
                  {act}
                </span>
              ))}
            </div>
          )}

          {/* Expanded: whyVolunteer + URL */}
          {expanded && (
            <div className="mt-3 space-y-2 text-xs text-slate-400 border-t border-slate-700 pt-3">
              {entry.whyVolunteer && (
                <p><span className="text-slate-500 font-mono">Why volunteer:</span> {entry.whyVolunteer}</p>
              )}
              {entry.websiteUrl && (
                <p>
                  <span className="text-slate-500 font-mono">URL:</span>{' '}
                  <a
                    href={entry.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:underline"
                  >
                    {entry.websiteUrl}
                  </a>
                </p>
              )}
              <p><span className="text-slate-500 font-mono">Order:</span> {entry.order}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setExpanded((v) => !v)}
            title={expanded ? 'Collapse' : 'Expand'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <button
            onClick={() => onToggle('isFeatured')}
            disabled={toggling === `${entry._id}-isFeatured`}
            title={entry.isFeatured ? 'Unset Featured' : 'Set as Featured'}
            className={`p-1.5 rounded-lg transition-colors ${entry.isFeatured
              ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-900/20'
              : 'text-slate-500 hover:text-amber-400 hover:bg-slate-700'
              }`}
          >
            <Star size={14} />
          </button>

          <button
            onClick={() => onToggle('isActive')}
            disabled={toggling === `${entry._id}-isActive`}
            title={entry.isActive ? 'Hide entry' : 'Show entry'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            {entry.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>

          {entry.websiteUrl && (
            <a
              href={entry.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open website"
              className="p-1.5 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-slate-700 transition-colors"
            >
              <Globe size={14} />
            </a>
          )}

          <button
            onClick={onEdit}
            title="Edit"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <Pencil size={14} />
          </button>

          <button
            onClick={onDelete}
            title="Delete"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main section ─────────────────────────────────────────────────────────────

export default function CommunitySection() {
  const [entries, setEntries] = useState<CommunityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState<CommunityEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // ── Fetch all (admin view — includes inactive)
  const fetchEntries = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/community/all`, {
        headers: { 'x-api-key': API_KEY },
      });
      if (!res.ok) throw new Error('Failed to fetch community entries');
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEntries(); }, []);

  // ── Create
  const handleCreate = async (data: Omit<CommunityEntry, '_id' | 'createdAt'>) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/community`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Create failed');
      }
      await fetchEntries();
      setShowForm(false);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // ── Update
  const handleUpdate = async (data: Omit<CommunityEntry, '_id' | 'createdAt'>) => {
    if (!editEntry) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/community/${editEntry._id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Update failed');
      }
      await fetchEntries();
      setEditEntry(null);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle
  const handleToggle = async (id: string, field: 'isActive' | 'isFeatured') => {
    setToggling(`${id}-${field}`);
    try {
      const res = await fetch(`${API_URL}/api/community/${id}/toggle`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ field }),
      });
      if (!res.ok) throw new Error('Toggle failed');
      const updated = await res.json();
      setEntries((prev) => prev.map((e) => (e._id === id ? updated : e)));
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setToggling(null);
    }
  };

  // ── Delete
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/community/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!res.ok) throw new Error('Delete failed');
      setEntries((prev) => prev.filter((e) => e._id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  const active = entries.filter((e) => e.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-white">Community &amp; Volunteering</h2>
          <p className="text-slate-400 text-sm mt-1">
            Manage community organisations and volunteer roles shown on the portfolio.
          </p>
          <div className="flex gap-4 mt-3">
            <span className="text-xs text-slate-400">
              <span className="text-white font-semibold">{entries.length}</span> total
            </span>
            <span className="text-xs text-slate-400">
              <span className="text-green-400 font-semibold">{active}</span> active
            </span>
            <span className="text-xs text-slate-400">
              <span className="text-amber-400 font-semibold">
                {entries.filter((e) => e.isFeatured).length}
              </span>{' '}
              featured
            </span>
          </div>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditEntry(null); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-colors"
        >
          <Plus size={16} />
          Add Entry
        </button>
      </div>

      {/* Create form */}
      {showForm && !editEntry && (
        <EntryForm
          initial={{ ...EMPTY_FORM, order: entries.length }}
          onSave={handleCreate}
          onCancel={() => setShowForm(false)}
          saving={saving}
        />
      )}

      {/* List */}
      {entries.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Globe size={40} className="mx-auto mb-3 text-slate-600" />
          <p className="text-base font-medium text-slate-400">No community entries yet</p>
          <p className="text-sm mt-1">Add your first entry above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry._id}>
              {/* Edit form inline */}
              {editEntry?._id === entry._id ? (
                <EntryForm
                  initial={{
                    organisation: entry.organisation,
                    role: entry.role,
                    description: entry.description,
                    activities: entry.activities,
                    websiteUrl: entry.websiteUrl,
                    isFeatured: entry.isFeatured,
                    isActive: entry.isActive,
                    order: entry.order,
                    whyVolunteer: entry.whyVolunteer,
                  }}
                  onSave={handleUpdate}
                  onCancel={() => setEditEntry(null)}
                  saving={saving}
                />
              ) : (
                <>
                  <EntryCard
                    entry={entry}
                    onEdit={() => setEditEntry(entry)}
                    onDelete={() => setDeleteConfirm(entry._id)}
                    onToggle={(field) => handleToggle(entry._id, field)}
                    toggling={toggling}
                  />
                  {/* Delete confirm */}
                  {deleteConfirm === entry._id && (
                    <div className="mt-2 p-4 rounded-lg border border-red-800 bg-red-950/30 flex items-center justify-between gap-4">
                      <p className="text-sm text-red-300">
                        Delete <strong>{entry.organisation}</strong>? This cannot be undone.
                      </p>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleDelete(entry._id)}
                          className="px-3 py-1 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white"
                        >
                          Confirm Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-3 py-1 text-xs font-semibold rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
