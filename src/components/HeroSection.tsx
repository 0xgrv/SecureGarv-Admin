import { useState, useEffect, useCallback } from 'react';
import {
  Save, Eye, X, LinkIcon, Loader2, User, Brain, Rocket,
  Briefcase, Tag, BookOpen, Plus, Trash2, GripVertical,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface AboutContent {
  whoIAm: string;
  myExpertise: string;
  myMission: string;
  myJourney: string;
}

interface HeroTag {
  label: string;
  color: string;
}

interface Publications {
  title: string;
  description: string;
  url: string;
  buttonLabel: string;
  isVisible: boolean;
}

interface HeroContent {
  typewriterTexts: string[];
  heroParagraph: string;
  resume: { url: string; fileName: string };
  heroTags: HeroTag[];
  publications: Publications;
  about: AboutContent;
}

// ─────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL || '';
const API_KEY = import.meta.env.VITE_ADMIN_API_KEY || '';

const DEFAULT_CONTENT: HeroContent = {
  typewriterTexts: [],
  heroParagraph: '',
  resume: { url: '', fileName: '' },
  heroTags: [],
  publications: {
    title: 'Poetry & Writing on Amazon',
    description: '',
    url: '',
    buttonLabel: 'View Books',
    isVisible: true,
  },
  about: { whoIAm: '', myExpertise: '', myMission: '', myJourney: '' },
};

const TAG_PRESETS = [
  { name: 'Teal', value: '#3ecfb3' },
  { name: 'Purple', value: '#7c6af7' },
  { name: 'Amber', value: '#e8a44a' },
  { name: 'Rose', value: '#f06b8b' },
  { name: 'Blue', value: '#60a5fa' },
  { name: 'Green', value: '#4ade80' },
];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const apiHeaders = {
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
};

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: { ...apiHeaders, ...options.headers },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { message?: string }).message || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─────────────────────────────────────────────────────────────
// FormField Component
// ─────────────────────────────────────────────────────────────

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

