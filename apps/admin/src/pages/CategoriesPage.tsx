import { useState } from 'react';
import type { FormEvent } from 'react';

import type { CategoryDto } from '@maison-elise/shared';

import { getErrorMessage } from '@/api/apiError';
import {
  useCreateCategoryMutation,
  useGetCategoriesQuery,
  useUpdateCategoryMutation,
} from '@/api/adminApi';
import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateMessage';

export function CategoriesPage() {
  const { data: categories = [], isLoading, isError } = useGetCategoriesQuery();
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [edits, setEdits] = useState<Record<string, { name: string; slug: string }>>({});

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      await createCategory({
        name: name.trim(),
        ...(slug.trim() ? { slug: slug.trim() } : {}),
      }).unwrap();
      setName('');
      setSlug('');
    } catch (createError) {
      setError(getErrorMessage(createError));
    }
  }

  async function handleSave(category: CategoryDto) {
    const edit = edits[category.id];

    if (!edit) {
      return;
    }

    setError(null);

    try {
      await updateCategory({
        id: category.id,
        body: { name: edit.name.trim(), ...(edit.slug.trim() ? { slug: edit.slug.trim() } : {}) },
      }).unwrap();
      setEdits((current) => {
        const next = { ...current };
        delete next[category.id];
        return next;
      });
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    }
  }

  return (
    <>
      <PageHeader
        title="Categories"
        description="Categories are never hard-deleted while products reference them."
      />

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <form className="toolbar" onSubmit={handleCreate}>
        <FormField label="New category name" htmlFor="category-name">
          <input
            id="category-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </FormField>
        <FormField label="Slug (optional)" htmlFor="category-slug">
          <input
            id="category-slug"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
          />
        </FormField>
        <Button type="submit" disabled={isCreating || name.trim() === ''}>
          {isCreating ? 'Creating…' : 'Add category'}
        </Button>
      </form>

      {isLoading ? (
        <LoadingState label="Loading categories…" />
      ) : isError ? (
        <ErrorState title="We couldn't load categories." description="Please try again." />
      ) : categories.length === 0 ? (
        <EmptyState title="No categories yet" />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => {
                const edit = edits[category.id] ?? { name: category.name, slug: category.slug };

                return (
                  <tr key={category.id}>
                    <td>
                      <input
                        aria-label={`Name for ${category.name}`}
                        value={edit.name}
                        onChange={(event) =>
                          setEdits((current) => ({
                            ...current,
                            [category.id]: { ...edit, name: event.target.value },
                          }))
                        }
                        style={{ width: '100%', padding: '0.35rem' }}
                      />
                    </td>
                    <td>
                      <input
                        aria-label={`Slug for ${category.name}`}
                        value={edit.slug}
                        onChange={(event) =>
                          setEdits((current) => ({
                            ...current,
                            [category.id]: { ...edit, slug: event.target.value },
                          }))
                        }
                        style={{ width: '100%', padding: '0.35rem' }}
                      />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Button
                        variant="secondary"
                        disabled={isUpdating || !edits[category.id]}
                        onClick={() => void handleSave(category)}
                      >
                        Save
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
