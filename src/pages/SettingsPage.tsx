import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast, Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Avatar, Badge } from '@/components/ui';
import { User, Shield, Palette, Database, Save, CheckCircle2, Sliders, RefreshCw } from 'lucide-react';

export function SettingsPage() {
  const { user, updateProfile, signOut } = useAuth();
  const { addToast } = useToast();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [isSaving, setIsSaving] = useState(false);

  // Tour default preferences
  const [defaultBrandName, setDefaultBrandName] = useState(() => localStorage.getItem('panotour_default_brand') || 'PanoTour Studio');
  const [defaultHotspotColor, setDefaultHotspotColor] = useState(() => localStorage.getItem('panotour_default_color') || '#22c55e');
  const [defaultAutoRotate, setDefaultAutoRotate] = useState(() => localStorage.getItem('panotour_default_autorotate') === 'true');

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      setPhotoURL(user.photoURL || '');
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        displayName,
        photoURL: photoURL || null,
      });
      addToast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your profile changes have been saved.',
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Could not save profile changes.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTourDefaults = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('panotour_default_brand', defaultBrandName);
    localStorage.setItem('panotour_default_color', defaultHotspotColor);
    localStorage.setItem('panotour_default_autorotate', String(defaultAutoRotate));
    addToast({
      type: 'success',
      title: 'Defaults Saved',
      message: 'Default tour settings updated successfully.',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-dark-400 mt-1">Manage your account preferences and default tour configurations</p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary-500/10 text-primary-400">
              <User className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Account Profile</CardTitle>
              <CardDescription>Update your personal information and avatar</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="flex items-center gap-5 pb-6 border-b border-dark-800">
              <Avatar
                src={photoURL || undefined}
                name={displayName || 'User'}
                size="lg"
                className="ring-2 ring-primary-500/20"
              />
              <div className="space-y-1">
                <p className="text-sm font-medium text-white">{displayName || 'Unnamed User'}</p>
                <p className="text-xs text-dark-400">{email || 'No email attached'}</p>
                <div className="flex items-center gap-2 pt-1">
                  <Badge variant="success" dot size="sm">Active Account</Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your full name or studio"
              />
              <Input
                label="Email Address"
                value={email}
                disabled
                hint="Contact support to change your account email"
              />
            </div>

            <Input
              label="Avatar Image URL"
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              hint="Enter a direct image link or leave empty to use your initials"
            />

            <div className="flex justify-end">
              <Button type="submit" loading={isSaving} leftIcon={<Save className="h-4 w-4" />}>
                Save Profile Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tour Preferences Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Tour Defaults & Branding</CardTitle>
              <CardDescription>Default appearance settings applied to newly created virtual tours</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveTourDefaults} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Default Brand Name"
                value={defaultBrandName}
                onChange={(e) => setDefaultBrandName(e.target.value)}
                placeholder="e.g. Luxury Real Estate 360"
              />
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">
                  Default Hotspot Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={defaultHotspotColor}
                    onChange={(e) => setDefaultHotspotColor(e.target.value)}
                    className="h-10 w-16 rounded-lg bg-dark-900 border border-dark-700 cursor-pointer p-1"
                  />
                  <span className="font-mono text-sm text-dark-300">{defaultHotspotColor}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-dark-900/60 border border-dark-800">
              <div className="space-y-0.5">
                <span className="text-sm font-medium text-white">Default Auto-rotation</span>
                <p className="text-xs text-dark-400">Automatically rotate 360 viewer camera when scenes load</p>
              </div>
              <input
                type="checkbox"
                checked={defaultAutoRotate}
                onChange={(e) => setDefaultAutoRotate(e.target.checked)}
                className="h-5 w-5 rounded border-dark-700 text-primary-500 focus:ring-primary-500 focus:ring-offset-dark-900"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" variant="secondary" leftIcon={<Sliders className="h-4 w-4" />}>
                Save Tour Defaults
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Cloud & Local Storage Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Storage & Cloud Connectivity</CardTitle>
              <CardDescription>Status of Firebase Firestore & Storage services</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-dark-900/80 border border-dark-800">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <p className="text-sm font-medium text-white">Hybrid Cloud & Local Engine</p>
                <p className="text-xs text-dark-400">Equirectangular panoramic engine with instant local fallback</p>
              </div>
            </div>
            <Badge variant="outline" size="sm">Vite 8 + Photo Sphere Viewer 4</Badge>
          </div>

          <div className="p-4 rounded-xl bg-dark-900/40 border border-dark-800 text-xs text-dark-400 space-y-2">
            <p className="text-dark-300 font-medium">Equirectangular 360 Photo Recommendations:</p>
            <ul className="list-disc list-inside space-y-1 text-dark-400">
              <li>Use 2:1 aspect ratio images (e.g. 4096x2048, 6000x3000, 8192x4096).</li>
              <li>Exported formats: JPEG or WebP up to 50MB for optimal web rendering.</li>
              <li>Hotspots support bidirectional scene teleportation and rich informative popups.</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t border-dark-800 pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              window.location.reload();
            }}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Refresh App Cache
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={signOut}
          >
            Sign Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
