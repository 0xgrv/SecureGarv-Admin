// components/ReviewSection.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Star, Calendar, Loader2, MessageCircle, ExternalLink, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Review {
  _id: string;
  name: string;
  position: string;
  company?: string;
  rating: number;
  text: string;
  projectType: string;
  isActive: boolean;
  featured: boolean;
  order: number;
  createdAt: string;
  websiteUrl?: string;
}

// Field character limits (matching backend)
const FIELD_LIMITS = {
  name: 100,
  position: 100,
  company: 100,
  text: 1000,
  projectType: 50,
  websiteUrl: 500
};

const API_URL = import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_ADMIN_API_KEY;

const ReviewSection = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    position: '',
    company: '',
    rating: 5,
    text: '',
    projectType: '',
    isActive: true,
    featured: false,
    order: 0,
    websiteUrl: ''
  });

  const apiRequest = async (endpoint: string, method: string = 'GET', body?: any) => {
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY || ''
    };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Handle validation errors from backend
        if (errorData.errors) {
          const backendErrors: Record<string, string> = {};
          Object.keys(errorData.errors).forEach(key => {
            backendErrors[key] = errorData.errors[key].message || `${key} is invalid`;
          });
          setValidationErrors(backendErrors);
          throw new Error(errorData.message || 'Validation error');
        }
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      setValidationErrors({});
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred');
      throw error;
    }
  };

  // Fetch reviews data
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setIsLoading(true);
        const data = await apiRequest('/api/reviews');
        setReviews(data.reviews || data);
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const validateField = (name: string, value: string): string => {
    const limit = FIELD_LIMITS[name as keyof typeof FIELD_LIMITS];
    if (limit && value.length > limit) {
      return `${name} must be ${limit} characters or less (currently ${value.length}/${limit})`;
    }
    return '';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    // Clear validation error for this field
    setValidationErrors(prev => ({ ...prev, [name]: '' }));

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'rating') {
      const rating = parseInt(value);
      if (rating >= 1 && rating <= 5) {
        setFormData(prev => ({ ...prev, [name]: rating }));
      }
    } else {
      // Check character limit
      const limit = FIELD_LIMITS[name as keyof typeof FIELD_LIMITS];
      if (limit && value.length > limit) {
        setValidationErrors(prev => ({
          ...prev,
          [name]: `${name} exceeds ${limit} character limit (${value.length}/${limit})`
        }));
      }
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      position: '',
      company: '',
      rating: 5,
      text: '',
      projectType: '',
      isActive: true,
      featured: false,
      order: 0,
      websiteUrl: ''
    });
    setValidationErrors({});
    setIsEditing(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    // Frontend validation
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = 'Name is required';
    else if (formData.name.length > FIELD_LIMITS.name) errors.name = `Name must be ${FIELD_LIMITS.name} characters or less`;

    if (!formData.position.trim()) errors.position = 'Position is required';
    else if (formData.position.length > FIELD_LIMITS.position) errors.position = `Position must be ${FIELD_LIMITS.position} characters or less`;

    if (!formData.text.trim()) errors.text = 'Review text is required';
    else if (formData.text.length > FIELD_LIMITS.text) errors.text = `Review text must be ${FIELD_LIMITS.text} characters or less`;

    if (!formData.projectType.trim()) errors.projectType = 'Project type is required';
    else if (formData.projectType.length > FIELD_LIMITS.projectType) errors.projectType = `Project type must be ${FIELD_LIMITS.projectType} characters or less`;

    if (formData.rating < 1 || formData.rating > 5) errors.rating = 'Rating must be between 1 and 5';

    if (formData.websiteUrl && formData.websiteUrl.length > FIELD_LIMITS.websiteUrl) {
      errors.websiteUrl = `Website URL must be ${FIELD_LIMITS.websiteUrl} characters or less`;
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error('Please fix the validation errors');
      return;
    }

    try {
      setIsSaving(true);

      // Prepare data for submission - conditionally include websiteUrl
      const { websiteUrl, ...submitData } = formData;
      const finalData = websiteUrl ? { ...submitData, websiteUrl } : submitData;

      if (isEditing && editingId) {
        const updatedReview = await apiRequest(`/api/reviews/${editingId}`, 'PUT', finalData);
        setReviews(prev => prev.map(review =>
          review._id === editingId ? updatedReview : review
        ));
        toast.success('Review updated successfully!');
      } else {
        const newReview = await apiRequest('/api/reviews', 'POST', finalData);
        setReviews(prev => [...prev, newReview]);
        toast.success('Review added successfully!');
      }

      resetForm();
    } catch (error) {
      console.error('Save error:', error);
      // Error already shown by apiRequest
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (review: Review) => {
    setFormData({
      name: review.name,
      position: review.position,
      company: review.company || '',
      rating: review.rating,
      text: review.text,
      projectType: review.projectType,
      isActive: review.isActive,
      featured: review.featured,
      order: review.order,
      websiteUrl: review.websiteUrl || ''
    });
    setValidationErrors({});
    setIsEditing(true);
    setEditingId(review._id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      setIsSaving(true);
      await apiRequest(`/api/reviews/${id}`, 'DELETE');
      setReviews(prev => prev.filter(review => review._id !== id));
      toast.success('Review deleted successfully!');
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (id: string) => {
    try {
      setIsSaving(true);
      const result = await apiRequest(`/api/reviews/${id}/toggle-active`, 'PATCH');
      setReviews(prev => prev.map(review =>
        review._id === id ? { ...review, isActive: result.isActive } : review
      ));
      toast.success(`Review ${result.isActive ? 'activated' : 'deactivated'}!`);
    } catch (error) {
      console.error('Toggle active error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFeatured = async (id: string) => {
    try {
      setIsSaving(true);
      const result = await apiRequest(`/api/reviews/${id}/toggle-featured`, 'PATCH');
      setReviews(prev => prev.map(review =>
        review._id === id ? { ...review, featured: result.featured } : review
      ));
      toast.success(`Review ${result.featured ? 'featured' : 'unfeatured'}!`);
    } catch (error) {
      console.error('Toggle featured error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const StarRatingDisplay = ({ rating }: { rating: number }) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            className={i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
          />
        ))}
      </div>
    );
  };

  const StarRatingInput = ({ value, onChange }: { value: number; onChange: (rating: number) => void }) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i + 1)}
            className="focus:outline-none"
          >
            <Star
              size={24}
              className={i < value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 hover:text-yellow-400 hover:fill-yellow-400 transition-colors'}
            />
          </button>
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const CharacterCounter = ({ text, limit }: { text: string; limit: number }) => {
    const length = text.length;
    const isOver = length > limit;
    return (
      <span className={`text-xs ml-2 ${isOver ? 'text-red-500' : 'text-gray-400'}`}>
        {length}/{limit}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-0">
      <div className="mb-5">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Reviews Management</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Manage client testimonials and feedback for your portfolio
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {isEditing ? 'Edit Review' : 'Add New Review'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Client Name *
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    maxLength={FIELD_LIMITS.name}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${validationErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    placeholder="John Doe"
                  />
                  <CharacterCounter text={formData.name} limit={FIELD_LIMITS.name} />
                </div>
                {validationErrors.name && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle size={12} /> {validationErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Position *
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    maxLength={FIELD_LIMITS.position}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${validationErrors.position ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    placeholder="CTO, Project Manager, etc."
                  />
                  <CharacterCounter text={formData.position} limit={FIELD_LIMITS.position} />
                </div>
                {validationErrors.position && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle size={12} /> {validationErrors.position}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company (Optional)
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  maxLength={FIELD_LIMITS.company}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Company name (optional)"
                />
                <CharacterCounter text={formData.company} limit={FIELD_LIMITS.company} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Project Type *
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  name="projectType"
                  value={formData.projectType}
                  onChange={handleInputChange}
                  maxLength={FIELD_LIMITS.projectType}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${validationErrors.projectType ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  placeholder="Web Application, E-commerce, etc. (max 50 chars)"
                />
                <CharacterCounter text={formData.projectType} limit={FIELD_LIMITS.projectType} />
              </div>
              {validationErrors.projectType && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle size={12} /> {validationErrors.projectType}
                </p>
              )}

            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rating *
              </label>
              <StarRatingInput
                value={formData.rating}
                onChange={(rating) => setFormData(prev => ({ ...prev, rating }))}
              />
              {validationErrors.rating && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle size={12} /> {validationErrors.rating}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Review Text *
              </label>
              <div className="relative">
                <textarea
                  name="text"
                  value={formData.text}
                  onChange={handleInputChange}
                  rows={4}
                  maxLength={FIELD_LIMITS.text}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${validationErrors.text ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  placeholder="Client's testimonial about your work..."
                />
                <div className="absolute bottom-2 right-2">
                  <CharacterCounter text={formData.text} limit={FIELD_LIMITS.text} />
                </div>
              </div>
              {validationErrors.text && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle size={12} /> {validationErrors.text}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Website URL (Optional)
              </label>
              <div className="flex items-center">
                <input
                  type="url"
                  name="websiteUrl"
                  value={formData.websiteUrl}
                  onChange={handleInputChange}
                  maxLength={FIELD_LIMITS.websiteUrl}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${validationErrors.websiteUrl ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  placeholder="https://example.com"
                />
                <CharacterCounter text={formData.websiteUrl} limit={FIELD_LIMITS.websiteUrl} />
              </div>
              {validationErrors.websiteUrl && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle size={12} /> {validationErrors.websiteUrl}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  name="order"
                  value={formData.order}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Featured</span>
              </label>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
              >
                {isSaving ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : isEditing ? (
                  <Edit2 size={16} />
                ) : (
                  <Plus size={16} />
                )}
                <span>{isEditing ? 'Update' : 'Add'} Review</span>
              </button>

              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSaving}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Client Reviews ({reviews.length})
            </h3>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {reviews.filter(r => r.isActive).length} active • {reviews.filter(r => r.featured).length} featured
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <MessageCircle className="mx-auto mb-4 text-gray-400" size={48} />
              <p>No reviews found.</p>
              <p className="mt-2">Add your first review using the form on the left.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
              {reviews.map(review => (
                <div
                  key={review._id}
                  className={`p-4 rounded-lg border ${review.isActive
                    ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                    : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 opacity-70'
                    }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1 flex-wrap gap-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{review.name}</h4>
                        {review.featured && (
                          <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full">
                            Featured
                          </span>
                        )}
                        {!review.isActive && (
                          <span className="text-xs px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{review.position}</p>
                      {review.company && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{review.company}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => toggleActive(review._id)}
                        disabled={isSaving}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                        aria-label={review.isActive ? 'Deactivate' : 'Activate'}
                      >
                        <div className={`w-3 h-3 rounded-full ${review.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                      </button>
                      <button
                        onClick={() => toggleFeatured(review._id)}
                        disabled={isSaving}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                        aria-label={review.featured ? 'Unfeature' : 'Feature'}
                      >
                        <Star size={16} className={review.featured ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'} />
                      </button>
                      <button
                        onClick={() => handleEdit(review)}
                        disabled={isSaving}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-blue-500"
                        aria-label="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(review._id)}
                        disabled={isSaving}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-red-500"
                        aria-label="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <StarRatingDisplay rating={review.rating} />
                  </div>

                  <div className="mb-2">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                      {review.projectType}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      Order: {review.order}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-3">
                    "{review.text}"
                  </p>

                  {review.websiteUrl && (
                    <a
                      href={review.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs text-blue-600 hover:underline dark:text-blue-400 mt-1"
                    >
                      View Website <ExternalLink className="ml-1" size={12} />
                    </a>
                  )}

                  <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 mt-2">
                    <Calendar size={12} />
                    <span>Added {formatDate(review.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewSection;