import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Eye, Trash2, Copy as CopyIcon, Grid, List, Loader2, Image, ExternalLink, Sparkles } from 'lucide-react';
import { Button, Input, Dropdown, Modal, Card, CardFooter, Badge, Textarea } from '@/components/ui';
import { useTour } from '@/context/TourContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui';
import { firestoreUtils } from '@/lib/firestore';
import { cn, formatRelativeTime } from '@/utils/helpers';
import type { Tour } from '@/types';

export function DashboardPage() {
  const { user } = useAuth();
  const { createTour, deleteTour, duplicateTour, publishTour, unpublishTour } = useTour();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title'>('updated');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTourId, setDeletingTourId] = useState<string | null>(null);

  // New tour creation modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const loadTours = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userTours = await firestoreUtils.getUserTours(user.id);
      setTours(userTours);
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to load tours' });
    } finally {
      setLoading(false);
    }
  }, [user, addToast]);

  useEffect(() => {
    loadTours();
  }, [loadTours]);

  const filteredTours = tours
    .filter((tour) =>
      tour.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tour.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'updated') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (sortBy === 'created') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return a.title.localeCompare(b.title);
    });

  const handleOpenCreateModal = () => {
    setNewTitle('');
    setNewDescription('');
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setCreating(true);
    try {
      const newTourId = await createTour(newTitle.trim(), newDescription.trim());
      addToast({ type: 'success', title: 'Tour Created', message: 'Now add your 360° scenes!' });
      setShowCreateModal(false);
      navigate(`/editor/${newTourId}`);
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Could not create tour.' });
    } finally {
      setCreating(false);
    }
  };

  const handleEditTour = (tour: Tour) => {
    navigate(`/editor/${tour.id}`);
  };

  const handlePreviewTour = (tour: Tour) => {
    window.open(`/tour/${tour.id}`, '_blank');
  };

  const handleCopyLink = (tour: Tour) => {
    const url = `${window.location.origin}/tour/${tour.id}`;
    navigator.clipboard.writeText(url);
    addToast({ type: 'success', title: 'Copied!', message: 'Tour link copied to clipboard' });
  };

  const handleDuplicateTour = async (tour: Tour) => {
    try {
      const newTourId = await duplicateTour(tour.id, `${tour.title} (Copy)`);
      addToast({ type: 'success', title: 'Duplicated', message: 'Tour duplicated successfully' });
      navigate(`/editor/${newTourId}`);
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to duplicate tour' });
    }
  };

  const handlePublishTour = async (tour: Tour) => {
    try {
      await publishTour(tour.id);
      setTours((prev) =>
        prev.map((t) => (t.id === tour.id ? { ...t, status: 'published', publishedAt: new Date() } : t))
      );
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to publish tour' });
    }
  };

  const handleUnpublishTour = async (tour: Tour) => {
    try {
      await unpublishTour(tour.id);
      setTours((prev) =>
        prev.map((t) => (t.id === tour.id ? { ...t, status: 'unpublished' } : t))
      );
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to unpublish tour' });
    }
  };

  const handleDeleteTour = async () => {
    if (!deletingTourId) return;
    try {
      await deleteTour(deletingTourId);
      setTours((prev) => prev.filter((t) => t.id !== deletingTourId));
      addToast({ type: 'success', title: 'Deleted', message: 'Tour deleted permanently' });
      setShowDeleteModal(false);
      setDeletingTourId(null);
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to delete tour' });
    }
  };

  const confirmDelete = (tour: Tour) => {
    setSelectedTour(tour);
    setDeletingTourId(tour.id);
    setShowDeleteModal(true);
  };

  const getStatusBadge = (status: Tour['status']) => {
    switch (status) {
      case 'published':
        return <Badge variant="success" dot>Published</Badge>;
      case 'unpublished':
        return <Badge variant="warning" dot>Unpublished</Badge>;
      case 'draft':
      default:
        return <Badge variant="outline" dot>Draft</Badge>;
    }
  };

  const getVisibilityBadge = (visibility: Tour['visibility']) => {
    switch (visibility) {
      case 'public':
        return <Badge variant="info" dot>Public</Badge>;
      case 'unlisted':
        return <Badge variant="default" dot>Unlisted</Badge>;
      case 'private':
      default:
        return <Badge variant="outline" dot>Private</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-dark-400 mt-1">Manage, edit, and share your 360° virtual tours</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleOpenCreateModal} leftIcon={<Plus className="h-5 w-5" />}>
            New Tour
          </Button>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex-1 max-w-md w-full">
          <Input
            placeholder="Search tours by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="h-5 w-5" />}
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Dropdown
            options={[
              { value: 'updated', label: 'Recently Updated' },
              { value: 'created', label: 'Recently Created' },
              { value: 'title', label: 'Title (A-Z)' },
            ]}
            value={sortBy}
            onChange={(val: any) => setSortBy(val)}
            placeholder="Sort by"
            className="w-48"
          />
          <div className="flex border border-dark-700 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2.5 transition-colors',
                viewMode === 'grid' ? 'bg-dark-700 text-white' : 'text-dark-400 hover:text-white'
              )}
              aria-label="Grid view"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2.5 transition-colors',
                viewMode === 'list' ? 'bg-dark-700 text-white' : 'text-dark-400 hover:text-white'
              )}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tours Grid/List */}
      {filteredTours.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="p-4 rounded-3xl bg-dark-800 text-dark-500 w-16 h-16 mx-auto flex items-center justify-center mb-4">
            <Image className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {searchQuery ? 'No tours found' : 'No tours yet'}
          </h3>
          <p className="text-dark-400 mb-6 max-w-md mx-auto text-sm">
            {searchQuery
              ? 'Try adjusting your search terms or filters'
              : 'Create your first 360° virtual tour or explore our pre-configured architecture demo.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={handleOpenCreateModal} leftIcon={<Plus className="h-5 w-5" />}>
              Create New Tour
            </Button>
          </div>
        </div>
      ) : (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTours.map((tour) => (
              <TourCard
                key={tour.id}
                tour={tour}
                onEdit={() => handleEditTour(tour)}
                onPreview={() => handlePreviewTour(tour)}
                onCopyLink={() => handleCopyLink(tour)}
                onDuplicate={() => handleDuplicateTour(tour)}
                onPublish={() => handlePublishTour(tour)}
                onUnpublish={() => handleUnpublishTour(tour)}
                onDelete={() => confirmDelete(tour)}
              />
            ))}
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-700 text-left text-sm font-medium text-dark-400">
                    <th className="p-4">Tour</th>
                    <th className="p-4 hidden md:table-cell">Status</th>
                    <th className="p-4 hidden lg:table-cell">Updated</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTours.map((tour) => (
                    <tr key={tour.id} className="border-b border-dark-700/50 hover:bg-dark-700/50 transition-colors">
                      <td className="p-4">
                        <Link to={`/editor/${tour.id}`} className="flex items-center gap-4">
                          {tour.coverImageUrl ? (
                            <img
                              src={tour.coverImageUrl}
                              alt={tour.title}
                              className="h-12 w-16 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="h-12 w-16 rounded-lg bg-dark-700 flex items-center justify-center">
                              <Image className="h-6 w-6 text-dark-500" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-white truncate">{tour.title}</p>
                            <p className="text-sm text-dark-500 truncate">{tour.description || 'No description'}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(tour.status)}
                          {getVisibilityBadge(tour.visibility)}
                        </div>
                      </td>
                      <td className="p-4 hidden lg:table-cell text-dark-400 text-sm">
                        {formatRelativeTime(tour.updatedAt)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handlePreviewTour(tour)} title="Preview in browser">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleCopyLink(tour)} title="Copy shareable link">
                            <CopyIcon className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditTour(tour)} title="Open in 360 Editor">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Create Tour Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Virtual Tour"
        description="Name your project to get started with the 360° Studio"
        size="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Tour Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Modern Architecture Pavilion"
            required
            autoFocus
          />

          <Textarea
            label="Description (Optional)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Brief description of the space, property, or venue..."
            rows={3}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-dark-800">
            <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={creating} leftIcon={<Plus className="h-4 w-4" />}>
              Create & Launch Studio
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeletingTourId(null); }}
        title="Delete Tour"
        description="This action cannot be undone."
      >
        <div className="space-y-4">
          <p className="text-dark-300">
            Are you sure you want to delete <strong className="text-white">{selectedTour?.title}</strong>?
            This will permanently remove the tour, all scenes, hotspots, and uploaded panoramas.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setShowDeleteModal(false); setDeletingTourId(null); }}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteTour}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function TourCard({
  tour,
  onEdit,
  onPreview,
  onCopyLink,
  onDuplicate,
  onPublish,
  onUnpublish,
  onDelete,
}: {
  tour: Tour;
  onEdit: () => void;
  onPreview: () => void;
  onCopyLink: () => void;
  onDuplicate: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
}) {
  const getStatusBadge = (status: Tour['status']) => {
    switch (status) {
      case 'published':
        return <Badge variant="success" dot size="sm">Published</Badge>;
      case 'unpublished':
        return <Badge variant="warning" dot size="sm">Unpublished</Badge>;
      case 'draft':
      default:
        return <Badge variant="outline" dot size="sm">Draft</Badge>;
    }
  };

  return (
    <Card className="h-full flex flex-col" hover>
      <div className="relative aspect-[16/9] rounded-xl overflow-hidden mb-4 bg-dark-800">
        {tour.coverImageUrl ? (
          <img
            src={tour.coverImageUrl}
            alt={tour.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Image className="h-12 w-12 text-dark-600" />
          </div>
        )}
        <div className="absolute top-3 right-3 flex gap-1">
          {getStatusBadge(tour.status)}
        </div>
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        <h3 className="font-semibold text-white truncate mb-1">{tour.title}</h3>
        <p className="text-sm text-dark-400 truncate mb-3">{tour.description || 'No description'}</p>
        <div className="flex items-center gap-4 text-xs text-dark-500 mb-4">
          <span>Updated {formatRelativeTime(tour.updatedAt)}</span>
        </div>
      </div>
      <CardFooter className="border-t border-dark-700/60 pt-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 w-full">
          <Button variant="ghost" size="sm" className="flex-1" onClick={onPreview}>
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button variant="ghost" size="sm" className="flex-1" onClick={onCopyLink}>
            <CopyIcon className="h-4 w-4 mr-1" />
            Copy
          </Button>
          <Button variant="ghost" size="sm" onClick={onEdit} title="Edit in Studio">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 w-full">
          <Button variant="ghost" size="sm" className="flex-1" onClick={onDuplicate}>
            Duplicate
          </Button>
          {tour.status === 'published' ? (
            <Button variant="ghost" size="sm" className="flex-1" onClick={onUnpublish}>
              Unpublish
            </Button>
          ) : (
            <Button variant="primary" size="sm" className="flex-1" onClick={onPublish}>
              Publish
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-400 hover:text-red-300">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}