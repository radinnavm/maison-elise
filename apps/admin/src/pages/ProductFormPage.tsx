import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router';

import type { CategoryDto, ProductDto, ProductStatus } from '@maison-elise/shared';

import { getErrorMessage } from '@/api/apiError';
import {
  useCreateProductMutation,
  useGetCategoriesQuery,
  useGetProductQuery,
  useUpdateProductMutation,
} from '@/api/adminApi';
import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { PageHeader } from '@/components/PageHeader';
import { LoadingState } from '@/components/StateMessage';

interface VariantRow {
  sku: string;
  size: string;
  color: string;
  stockQuantity: string;
  price: string;
}

export function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const { data: categories = [], isLoading: isLoadingCategories } = useGetCategoriesQuery();
  const { data: productData, isLoading: isLoadingProduct } = useGetProductQuery(id ?? '', {
    skip: !isEdit,
  });

  if (isLoadingCategories || (isEdit && isLoadingProduct)) {
    return <LoadingState label="Loading product…" />;
  }

  const product = productData?.data;

  return (
    <ProductForm
      key={product?.id ?? 'new'}
      product={product}
      categories={categories}
      isEdit={isEdit}
    />
  );
}

interface ProductFormProps {
  product?: ProductDto;
  categories: CategoryDto[];
  isEdit: boolean;
}

function ProductForm({ product, categories, isEdit }: ProductFormProps) {
  const navigate = useNavigate();
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(product?.name ?? '');
  const [slug, setSlug] = useState(product?.slug ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [categoryId, setCategoryId] = useState(product?.category.id ?? categories[0]?.id ?? '');
  const [basePrice, setBasePrice] = useState(product ? String(product.price) : '');
  const [currency, setCurrency] = useState(product?.currency ?? 'EUR');
  const [status, setStatus] = useState<ProductStatus>(product?.status ?? 'DRAFT');
  const [isNew, setIsNew] = useState(product?.isNew ?? false);
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [imagesText, setImagesText] = useState(
    product ? product.images.map((image) => image.url).join('\n') : '',
  );
  const [variants, setVariants] = useState<VariantRow[]>(
    product
      ? product.variants.map((variant) => ({
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
          stockQuantity: String(variant.stockQuantity),
          price: String(variant.price),
        }))
      : [],
  );

  const isSubmitting = isCreating || isUpdating;

  function updateVariant(index: number, patch: Partial<VariantRow>) {
    setVariants((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)),
    );
  }

  function addVariant() {
    setVariants((current) => [
      ...current,
      { sku: '', size: '', color: '', stockQuantity: '0', price: basePrice || '0' },
    ]);
  }

  function removeVariant(index: number) {
    setVariants((current) => current.filter((_, rowIndex) => rowIndex !== index));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const payload = {
      name: name.trim(),
      ...(slug.trim() ? { slug: slug.trim() } : {}),
      description: description.trim(),
      categoryId,
      basePrice: Number(basePrice),
      currency,
      status,
      isNew,
      isFeatured,
      images: imagesText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((url, index) => ({ url, alt: name.trim(), sortOrder: index })),
      variants: variants.map((variant) => ({
        sku: variant.sku.trim(),
        size: variant.size.trim(),
        color: variant.color.trim(),
        stockQuantity: Number(variant.stockQuantity || '0'),
        price: Number(variant.price || basePrice || '0'),
      })),
    };

    try {
      if (isEdit && product) {
        await updateProduct({ id: product.id, body: payload }).unwrap();
      } else {
        await createProduct(payload).unwrap();
      }

      navigate('/products');
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    }
  }

  return (
    <>
      <PageHeader
        title={isEdit ? `Edit ${product?.name ?? 'product'}` : 'New product'}
        description="Product details, imagery and variants."
      />

      <form onSubmit={handleSubmit} noValidate>
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="form-grid">
          <FormField label="Name" htmlFor="product-name">
            <input
              id="product-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </FormField>

          <FormField label="Slug" htmlFor="product-slug" error={undefined}>
            <input
              id="product-slug"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="auto-generated from name"
            />
          </FormField>

          <FormField label="Category" htmlFor="product-category">
            <select
              id="product-category"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Base price" htmlFor="product-price">
            <input
              id="product-price"
              type="number"
              min={0}
              step="0.01"
              value={basePrice}
              onChange={(event) => setBasePrice(event.target.value)}
              required
            />
          </FormField>

          <FormField label="Currency" htmlFor="product-currency">
            <input
              id="product-currency"
              value={currency}
              onChange={(event) => setCurrency(event.target.value.toUpperCase())}
              maxLength={3}
            />
          </FormField>

          <FormField label="Status" htmlFor="product-status">
            <select
              id="product-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as ProductStatus)}
            >
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </FormField>
        </div>

        <div className="form-grid" style={{ marginTop: '1rem' }}>
          <FormField label="Description" htmlFor="product-description">
            <textarea
              id="product-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
            />
          </FormField>

          <FormField label="Image URLs (one per line)" htmlFor="product-images">
            <textarea
              id="product-images"
              value={imagesText}
              onChange={(event) => setImagesText(event.target.value)}
              placeholder="/static/products/example-1.svg"
            />
          </FormField>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem' }}>
          <label
            className="field"
            style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}
          >
            <input
              type="checkbox"
              checked={isNew}
              onChange={(event) => setIsNew(event.target.checked)}
            />
            New arrival
          </label>
          <label
            className="field"
            style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}
          >
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(event) => setIsFeatured(event.target.checked)}
            />
            Featured
          </label>
        </div>

        <div className="section">
          <h2>Variants</h2>

          {variants.map((variant, index) => (
            <div className="variant-row" key={index}>
              <input
                aria-label={`Variant ${index + 1} SKU`}
                placeholder="SKU"
                value={variant.sku}
                onChange={(event) => updateVariant(index, { sku: event.target.value })}
              />
              <input
                aria-label={`Variant ${index + 1} size`}
                placeholder="Size"
                value={variant.size}
                onChange={(event) => updateVariant(index, { size: event.target.value })}
              />
              <input
                aria-label={`Variant ${index + 1} colour`}
                placeholder="Colour"
                value={variant.color}
                onChange={(event) => updateVariant(index, { color: event.target.value })}
              />
              <input
                aria-label={`Variant ${index + 1} stock`}
                type="number"
                min={0}
                value={variant.stockQuantity}
                onChange={(event) => updateVariant(index, { stockQuantity: event.target.value })}
              />
              <input
                aria-label={`Variant ${index + 1} price`}
                type="number"
                min={0}
                step="0.01"
                value={variant.price}
                onChange={(event) => updateVariant(index, { price: event.target.value })}
              />
              <Button variant="secondary" onClick={() => removeVariant(index)}>
                Remove
              </Button>
            </div>
          ))}

          <Button variant="secondary" onClick={addVariant}>
            Add variant
          </Button>
        </div>

        <div className="form-actions">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
          </Button>
          <Button variant="secondary" onClick={() => navigate('/products')} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      </form>
    </>
  );
}
