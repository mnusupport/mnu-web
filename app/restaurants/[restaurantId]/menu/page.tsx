'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { menuApi, resolveImageUrl, type CategoryRecord, type Membership, type MenuItemRecord } from '@/lib/api';
import { useRestaurantContext } from '../restaurant-context';

const MANAGE_ROLES: Membership['role'][] = ['SUPER_ADMIN', 'RESTAURANT_ADMIN'];
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return 'Please choose a JPEG, PNG, or WebP image.';
  if (file.size > MAX_IMAGE_BYTES) return 'Image must be 5MB or smaller.';
  return null;
}

export default function RestaurantMenuPage() {
  const params = useParams<{ restaurantId: string }>();
  const restaurantId = params.restaurantId;
  const { membership } = useRestaurantContext();
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const canManage = !!membership && MANAGE_ROLES.includes(membership.role);

  useEffect(() => {
    menuApi.getMenu(restaurantId).then(setCategories)
      .catch((err) => setError(err instanceof Error ? err.message : 'We could not load the menu.'))
      .finally(() => setLoading(false));
  }, [restaurantId]);

  const refreshMenu = async () => setCategories(await menuApi.getMenu(restaurantId));

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories
      .filter((category) => activeCategory === 'ALL' || category.id === activeCategory)
      .map((category) => ({
        ...category,
        items: q ? category.items.filter((item) => `${item.name} ${item.description ?? ''} ${category.name}`.toLowerCase().includes(q)) : category.items,
      }))
      .filter((category) => !q || category.items.length > 0 || category.name.toLowerCase().includes(q));
  }, [categories, query, activeCategory]);

  const totalItems = categories.reduce((sum, category) => sum + category.items.length, 0);

  if (loading) return <div className="mnu-admin-skeleton-page"><div className="mnu-admin-skeleton-line wide" /><div className="mnu-admin-skeleton-line" /><div className="mnu-admin-skeleton-panel" /></div>;
  if (error) return <div className="mnu-admin-state" style={{ minHeight: '55vh' }}><div className="mnu-admin-state-icon">!</div><p>{error}</p></div>;

  return (
    <div>
      <div className="mnu-admin-pagehead">
        <div>
          <p className="mnu-admin-eyebrow">Menu management</p>
          <h2 className="mnu-admin-page-title">Your menu</h2>
          <p className="mnu-admin-page-subtitle">Manage dishes, availability and featured items for {membership?.restaurant_name}.</p>
        </div>
        {canManage && <button className="mnu-admin-primary" onClick={() => document.getElementById('new-category')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}><PlusIcon /> Add category</button>}
      </div>

      <div className="mnu-admin-toolbar">
        <label className="mnu-admin-search" aria-label="Search menu items">
          <SearchIcon />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search menu items, categories or descriptions…" />
          {query && <button type="button" className="mnu-admin-search-clear" onClick={() => setQuery('')} aria-label="Clear search">×</button>}
        </label>
        <div className="mnu-admin-menu-summary"><strong>{totalItems}</strong> items · <strong>{categories.length}</strong> categories</div>
      </div>

      {categories.length > 0 && (
        <div className="mnu-admin-menu-nav">
          <div className="mnu-admin-chipbar">
            <button className={`mnu-admin-chip ${activeCategory === 'ALL' ? 'is-active' : ''}`} onClick={() => setActiveCategory('ALL')}>All <span>{totalItems}</span></button>
            {categories.map((category) => <button key={category.id} className={`mnu-admin-chip ${activeCategory === category.id ? 'is-active' : ''}`} onClick={() => setActiveCategory(category.id)}>{category.name} <span>{category.items.length}</span></button>)}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {filteredCategories.map((category) => <CategoryCard key={category.id} restaurantId={restaurantId} category={category} canManage={canManage} onChanged={refreshMenu} />)}
      </div>

      {filteredCategories.length === 0 && (
        <div className="mnu-admin-empty mt-4">
          <div className="mnu-admin-empty-mark"><SearchIcon /></div>
          <p className="mnu-admin-empty-title">{query ? 'No menu items match your search' : 'No menu items yet'}</p>
          <p className="mnu-admin-empty-text">{query ? 'Try a different item name, category or description.' : 'Add your first category and menu item to start building the restaurant menu.'}</p>
          {query && <button className="mnu-admin-secondary mt-4" onClick={() => setQuery('')}>Clear search</button>}
        </div>
      )}

      {canManage && <div id="new-category" className="mt-5"><AddCategoryForm restaurantId={restaurantId} onCreated={refreshMenu} /></div>}
    </div>
  );
}

function CategoryCard({ restaurantId, category, canManage, onChanged }: { restaurantId: string; category: CategoryRecord; canManage: boolean; onChanged: () => Promise<void> }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveName = async () => {
    if (!name.trim()) return;
    setBusy(true); setError(null);
    try { await menuApi.updateCategory(restaurantId, category.id, { name }); setIsEditing(false); await onChanged(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to rename category.'); }
    finally { setBusy(false); }
  };
  const deleteCategory = async () => {
    if (!confirm(`Delete "${category.name}" and all its items?`)) return;
    setBusy(true); setError(null);
    try { await menuApi.deleteCategory(restaurantId, category.id); await onChanged(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to delete category.'); setBusy(false); }
  };

  return (
    <section className="mnu-admin-panel overflow-hidden">
      <div className="mnu-admin-panel-header">
        <div className="min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2"><input value={name} onChange={(e) => setName(e.target.value)} className="mnu-admin-inline-input" autoFocus /><button className="mnu-admin-action brand" onClick={saveName} disabled={busy}>Save</button><button className="mnu-admin-action" onClick={() => { setName(category.name); setIsEditing(false); }}>Cancel</button></div>
          ) : (
            <><p className="mnu-admin-panel-title">{category.name}</p><p className="mnu-admin-panel-hint">{category.items.length} menu item{category.items.length === 1 ? '' : 's'}</p></>
          )}
        </div>
        {canManage && !isEditing && <div className="flex items-center gap-4"><button className="mnu-admin-action" onClick={() => setIsEditing(true)}>Rename</button><button className="mnu-admin-action danger" onClick={deleteCategory} disabled={busy}>Delete</button></div>}
      </div>
      {error && <p className="px-4 pt-3 text-xs text-red-600">{error}</p>}
      {category.items.length > 0 && <div className="mnu-admin-tablehead"><span>Photo</span><span>Item</span><span>Category</span><span>Price</span><span className="text-right">Status & actions</span></div>}
      <div>
        {category.items.map((item) => <ItemRow key={item.id} restaurantId={restaurantId} item={item} categoryName={category.name} canManage={canManage} onChanged={onChanged} />)}
      </div>
      {category.items.length === 0 && <div className="px-4 py-5 text-xs text-ink-400">No items in this category yet.</div>}
      {canManage && (isAddingItem ? <div className="border-t border-ink-100 p-4"><AddItemForm restaurantId={restaurantId} categoryId={category.id} onDone={async () => { setIsAddingItem(false); await onChanged(); }} onCancel={() => setIsAddingItem(false)} /></div> : <div className="border-t border-ink-100 px-4 py-3"><button className="mnu-admin-action brand" onClick={() => setIsAddingItem(true)}><PlusIcon /> Add item to {category.name}</button></div>)}
    </section>
  );
}

function ItemRow({ restaurantId, item, categoryName, canManage, onChanged }: { restaurantId: string; item: MenuItemRecord; categoryName: string; canManage: boolean; onChanged: () => Promise<void> }) {
  const [isEditing, setIsEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toggleAvailability = async () => { setBusy(true); setError(null); try { await menuApi.setAvailability(restaurantId, item.id, !item.isAvailable); await onChanged(); } catch (err) { setError(err instanceof Error ? err.message : 'Failed to update availability.'); } finally { setBusy(false); } };
  const toggleFeatured = async () => { setBusy(true); setError(null); try { await menuApi.setFeatured(restaurantId, item.id, !item.isFeatured); await onChanged(); } catch (err) { setError(err instanceof Error ? err.message : 'Failed to update featured status.'); } finally { setBusy(false); } };
  const deleteItem = async () => { if (!confirm(`Delete "${item.name}"?`)) return; setBusy(true); setError(null); try { await menuApi.deleteMenuItem(restaurantId, item.id); await onChanged(); } catch (err) { setError(err instanceof Error ? err.message : 'Failed to delete item.'); setBusy(false); } };

  if (isEditing) return <div className="border-b border-ink-100 p-4"><EditItemForm restaurantId={restaurantId} item={item} onDone={async () => { setIsEditing(false); await onChanged(); }} onCancel={() => setIsEditing(false)} /></div>;
  const image = resolveImageUrl(item.imageUrl);
  return (
    <div className="mnu-admin-itemrow">
      <div className="mnu-admin-itemthumb">{image ? <img src={image} alt="" /> : <div className="mnu-admin-thumb-fallback"><PlateIcon /></div>}</div>
      <div className="min-w-0">
        <p className={`mnu-admin-itemname ${!item.isAvailable ? 'line-through text-ink-400' : ''}`}>{item.name}</p>
        <p className="mnu-admin-itemdesc">{error || item.description || 'No description added'}</p>
        {item.isFeatured && <span className="mnu-admin-featured">Featured</span>}
      </div>
      <div className="mnu-admin-category-cell">{categoryName}</div>
      <div className="mnu-admin-price">₹{item.price}</div>
      <div className="mnu-admin-actions">
        <span className={`mnu-admin-status ${item.isAvailable ? 'is-live' : 'is-off'}`}>{item.isAvailable ? 'Available' : 'Unavailable'}</span>
        {canManage && <><button className={`mnu-admin-action ${item.isFeatured ? 'brand' : ''}`} onClick={toggleFeatured} disabled={busy}>{item.isFeatured ? 'Unfeature' : 'Feature'}</button><button className="mnu-admin-action" onClick={() => setIsEditing(true)}>Edit</button><button className="mnu-admin-action danger" onClick={deleteItem} disabled={busy}>Delete</button></>}
        {canManage && <button className="mnu-admin-action" onClick={toggleAvailability} disabled={busy}>{item.isAvailable ? 'Mark unavailable' : 'Restore'}</button>}
      </div>
    </div>
  );
}

function SearchIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>; }
function PlusIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>; }
function PlateIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="7"/><path d="M5 12h14M12 5c2 2 2 12 0 14M12 5c-2 2-2 12 0 14"/></svg>; }

function AddCategoryForm({
  restaurantId,
  onCreated,
}: {
  restaurantId: string;
  onCreated: () => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await menuApi.createCategory(restaurantId, { name });
      setName('');
      await onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-dashed border-ink-200 p-4">
      <p className="mb-2 text-sm font-semibold text-ink-700">Add a category</p>
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Starters"
          className="flex-1 rounded-xl border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </form>
  );
}

function AddItemForm({
  restaurantId,
  categoryId,
  onDone,
  onCancel,
}: {
  restaurantId: string;
  categoryId: string;
  onDone: () => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Revokes the previous object URL whenever it's replaced or the form
  // unmounts — otherwise each picked file leaks its blob URL.
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setError(null);
    if (!file) return;
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      e.target.value = '';
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = Number(price);
    if (!name.trim() || Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Enter a name and a valid, non-negative price.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // Image upload needs a real item id, so it always happens as a
      // second step after creation — an item without a picked image
      // still creates in one step, exactly as before.
      const created = await menuApi.createMenuItem(restaurantId, {
        categoryId,
        name,
        description: description || undefined,
        price: parsedPrice,
      });
      if (imageFile) {
        try {
          await menuApi.uploadItemImage(restaurantId, created.id, imageFile);
        } catch (imgErr) {
          // The item itself was created successfully — don't lose that
          // by throwing here. Surface the image failure and still
          // refresh the list; the admin can retry the image via Edit.
          setError(
            `Item added, but the image failed to upload: ${
              imgErr instanceof Error ? imgErr.message : 'unknown error'
            }`,
          );
          await onDone();
          setBusy(false);
          return;
        }
      }
      await onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item.');
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-3 space-y-2 rounded-xl bg-cream-100 p-3">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Item name"
        className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
        autoFocus
      />
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
      />
      <input
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Price (₹)"
        inputMode="decimal"
        className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
      />

      <div className="flex items-center gap-3">
        {imagePreview ? (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-ink-200">
            <img src={imagePreview} alt="Selected item" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={clearImage}
              aria-label="Remove selected image"
              className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-ink-200 text-ink-300">
            <span className="text-lg">🍽</span>
          </div>
        )}
        <label className="text-xs font-semibold text-brand-600">
          {imagePreview ? 'Change photo' : 'Add photo (optional)'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          Add item
        </button>
        <button type="button" onClick={onCancel} className="text-xs font-semibold text-ink-400">
          Cancel
        </button>
      </div>
    </form>
  );
}

function EditItemForm({
  restaurantId,
  item,
  onDone,
  onCancel,
}: {
  restaurantId: string;
  item: MenuItemRecord;
  onDone: () => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description ?? '');
  const [price, setPrice] = useState(String(item.price));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removingImage, setRemovingImage] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setError(null);
    if (!file) return;
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      e.target.value = '';
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // Removing the current image is its own immediate action, not staged
  // for "Save" — there's no ambiguity to defer (nothing else to
  // combine it with), and it means a mistaken tap on "Remove" is
  // reflected right away rather than sitting silently until Save.
  const removeCurrentImage = async () => {
    if (!confirm('Remove this item\u2019s photo?')) return;
    setRemovingImage(true);
    setError(null);
    try {
      await menuApi.removeItemImage(restaurantId, item.id);
      await onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove image.');
      setRemovingImage(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = Number(price);
    if (!name.trim() || Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Enter a name and a valid, non-negative price.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await menuApi.updateMenuItem(restaurantId, item.id, {
        name,
        description: description || undefined,
        price: parsedPrice,
      });
      if (imageFile) {
        try {
          await menuApi.uploadItemImage(restaurantId, item.id, imageFile);
        } catch (imgErr) {
          setError(
            `Item saved, but the new image failed to upload: ${
              imgErr instanceof Error ? imgErr.message : 'unknown error'
            }`,
          );
          await onDone();
          setBusy(false);
          return;
        }
      }
      await onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item.');
      setBusy(false);
    }
  };

  const currentImageUrl = resolveImageUrl(item.imageUrl);

  return (
    <form onSubmit={submit} className="space-y-2 rounded-xl bg-cream-100 p-3">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
        autoFocus
      />
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
      />
      <input
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        inputMode="decimal"
        className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
      />

      <div className="flex items-center gap-3">
        {/* A newly-picked file's local preview always wins over the
            saved image while one is staged — it's what Save is about
            to upload. */}
        {imagePreview || currentImageUrl ? (
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-ink-200">
            <img src={imagePreview ?? currentImageUrl ?? ''} alt={item.name} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-ink-200 text-ink-300">
            <span className="text-lg">🍽</span>
          </div>
        )}

        <div className="flex flex-col items-start gap-1">
          <label className="text-xs font-semibold text-brand-600">
            {currentImageUrl || imagePreview ? 'Replace photo' : 'Add photo (optional)'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          {currentImageUrl && !imagePreview && (
            <button
              type="button"
              onClick={removeCurrentImage}
              disabled={removingImage}
              className="text-xs font-semibold text-red-500 disabled:opacity-50"
            >
              {removingImage ? 'Removing…' : 'Remove photo'}
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          Save
        </button>
        <button type="button" onClick={onCancel} className="text-xs font-semibold text-ink-400">
          Cancel
        </button>
      </div>
    </form>
  );
}
