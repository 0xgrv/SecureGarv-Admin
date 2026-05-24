import { useState, useEffect, useRef, useCallback } from 'react';
import { Save, Plus, Edit, Trash2, Eye, Calendar, Clock, X, Loader2, BookOpen, Bold, Italic, Underline, List, Code, Link, Image, RefreshCw, FileText, CheckCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface BlogPost {
  _id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  readTime: string;
  image: string;
  tags: string[];
  status: 'draft' | 'published';
}

interface APIError {
  message: string;
  status?: number;
}

interface BlogApiResponse {
  posts: BlogPost[];
  totalPages?: number;
  currentPage?: number;
  total?: number;
}

const API_URL = import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_ADMIN_API_KEY;

// Helper functions for counters
const getWordCount = (text: string) => {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
};

const getCharacterCount = (text: string) => {
  return text.length;
};

// AUTOMATIC READ TIME CALCULATION
const calculateReadTime = (content: string): string => {
  if (!content.trim()) return '0 min read';

  const text = content
    .replace(/<img[^>]*>/gi, ' [image] ')
    .replace(/<h[1-6][^>]*>/gi, ' [heading] ')
    .replace(/<code[^>]*>|<\/code>/gi, ' [code] ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!text) return '0 min read';

  const wordCount = text.split(/\s+/).length;
  const imageCount = (content.match(/<img[^>]*>/gi) || []).length;
  const headingCount = (content.match(/<h[1-6][^>]*>/gi) || []).length;
  const codeBlockCount = (content.match(/<code[^>]*>/gi) || []).length;

  const wordsPerMinute = 160;
  const baseMinutes = wordCount / wordsPerMinute;
  const elementTime =
    (imageCount * 0.4) +
    (headingCount * 0.15) +
    (codeBlockCount * 0.8);

  const totalMinutes = baseMinutes + elementTime;
  const minutes = Math.max(1, Math.ceil(totalMinutes));

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m read`
      : `${hours}h read`;
  }

  return `${minutes} min read`;
};

function debounce(func: Function, wait: number) {
  let timeout: number;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const CustomToolbar = () => (
  <div id="toolbar" className="border-b border-gray-600/50 p-2 bg-gray-700/50">
    <select className="ql-header text-gray-300 bg-gray-700 border border-gray-600 rounded mr-2 p-1">
      <option value="1">Heading 1</option>
      <option value="2">Heading 2</option>
      <option value="3">Heading 3</option>
      <option value="">Normal</option>
    </select>

    <button className="ql-bold p-1 mx-1 text-gray-300 hover:bg-gray-600 rounded">
      <Bold size={16} />
    </button>
    <button className="ql-italic p-1 mx-1 text-gray-300 hover:bg-gray-600 rounded">
      <Italic size={16} />
    </button>
    <button className="ql-underline p-1 mx-1 text-gray-300 hover:bg-gray-600 rounded">
      <Underline size={16} />
    </button>

    <button className="ql-list p-1 mx-1 text-gray-300 hover:bg-gray-600 rounded" value="ordered">
      <List size={16} />
    </button>
    <button className="ql-list p-1 mx-1 text-gray-300 hover:bg-gray-600 rounded" value="bullet">
      <List size={16} />
    </button>

    <button className="ql-code-block p-1 mx-1 text-gray-300 hover:bg-gray-600 rounded">
      <Code size={16} />
    </button>
    <button className="ql-link p-1 mx-1 text-gray-300 hover:bg-gray-600 rounded">
      <Link size={16} />
    </button>
    <button className="ql-image p-1 mx-1 text-gray-300 hover:bg-gray-600 rounded">
      <Image size={16} />
    </button>
  </div>
);

export default function BlogSection() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'draft'>('all');
  const quillRef = useRef<ReactQuill>(null);

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    readTime: '1 min read',
    image: '',
    tags: [] as string[],
    status: 'draft' as 'draft' | 'published',
    newTag: ''
  });

  const [titleCharCount, setTitleCharCount] = useState(0);
  const [excerptCharCount, setExcerptCharCount] = useState(0);
  const [excerptWordCount, setExcerptWordCount] = useState(0);
  const [tagCount, setTagCount] = useState(0);

  const modules = {
    toolbar: {
      container: "#toolbar",
    },
    clipboard: {
      matchVisual: false,
    }
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'video', 'code-block'
  ];

  const calculateReadTimeDebounced = useCallback(
    debounce((content: string) => {
      const readTime = calculateReadTime(content);
      setFormData(prev => ({ ...prev, readTime }));
    }, 500),
    []
  );

  const refreshReadTime = () => {
    const newReadTime = calculateReadTime(formData.content);
    setFormData(prev => ({ ...prev, readTime: newReadTime }));
    toast.success(`Read time updated: ${newReadTime}`);
  };

  const apiClient = async <T,>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const headers = new Headers({
      'Content-Type': 'application/json',
      'x-api-key': API_KEY || '',
      ...(options.headers as Record<string, string>)
    });

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        throw {
          message: data.message || `Request failed with status ${response.status}`,
          status: response.status
        } as APIError;
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  // Fetch blog posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient<BlogApiResponse>('/api/blog');
        setPosts(response.posts);
      } catch (error) {
        const err = error as APIError;
        console.error('Error fetching blog posts:', err);
        toast.error(err.message || 'Failed to load blog posts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const validateField = (field: string, value: string): boolean => {
    const errors = { ...validationErrors };

    if (!value.trim() && field !== 'newTag') {
      errors[field] = 'This field is required';
    } else {
      delete errors[field];
    }

    setValidationErrors(errors);
    return !errors[field];
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'status' ? (value as 'draft' | 'published') : value
    }));

    if (field === 'title') {
      setTitleCharCount(getCharacterCount(value as string));
    }

    if (field === 'excerpt') {
      setExcerptCharCount(getCharacterCount(value as string));
      setExcerptWordCount(getWordCount(value as string));
    }

    if (field === 'tags') {
      setTagCount((value as string[]).length);
    }

    if (field !== 'status' && field !== 'tags') {
      validateField(field, value as string);
    }
  };

  const handleContentChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
    validateField('content', content);
    calculateReadTimeDebounced(content);
  };

  const addTag = () => {
    if (formData.newTag.trim() && !formData.tags.includes(formData.newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, prev.newTag.trim()],
        newTag: ''
      }));
      setTagCount(prev => prev + 1);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
    setTagCount(prev => prev - 1);
  };

  const openEditor = (post?: BlogPost) => {
    if (post) {
      setEditingPost(post);
      setFormData({
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        date: post.date,
        readTime: post.readTime,
        image: post.image,
        tags: [...post.tags],
        status: post.status,
        newTag: ''
      });
      setTitleCharCount(getCharacterCount(post.title));
      setExcerptCharCount(getCharacterCount(post.excerpt));
      setExcerptWordCount(getWordCount(post.excerpt));
      setTagCount(post.tags.length);
    } else {
      setEditingPost(null);
      setFormData({
        title: '',
        excerpt: '',
        content: '',
        date: new Date().toISOString().split('T')[0],
        readTime: '1 min read',
        image: '',
        tags: [],
        status: 'draft',
        newTag: ''
      });
      setTitleCharCount(0);
      setExcerptCharCount(0);
      setExcerptWordCount(0);
      setTagCount(0);
    }
    setShowEditor(true);
    setValidationErrors({});
  };

  const closeEditor = () => {
    setShowEditor(false);
    setEditingPost(null);
    setValidationErrors({});
  };

  const savePost = async () => {
    const requiredFields = ['title', 'excerpt', 'content', 'image'];
    let isValid = true;

    requiredFields.forEach(field => {
      if (!validateField(field, formData[field as keyof typeof formData] as string)) {
        isValid = false;
      }
    });

    if (!isValid) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      if (editingPost) {
        await apiClient(`/api/blog/${editingPost._id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        toast.success('Blog post updated successfully!');
      } else {
        await apiClient('/api/blog', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        toast.success('Blog post created successfully!');
      }

      const response = await apiClient<BlogApiResponse>('/api/blog');
      setPosts(response.posts);
      closeEditor();
    } catch (error) {
      const err = error as APIError;
      console.error('Error saving blog post:', err);
      toast.error(err.message || 'Failed to save blog post');
    } finally {
      setIsSaving(false);
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient(`/api/blog/${postId}`, {
        method: 'DELETE'
      });
      toast.success('Blog post deleted successfully!');
      setPosts(posts.filter(post => post._id !== postId));
    } catch (error) {
      const err = error as APIError;
      console.error('Error deleting blog post:', err);
      toast.error(err.message || 'Failed to delete blog post');
    }
  };

  const toggleStatus = async (post: BlogPost) => {
    try {
      const updatedPost = { ...post, status: post.status === 'published' ? 'draft' : 'published' };
      await apiClient(`/api/blog/${post._id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedPost)
      });

      setPosts(posts.map(p =>
        p._id === post._id
          ? { ...updatedPost, status: updatedPost.status as 'draft' | 'published' }
          : p
      ));
      toast.success(`Post ${updatedPost.status === 'published' ? 'published' : 'unpublished'} successfully!`);
    } catch (error) {
      const err = error as APIError;
      console.error('Error updating post status:', err);
      toast.error(err.message || 'Failed to update post status');
    }
  };

  const getFilteredPosts = () => {
    if (activeTab === 'all') return posts;
    return posts.filter(post => post.status === activeTab);
  };

  const filteredPosts = getFilteredPosts();
  const publishedCount = posts.filter(p => p.status === 'published').length;
  const draftCount = posts.filter(p => p.status === 'draft').length;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin h-12 w-12 text-blue-400 mx-auto" />
          <p className="text-gray-400 font-medium">Loading blog posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 p-4 md:p-6">
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#111827',
          color: '#F3F4F6',
          border: '1px solid #1F2937',
          borderRadius: '0.5rem',
          padding: '0.75rem 1rem'
        }
      }} />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Blog Management
            </h1>
            <p className="text-gray-400 mt-1">Create and manage your blog posts</p>
          </div>
          <button
            onClick={() => openEditor()}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg transition shadow-lg hover:shadow-purple-500/25"
          >
            <Plus size={20} />
            New Post
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-700/50 pb-4">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${activeTab === 'all'
                ? 'bg-purple-600/30 text-purple-400 border border-purple-500/30'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
              }`}
          >
            <FileText size={16} />
            All Posts ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab('published')}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${activeTab === 'published'
                ? 'bg-green-600/30 text-green-400 border border-green-500/30'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
              }`}
          >
            <CheckCircle size={16} />
            Published ({publishedCount})
          </button>
          <button
            onClick={() => setActiveTab('draft')}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${activeTab === 'draft'
                ? 'bg-yellow-600/30 text-yellow-400 border border-yellow-500/30'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
              }`}
          >
            <Edit size={16} />
            Drafts ({draftCount})
          </button>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <div key={post._id} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-lg hover:border-gray-600/70 transition hover:shadow-xl hover:shadow-purple-500/10">
              {/* Image */}
              <div className="relative h-48 mb-4 rounded-lg overflow-hidden group">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200/1f2937/9ca3af?text=No+Image';
                  }}
                />
                <div className="absolute top-3 right-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${post.status === 'published'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}>
                    {post.status}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white line-clamp-2 leading-tight">
                  {post.title}
                </h3>

                <p className="text-gray-400 text-sm line-clamp-3 leading-relaxed">
                  {post.excerpt}
                </p>

                {/* Meta Info */}
                <div className="flex items-center gap-4 text-xs text-gray-500 pt-2">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    {new Date(post.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    {post.readTime}
                  </div>
                </div>

                {/* Tags */}
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-3">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full border border-purple-500/30"
                      >
                        {tag}
                      </span>
                    ))}
                    {post.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-700/50 text-gray-400 text-xs rounded-full border border-gray-600/50">
                        +{post.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-700/50">
                  <button
                    onClick={() => openEditor(post)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-700/50 hover:bg-gray-700/70 text-gray-300 rounded-lg transition text-sm border border-gray-600/50 hover:border-gray-500/50"
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => toggleStatus(post)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition text-sm border border-blue-600/30 hover:border-blue-500/30"
                  >
                    <Eye size={16} />
                    {post.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={() => deletePost(post._id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition text-sm border border-red-600/30 hover:border-red-500/30"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredPosts.length === 0 && (
            <div className="col-span-full text-center py-16">
              <div className="bg-gray-800/50 rounded-xl p-12 border-2 border-dashed border-gray-700/50">
                <BookOpen className="w-16 h-16 text-gray-500 mx-auto mb-6" />
                <h3 className="text-xl font-medium text-gray-300 mb-3">
                  {activeTab === 'all' && 'No blog posts yet'}
                  {activeTab === 'published' && 'No published posts'}
                  {activeTab === 'draft' && 'No draft posts'}
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  {activeTab === 'all' && 'Start creating amazing content for your audience. Your first blog post is just a click away.'}
                  {activeTab === 'published' && 'Publish your drafts to see them here.'}
                  {activeTab === 'draft' && 'Create a draft post to start writing.'}
                </p>
                {(activeTab === 'all' || activeTab === 'draft') && (
                  <button
                    onClick={() => openEditor()}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg transition shadow-lg hover:shadow-purple-500/25 mx-auto"
                  >
                    <Plus size={20} />
                    Create First Post
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Blog Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col border border-gray-700/70">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700/50 bg-gray-900/50">
              <h2 className="text-xl font-semibold text-white">
                {editingPost ? 'Edit Blog Post' : 'Create New Blog Post'}
              </h2>
              <button
                onClick={closeEditor}
                className="text-gray-400 hover:text-gray-200 transition p-1 rounded-full hover:bg-gray-700/50"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Title Field with Counter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title * (max 200 characters)
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  onBlur={(e) => validateField('title', e.target.value)}
                  className={`w-full p-3 bg-gray-700/70 border ${validationErrors.title ? 'border-red-500/80' : 'border-gray-600/50'
                    } rounded-lg focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition text-white placeholder-gray-400`}
                  placeholder="Enter blog post title"
                  maxLength={200}
                />
                <div className="flex justify-between mt-1">
                  <div className="text-xs text-gray-400">
                    {titleCharCount}/200 characters
                  </div>
                  {validationErrors.title && (
                    <p className="text-xs text-red-400">{validationErrors.title}</p>
                  )}
                </div>
              </div>

              {/* Excerpt Field with Counters */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Excerpt * (max 300 characters)
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => handleInputChange('excerpt', e.target.value)}
                  onBlur={(e) => validateField('excerpt', e.target.value)}
                  rows={3}
                  className={`w-full p-3 bg-gray-700/70 border ${validationErrors.excerpt ? 'border-red-500/80' : 'border-gray-600/50'
                    } rounded-lg focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition text-white placeholder-gray-400`}
                  placeholder="Brief description of your blog post"
                  maxLength={300}
                />
                <div className="flex justify-between mt-1">
                  <div className="text-xs text-gray-400">
                    {excerptCharCount}/300 characters • {excerptWordCount} words
                  </div>
                  {validationErrors.excerpt && (
                    <p className="text-xs text-red-400">{validationErrors.excerpt}</p>
                  )}
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Featured Image URL *
                </label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => handleInputChange('image', e.target.value)}
                  onBlur={(e) => validateField('image', e.target.value)}
                  className={`w-full p-3 bg-gray-700/70 border ${validationErrors.image ? 'border-red-500/80' : 'border-gray-600/50'
                    } rounded-lg focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition text-white placeholder-gray-400`}
                  placeholder="https://example.com/image.jpg"
                />
                {validationErrors.image && (
                  <p className="mt-1 text-xs text-red-400">{validationErrors.image}</p>
                )}
              </div>

              {/* Content - Rich Text Editor */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Content *
                </label>
                <div className={`border ${validationErrors.content ? 'border-red-500/80' : 'border-gray-600/50'
                  } rounded-lg overflow-hidden`}>
                  <CustomToolbar />
                  <ReactQuill
                    ref={quillRef}
                    value={formData.content}
                    onChange={handleContentChange}
                    modules={modules}
                    formats={formats}
                    theme="snow"
                    className="bg-gray-700/70 text-white"
                    style={{
                      height: '400px',
                      border: 'none'
                    }}
                  />
                </div>
                {validationErrors.content && (
                  <p className="mt-1 text-xs text-red-400">{validationErrors.content}</p>
                )}
              </div>

              {/* Meta Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Publication Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="w-full p-3 bg-gray-700/70 border border-gray-600/50 rounded-lg focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Read Time (auto-calculated)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.readTime}
                      onChange={(e) => handleInputChange('readTime', e.target.value)}
                      className="flex-1 p-3 bg-gray-700/70 border border-gray-600/50 rounded-lg focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition text-white placeholder-gray-400"
                      placeholder="1 min read"
                    />
                    <button
                      type="button"
                      onClick={refreshReadTime}
                      className="px-4 py-3 bg-blue-600/50 hover:bg-blue-600/70 text-blue-300 rounded-lg transition border border-blue-600/50 flex items-center gap-2"
                      title="Recalculate based on current content"
                    >
                      <RefreshCw size={16} />
                      Refresh
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Automatically calculated from content. You can also manually adjust if needed.
                  </p>
                </div>
              </div>

              {/* Tags Field with Counter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tags ({tagCount}/10 max)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={formData.newTag}
                    onChange={(e) => setFormData(prev => ({ ...prev, newTag: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 p-3 bg-gray-700/70 border border-gray-600/50 rounded-lg focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition text-white placeholder-gray-400"
                    placeholder="Add a tag and press Enter"
                    disabled={tagCount >= 10}
                  />
                  <button
                    onClick={addTag}
                    disabled={tagCount >= 10 || !formData.newTag.trim()}
                    className="px-4 py-2 bg-purple-600/50 hover:bg-purple-600/70 text-purple-300 rounded-lg transition border border-purple-600/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
                {tagCount >= 10 && (
                  <p className="text-xs text-red-400 mb-2">Maximum 10 tags reached</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm border border-purple-500/30"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-purple-200 transition ml-1"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full p-3 bg-gray-700/70 border border-gray-600/50 rounded-lg focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition text-white"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-700/50 bg-gray-900/50">
              <button
                onClick={closeEditor}
                className="px-6 py-2 border border-gray-600/50 text-gray-300 rounded-lg hover:bg-gray-700/50 transition"
              >
                Cancel
              </button>
              <button
                onClick={savePost}
                disabled={isSaving}
                className={`px-6 py-2 rounded-lg transition flex items-center gap-2 ${isSaving
                    ? 'bg-purple-600/70 text-purple-200 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg hover:shadow-purple-500/25'
                  }`}
              >
                {isSaving ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : (
                  <Save size={16} />
                )}
                {isSaving ? 'Saving...' : (editingPost ? 'Update Post' : 'Create Post')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}