const FormField = ({ label, error, required, children }: FormFieldProps) => (
  <div className="w-full">
    <label className="admin-label block mb-1">
      {label}{required && <span className="text-[#f06b8b] ml-1">*</span>}
    </label>
    {children}
    {error && (
      <p className="mt-1 text-xs flex items-center gap-1 text-[#f06b8b]">
        <X size={10} /> {error}
      </p>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function HeroEditor() {
  const [content, setContent] = useState<HeroContent>(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagLabel, setTagLabel] = useState('');
  const [tagColor, setTagColor] = useState('#3ecfb3');
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeDraft, setResumeDraft] = useState('');
  const [newTypeText, setNewTypeText] = useState('');

  // ─────────────────────────────────────────────────────────────
  // Fetch Content
  // ─────────────────────────────────────────────────────────────

  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch<HeroContent>('/api/content');
      setContent({
        typewriterTexts: data.typewriterTexts || [],
        heroParagraph: data.heroParagraph || '',
        resume: data.resume || { url: '', fileName: '' },
        heroTags: data.heroTags || [],
        publications: data.publications || DEFAULT_CONTENT.publications,
        about: data.about || DEFAULT_CONTENT.about,
      });
      setResumeDraft(data.resume?.url || '');
    } catch (err) {
      toast.error((err as Error).message || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  // ─────────────────────────────────────────────────────────────
  // Typewriter Management
  // ─────────────────────────────────────────────────────────────

  const addTypeText = () => {
    const trimmed = newTypeText.trim();
    if (!trimmed) { setErrors({ typeText: 'Enter text first' }); return; }
    if (content.typewriterTexts.includes(trimmed)) { toast.error('Already in list'); return; }
    setContent(prev => ({ ...prev, typewriterTexts: [...prev.typewriterTexts, trimmed] }));
    setNewTypeText('');
    setErrors({});
  };

  const removeTypeText = (i: number) =>
    setContent(prev => ({ ...prev, typewriterTexts: prev.typewriterTexts.filter((_, idx) => idx !== i) }));

  // ─────────────────────────────────────────────────────────────
  // Tag Management
  // ─────────────────────────────────────────────────────────────

  const addTag = () => {
    const trimmed = tagLabel.trim();
    if (!trimmed) { setErrors({ tagLabel: 'Enter a label' }); return; }
    if (content.heroTags.length >= 10) { toast.error('Max 10 tags'); return; }
    if (content.heroTags.some(t => t.label === trimmed)) { toast.error('Tag already exists'); return; }
    setContent(prev => ({
      ...prev,
      heroTags: [...prev.heroTags, { label: trimmed, color: tagColor }],
    }));
    setTagLabel('');
    setErrors({});
  };

  const removeTag = (i: number) =>
    setContent(prev => ({ ...prev, heroTags: prev.heroTags.filter((_, idx) => idx !== i) }));

  // ─────────────────────────────────────────────────────────────
  // About Management
  // ─────────────────────────────────────────────────────────────

  const setAbout = (field: keyof AboutContent, value: string) => {
    setContent(prev => ({ ...prev, about: { ...prev.about, [field]: value } }));
    if (!value.trim()) setErrors(prev => ({ ...prev, [field]: 'Required' }));
    else setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
  };

  // ─────────────────────────────────────────────────────────────
  // Publications Management
  // ─────────────────────────────────────────────────────────────

  const setPub = (field: keyof Publications, value: string | boolean) =>
    setContent(prev => ({ ...prev, publications: { ...prev.publications, [field]: value } }));

  // ─────────────────────────────────────────────────────────────
  // Save Handlers
  // ─────────────────────────────────────────────────────────────

  const saveHero = async () => {
    if (!content.heroParagraph.trim()) {
      setErrors({ heroParagraph: 'Introduction is required' });
      toast.error('Fill in the introduction first');
      return;
    }
    setSaving('hero');
    try {
      await apiFetch('/api/content', {
        method: 'PUT',
        body: JSON.stringify({
          typewriterTexts: content.typewriterTexts,
          heroParagraph: content.heroParagraph,
          resume: content.resume,
        }),
      });
      toast.success('Hero content saved');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(null);
    }
  };

  const saveHeroTags = async () => {
    setSaving('tags');
    try {
      await apiFetch('/api/content/hero-tags', {
        method: 'PUT',
        body: JSON.stringify({ heroTags: content.heroTags }),
      });
      toast.success('Role tags saved');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(null);
    }
  };

  const savePublications = async () => {
    if (content.publications.url && content.publications.url.trim()) {
      try { new URL(content.publications.url); }
      catch { toast.error('Enter a valid URL'); return; }
    }
    setSaving('publications');
    try {
      await apiFetch('/api/content/publications', {
        method: 'PUT',
        body: JSON.stringify(content.publications),
      });
      toast.success('Publications saved');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(null);
    }
  };

  const saveAbout = async () => {
    const fields: (keyof AboutContent)[] = ['whoIAm', 'myExpertise', 'myMission', 'myJourney'];
    let valid = true;
    fields.forEach(f => {
      if (!content.about[f].trim()) {
        setErrors(prev => ({ ...prev, [f]: 'Required' }));
        valid = false;
      }
    });
    if (!valid) { toast.error('Fill in all About fields'); return; }
    setSaving('about');
    try {
      await apiFetch('/api/content/about', {
        method: 'PUT',
        body: JSON.stringify(content.about),
      });
      toast.success('About section saved');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(null);
    }
  };

  const updateResume = async () => {
    if (!resumeDraft.trim()) { toast.error('Enter a URL'); return; }
    try { new URL(resumeDraft); } catch { toast.error('Invalid URL'); return; }
    setSaving('resume');
    try {
      const updated = await apiFetch<HeroContent>('/api/content', {
        method: 'PUT',
        body: JSON.stringify({
          ...content,
          resume: {
            url: resumeDraft.trim(),
            fileName: resumeDraft.trim().split('/').pop() || 'Resume',
          },
        }),
      });
      setContent(prev => ({ ...prev, resume: updated.resume }));
      toast.success('Resume updated');
      setShowResumeModal(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(null);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Loading State
  // ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin" style={{ color: '#7c6af7' }} />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-full overflow-x-hidden px-3 sm:px-4">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0d1220',
            color: '#e8edf5',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            fontSize: 13,
          },
        }}
      />

      {/* Page header */}
      <div className="mb-6">
        <p className="text-xs uppercase tracking-wider text-[#687081] mb-1">Content Editor</p>
        <h1 className="text-2xl font-bold text-white">Home Content</h1>
        <p className="text-sm mt-1 text-[#687081]">Manage hero, role tags, publications and about sections.</p>
      </div>

      {/* Responsive Grid */}
      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6 w-full">

          {/* Hero Section */}
          <div className="bg-[#0d1220] rounded-2xl border border-white/5 p-4 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[rgba(124,106,247,0.12)] border border-[rgba(124,106,247,0.2)]">
                  <Rocket size={15} style={{ color: '#7c6af7' }} />
                </div>
                <h2 className="font-semibold text-sm text-white">Hero Content</h2>
              </div>
              <button
                onClick={saveHero}
                disabled={saving === 'hero'}
                className="admin-btn-primary text-xs py-2 px-4 rounded-lg bg-[#7c6af7] text-white hover:bg-[#6a58e0] transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving === 'hero' ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                {saving === 'hero' ? 'Saving…' : 'Save Hero'}
              </button>
            </div>

            <FormField label="Introduction paragraph" error={errors.heroParagraph} required>
              <div className="relative">
                <textarea
                  value={content.heroParagraph}
                  onChange={e => {
                    setContent(prev => ({ ...prev, heroParagraph: e.target.value }));
                    if (e.target.value.trim()) {
                      setErrors(prev => { const next = { ...prev }; delete next.heroParagraph; return next; });
                    }
                  }}
                  rows={5}
                  maxLength={1000}
                  className="w-full px-4 py-2 rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/10 text-white text-sm focus:outline-none focus:border-[#7c6af7] transition-colors"
                  placeholder="Write your compelling introduction here…"
                />
                <span className="absolute bottom-2.5 right-3 text-[10px] text-[#687081]">
                  {content.heroParagraph.length}/1000
                </span>
              </div>
            </FormField>

            <FormField label="Rotating typewriter lines">
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <input
                  type="text"
                  value={newTypeText}
                  onChange={e => setNewTypeText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTypeText())}
                  className="flex-1 px-4 py-2 rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/10 text-white text-sm focus:outline-none focus:border-[#7c6af7]"
                  placeholder="e.g. Security Analyst & Penetration Tester"
                />
                <button onClick={addTypeText} className="admin-btn-ghost px-4 py-2 text-xs rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-1">
                  <Plus size={13} /> Add
                </button>
              </div>
              {content.typewriterTexts.length === 0 ? (
                <p className="text-xs text-center py-4 rounded-lg text-[#687081] border border-dashed border-white/10">
                  No typewriter lines yet
                </p>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {content.typewriterTexts.map((text, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-2 rounded-lg group bg-white/5 border border-white/10"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <GripVertical size={13} className="text-[#687081] flex-shrink-0" />
                        <span className="text-sm text-white font-mono truncate">{text}</span>
                      </div>
                      <button
                        onClick={() => removeTypeText(i)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-[#f06b8b] flex-shrink-0"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </FormField>
          </div>

          {/* Role Badges */}
          <div className="bg-[#0d1220] rounded-2xl border border-white/5 p-4 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[rgba(62,207,179,0.12)] border border-[rgba(62,207,179,0.2)]">
                  <Tag size={15} style={{ color: '#3ecfb3' }} />
                </div>
                <div>
                  <h2 className="font-semibold text-sm text-white">Role Badges</h2>
                  <p className="text-[11px] text-[#687081]">Shown below the CTA buttons on the hero</p>
                </div>
              </div>
              <button
                onClick={saveHeroTags}
                disabled={saving === 'tags'}
                className="admin-btn-primary text-xs py-2 px-4 rounded-lg bg-[#7c6af7] text-white hover:bg-[#6a58e0] transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving === 'tags' ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                {saving === 'tags' ? 'Saving…' : 'Save Tags'}
              </button>
            </div>

            <div className="rounded-xl p-4 space-y-3 bg-white/5 border border-white/10">
              <p className="admin-label text-sm text-white mb-2">Add new tag</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={tagLabel}
                  onChange={e => setTagLabel(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  maxLength={60}
                  className="flex-1 px-4 py-2 rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/10 text-white text-sm focus:outline-none focus:border-[#7c6af7]"
                  placeholder="e.g. VAPT Analyst"
                />
                <button onClick={addTag} className="admin-btn-ghost px-4 py-2 text-xs rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-1">
                  <Plus size={13} /> Add
                </button>
              </div>

              <div>
                <p className="admin-label text-sm text-white mb-2">Badge colour</p>
                <div className="flex flex-wrap gap-2">
                  {TAG_PRESETS.map(({ name, value }) => (
                    <button
                      key={value}
                      onClick={() => setTagColor(value)}
                      title={name}
                      className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                      style={{
                        background: value,
                        outline: tagColor === value ? `2px solid ${value}` : '2px solid transparent',
                        outlineOffset: 2,
                      }}
                    />
                  ))}
                  <label className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs cursor-pointer bg-white/5 border border-white/10 text-[#687081]">
                    <input
                      type="color"
                      value={tagColor}
                      onChange={e => setTagColor(e.target.value)}
                      className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent"
                    />
                    Custom
                  </label>
                </div>
              </div>

              {tagLabel && (
                <div className="flex items-center gap-2">
                  <p className="text-[11px] text-[#687081]">Preview:</p>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-white/5 border border-white/10 text-[#687081]">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: tagColor }} />
                    {tagLabel}
                  </span>
                </div>
              )}
            </div>

            {content.heroTags.length === 0 ? (
              <p className="text-xs text-center py-4 rounded-lg text-[#687081] border border-dashed border-white/10">
                No role badges yet — add some above
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {content.heroTags.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono group bg-white/5 border border-white/10 text-[#687081]"
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: tag.color }} />
                    <span className="truncate max-w-[150px]">{tag.label}</span>
                    <button
                      onClick={() => removeTag(i)}
                      className="opacity-50 hover:opacity-100 transition-opacity ml-0.5 text-[#f06b8b]"
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6 w-full">

          {/* Publications */}
          <div className="bg-[#0d1220] rounded-2xl border border-white/5 p-4 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[rgba(232,164,74,0.12)] border border-[rgba(232,164,74,0.2)]">
                  <BookOpen size={15} style={{ color: '#e8a44a' }} />
                </div>
                <div>
                  <h2 className="font-semibold text-sm text-white">Publications Highlight</h2>
                  <p className="text-[11px] text-[#687081]">Card shown above the blog posts grid</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    className="relative w-9 h-5 rounded-full transition-colors cursor-pointer"
                    style={{ background: content.publications.isVisible ? 'rgba(124,106,247,0.4)' : 'rgba(255,255,255,0.08)' }}
                    onClick={() => setPub('isVisible', !content.publications.isVisible)}
                  >
                    <div
                      className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
                      style={{
                        background: content.publications.isVisible ? '#7c6af7' : '#687081',
                        transform: content.publications.isVisible ? 'translateX(20px)' : 'translateX(2px)',
                      }}
                    />
                  </div>
                  <span className="text-xs text-[#687081]">
                    {content.publications.isVisible ? 'Visible' : 'Hidden'}
                  </span>
                </label>
                <button
                  onClick={savePublications}
                  disabled={saving === 'publications'}
                  className="admin-btn-primary text-xs py-2 px-4 rounded-lg bg-[#7c6af7] text-white hover:bg-[#6a58e0] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {saving === 'publications' ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  {saving === 'publications' ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
              <FormField label="Card title" required>
                <input
                  type="text"
                  value={content.publications.title}
                  onChange={e => setPub('title', e.target.value)}
                  maxLength={200}
                  className="w-full px-4 py-2 rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/10 text-white text-sm focus:outline-none focus:border-[#7c6af7]"
                  placeholder="Poetry & Writing on Amazon"
                />
              </FormField>
              <FormField label="Button label">
                <input
                  type="text"
                  value={content.publications.buttonLabel}
                  onChange={e => setPub('buttonLabel', e.target.value)}
                  maxLength={50}
                  className="w-full px-4 py-2 rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/10 text-white text-sm focus:outline-none focus:border-[#7c6af7]"
                  placeholder="View Books"
                />
              </FormField>
            </div>

            <FormField label="Short description">
              <textarea
                value={content.publications.description}
                onChange={e => setPub('description', e.target.value)}
                rows={2}
                maxLength={500}
                className="w-full px-4 py-2 rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/10 text-white text-sm focus:outline-none focus:border-[#7c6af7]"
                placeholder="Published poet and author. Available on Amazon…"
              />
            </FormField>

            <FormField label="URL" error={errors.pubUrl}>
              <input
                type="url"
                value={content.publications.url}
                onChange={e => {
                  setPub('url', e.target.value);
                  setErrors(prev => { const next = { ...prev }; delete next.pubUrl; return next; });
                }}
                maxLength={500}
                className="w-full px-4 py-2 rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/10 text-white text-sm focus:outline-none focus:border-[#7c6af7]"
                placeholder="https://www.amazon.in/stores/…"
              />
            </FormField>
          </div>

          {/* Resume Section */}
          <div className="bg-[#0d1220] rounded-2xl border border-white/5 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[rgba(62,207,179,0.12)] border border-[rgba(62,207,179,0.2)]">
                  <LinkIcon size={15} style={{ color: '#3ecfb3' }} />
                </div>
                <h2 className="font-semibold text-sm text-white">Resume Link</h2>
              </div>
              {content.resume?.url && (
                <a
                  href={content.resume.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-[#3ecfb3] hover:underline"
                >
                  <Eye size={13} /> View
                </a>
              )}
            </div>

            {content.resume?.url ? (
              <div className="rounded-xl p-4 space-y-3 bg-white/5 border border-white/10">
                <div>
                  <p className="admin-label text-sm text-white mb-1">File name</p>
                  <p className="text-sm font-mono truncate text-white/80">{content.resume.fileName}</p>
                </div>
                <div>
                  <p className="admin-label text-sm text-white mb-1">URL</p>
                  <p className="text-xs truncate text-[#7c6af7]">{content.resume.url}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    onClick={() => { setResumeDraft(content.resume.url); setShowResumeModal(true); }}
                    className="admin-btn-ghost text-xs py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    Edit URL
                  </button>
                  <button
                    onClick={async () => {
                      setSaving('resume');
                      try {
                        await apiFetch('/api/content', {
                          method: 'PUT',
                          body: JSON.stringify({ ...content, resume: { url: '', fileName: '' } }),
                        });
                        setContent(prev => ({ ...prev, resume: { url: '', fileName: '' } }));
                        toast.success('Resume removed');
                      } catch (err) {
                        toast.error((err as Error).message);
                      } finally { setSaving(null); }
                    }}
                    className="admin-btn-danger text-xs py-1.5 px-3 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { setResumeDraft(''); setShowResumeModal(true); }}
                className="w-full py-8 rounded-xl text-sm flex flex-col items-center gap-2 transition-colors border border-dashed border-white/10 text-[#687081] hover:bg-[rgba(124,106,247,0.04)]"
              >
                <LinkIcon size={20} className="text-white/20" />
                <span>Add resume link</span>
                <span className="text-xs text-white/20">PDF or Google Drive link</span>
              </button>
            )}
          </div>

          {/* About Section */}
          <div className="bg-[#0d1220] rounded-2xl border border-white/5 p-4 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[rgba(124,106,247,0.12)] border border-[rgba(124,106,247,0.2)]">
                  <User size={15} style={{ color: '#7c6af7' }} />
                </div>
                <h2 className="font-semibold text-sm text-white">About Section</h2>
              </div>
              <button
                onClick={saveAbout}
                disabled={saving === 'about'}
                className="admin-btn-primary text-xs py-2 px-4 rounded-lg bg-[#7c6af7] text-white hover:bg-[#6a58e0] transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving === 'about' ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                {saving === 'about' ? 'Saving…' : 'Save About'}
              </button>
            </div>

            {[
              { field: 'whoIAm', label: 'Who I Am', rows: 3 },
              { field: 'myExpertise', label: 'My Expertise', rows: 3 },
              { field: 'myMission', label: 'My Mission', rows: 3 },
              { field: 'myJourney', label: 'From Curiosity to Cybersecurity', rows: 4 },
            ].map(({ field, label, rows }) => (
              <FormField key={field} label={label} error={errors[field]} required>
                <textarea
                  value={content.about[field as keyof AboutContent]}
                  onChange={e => setAbout(field as keyof AboutContent, e.target.value)}
                  rows={rows}
                  maxLength={2000}
                  className="w-full px-4 py-2 rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/10 text-white text-sm focus:outline-none focus:border-[#7c6af7]"
                  placeholder={`Describe ${label.toLowerCase()}…`}
                />
              </FormField>
            ))}
          </div>
        </div>
      </div>

      {/* Resume Modal */}
      {showResumeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0d1220] rounded-2xl border border-white/10 p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-white">
                {content.resume?.url ? 'Update Resume' : 'Add Resume'}
              </h3>
              <button onClick={() => setShowResumeModal(false)} className="p-1 rounded-lg text-[#687081] hover:text-white">
                <X size={18} />
              </button>
            </div>
            <FormField label="Resume URL" required>
              <input
                type="url"
                value={resumeDraft}
                onChange={e => setResumeDraft(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/10 text-white text-sm focus:outline-none focus:border-[#7c6af7]"
                placeholder="https://drive.google.com/…"
                autoFocus
              />
            </FormField>
            <p className="text-xs mt-2 mb-5 text-[#687081]">
              Upload to Google Drive, Dropbox, or any public URL.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowResumeModal(false)} className="admin-btn-ghost text-xs px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                Cancel
              </button>
              <button
                onClick={updateResume}
                disabled={saving === 'resume' || !resumeDraft.trim()}
                className="admin-btn-primary text-xs px-4 py-2 rounded-lg bg-[#7c6af7] text-white hover:bg-[#6a58e0] transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving === 'resume' ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                {content.resume?.url ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}