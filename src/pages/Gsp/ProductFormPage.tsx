import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import toast from 'react-hot-toast';
import { extractApiError } from '../../utils/apiError';
import { formatCurrency, generateSku, slugify, toNumber } from '../../utils/format';
import { productsService } from '../../services/productsService';
import { brandsService } from '../../services/brandsService';
import { categoriesService } from '../../services/categoriesService';
import type { Brand, Category, CreateProductDto, Product, ProductImage, UpdateProductDto } from '../../types';
import PageBreadCrumb from '../../components/common/PageBreadCrumb';
import PageMeta from '../../components/common/PageMeta';
import FormSection from '../../components/crud/FormSection';
import {
  FormAlert,
  SelectField,
  TextAreaField,
  TextField,
  ToggleField,
} from '../../components/crud/FormControls';
import TagsInput from '../../components/crud/TagsInput';
import ImageDropzone from '../../components/crud/ImageDropzone';
import Button from '../../components/ui/button/Button';

const MAX_IMAGES = 5;
const OPTIONS_LIMIT = 100;
const LIST_PATH = '/gsp/productos';

interface ProductForm {
  name: string;
  description: string;
  slug: string;
  model: string;
  sku: string;
  codigoBarra: string;
  warranty: string;
  datasheetUrl: string;
  stock: string;
  originalPrice: string;
  discountPercentage: string;
  discountCash: string;
  includes: string[];
  connections: string[];
  specifications: string[];
  isFeatured: boolean;
  isBestSeller: boolean;
  isActive: boolean;
  brandId: string;
  /** Categoría raíz seleccionada. Si no tiene subcategorías, es la categoría final del producto. */
  categoryParentId: string;
  /** Subcategoría seleccionada (solo aplica si la categoría raíz tiene hijas). */
  categorySubId: string;
  images: File[];
}

const emptyForm: ProductForm = {
  name: '',
  description: '',
  slug: '',
  model: '',
  sku: '',
  codigoBarra: '',
  warranty: '',
  datasheetUrl: '',
  stock: '0',
  originalPrice: '',
  discountPercentage: '0',
  discountCash: '0',
  includes: [],
  connections: [],
  specifications: [],
  isFeatured: false,
  isBestSeller: false,
  isActive: true,
  brandId: '',
  categoryParentId: '',
  categorySubId: '',
  images: [],
};

const toFormState = (product: Product): ProductForm => ({
  name: product.name,
  description: product.description,
  slug: product.slug,
  model: product.model,
  sku: product.sku,
  codigoBarra: product.codigoBarra ?? '',
  warranty: product.warranty ?? '',
  datasheetUrl: product.datasheetUrl ?? '',
  stock: String(product.stock ?? 0),
  originalPrice: String(toNumber(product.originalPrice)),
  discountPercentage: String(toNumber(product.discountPercentage)),
  discountCash: String(toNumber(product.discountCash)),
  includes: product.includes ?? [],
  connections: product.connections ?? [],
  specifications: product.specifications ?? [],
  isFeatured: product.isFeatured,
  isBestSeller: product.isBestSeller,
  isActive: product.isActive,
  brandId: product.brand ? String(product.brand.id) : '',
  // Si la categoría del producto tiene padre, es una subcategoría: preseleccionamos ambos niveles.
  categoryParentId: product.category
    ? String(product.category.parent?.id ?? product.category.id)
    : '',
  categorySubId: product.category?.parent ? String(product.category.id) : '',
  images: [],
});

export default function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditing = !!id;

  // El listado navega pasando el producto para evitar una llamada extra y porque el
  // detalle de la API puede devolver `images` vacío.
  const productFromState = (location.state as { product?: Product } | null)?.product ?? null;

  const [product, setProduct] = useState<Product | null>(productFromState);
  const [form, setForm] = useState<ProductForm>(() =>
    productFromState ? toFormState(productFromState) : { ...emptyForm, sku: generateSku() }
  );
  const [loadingProduct, setLoadingProduct] = useState(isEditing && !productFromState);
  const [loadError, setLoadError] = useState<string | null>(null);

  // El slug se genera solo (como en la API) mientras no se edite manualmente. Al editar un producto
  // existente arranca "bloqueado" para no reescribir un slug ya publicado por cambiar el nombre;
  // si el usuario lo vacía, se vuelve a generar automáticamente desde el nombre.
  const [slugEdited, setSlugEdited] = useState(isEditing);

  useEffect(() => {
    if (slugEdited) return;
    setForm((prev) => ({ ...prev, slug: slugify(prev.name) }));
  }, [form.name, slugEdited]);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Orden editable de las imágenes ya guardadas (se reordenan sin volver a subirlas a AWS).
  const [existingImages, setExistingImages] = useState<ProductImage[]>(
    productFromState?.images ? [...productFromState.images].sort((a, b) => a.order - b.order) : []
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOptions = useCallback(async () => {
    const [brandsResult, categoriesResult] = await Promise.allSettled([
      brandsService.getAll({ limit: OPTIONS_LIMIT }),
      categoriesService.getAll({ limit: OPTIONS_LIMIT }),
    ]);
    if (brandsResult.status === 'fulfilled') setBrands(brandsResult.value.data);
    if (categoriesResult.status === 'fulfilled') setCategories(categoriesResult.value.data);
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  useEffect(() => {
    if (!isEditing || productFromState || !id) return;
    let cancelled = false;

    (async () => {
      setLoadingProduct(true);
      setLoadError(null);
      try {
        const data = await productsService.getOne(id);
        if (cancelled) return;
        setProduct(data);
        setForm(toFormState(data));
        setExistingImages([...(data.images ?? [])].sort((a, b) => a.order - b.order));
      } catch (err) {
        if (!cancelled) setLoadError(extractApiError(err) ?? 'No se encontró el producto.');
      } finally {
        if (!cancelled) setLoadingProduct(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, isEditing, productFromState]);

  const update = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const moveExistingImage = (from: number, to: number) => {
    if (to < 0 || to >= existingImages.length) return;
    setExistingImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const removeExistingImage = (imageId: number) =>
    setExistingImages((prev) => prev.filter((image) => image.id !== imageId));

  const brandOptions = useMemo(
    () => brands.map((brand) => ({ value: String(brand.id), label: brand.name })),
    [brands]
  );

  // La categoría de un producto puede ser una raíz o una subcategoría (hija). El listado por
  // defecto trae `parent` en cada item, con eso armamos el árbol de 2 niveles en el cliente.
  const rootCategories = useMemo(
    () => categories.filter((category) => !category.parent),
    [categories]
  );

  const childrenByParentId = useMemo(() => {
    const map = new Map<number, Category[]>();
    categories.forEach((category) => {
      if (!category.parent) return;
      const siblings = map.get(category.parent.id) ?? [];
      siblings.push(category);
      map.set(category.parent.id, siblings);
    });
    return map;
  }, [categories]);

  const categoryParentOptions = useMemo(
    () => rootCategories.map((category) => ({ value: String(category.id), label: category.name })),
    [rootCategories]
  );

  const subCategories = useMemo(
    () => childrenByParentId.get(Number(form.categoryParentId)) ?? [],
    [childrenByParentId, form.categoryParentId]
  );

  const categorySubOptions = useMemo(
    () => subCategories.map((category) => ({ value: String(category.id), label: category.name })),
    [subCategories]
  );

  // Si la categoría raíz seleccionada tiene subcategorías, la categoría final del producto es la
  // subcategoría; de lo contrario, la propia raíz.
  const categoryId = subCategories.length > 0 ? form.categorySubId : form.categoryParentId;

  const handleParentCategoryChange = (value: string) =>
    setForm((prev) => ({ ...prev, categoryParentId: value, categorySubId: '' }));

  const originalPrice = toNumber(form.originalPrice);
  const discountPercentage = toNumber(form.discountPercentage);
  const discountCash = toNumber(form.discountCash);
  const finalPrice = Math.max(
    0,
    Number((originalPrice - (originalPrice * discountPercentage) / 100 - discountCash).toFixed(2))
  );

  const validate = (): string | null => {
    if (form.name.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres.';
    if (form.description.trim().length < 2)
      return 'La descripción debe tener al menos 2 caracteres.';
    if (form.model.trim().length < 2) return 'El modelo debe tener al menos 2 caracteres.';
    if (form.slug.trim() && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim()))
      return 'El slug solo puede contener minúsculas, números y guiones.';
    if (form.sku.trim() && !/^[A-Za-z0-9]+(?:[-_][A-Za-z0-9]+)*$/.test(form.sku.trim()))
      return 'El SKU solo puede contener letras, números, guiones y guiones bajos.';
    if (form.codigoBarra.trim() && form.codigoBarra.trim().length < 2)
      return 'El código de barra debe tener al menos 2 caracteres.';
    if (form.warranty.trim() && form.warranty.trim().length < 2)
      return 'La garantía debe tener al menos 2 caracteres.';
    if (form.datasheetUrl.trim()) {
      try {
        const url = new URL(form.datasheetUrl.trim());
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error('protocolo inválido');
      } catch {
        return 'La URL de la ficha técnica debe ser válida (http o https).';
      }
    }
    if (!form.brandId) return 'Debes seleccionar una marca.';
    if (!form.categoryParentId) return 'Debes seleccionar una categoría.';
    if (subCategories.length > 0 && !form.categorySubId)
      return 'Debes seleccionar la subcategoría.';
    if (!form.originalPrice || originalPrice < 0)
      return 'El precio original debe ser un número mayor o igual a cero.';
    if (form.includes.length === 0) return 'Agrega al menos un elemento incluido.';
    if (form.specifications.length === 0) return 'Agrega al menos una especificación.';
    if (!isEditing && form.images.length === 0) return 'Debes subir al menos una imagen.';
    if (isEditing && form.images.length === 0 && existingImages.length === 0)
      return 'El producto debe conservar al menos una imagen.';
    if (discountPercentage < 0 || discountPercentage > 100)
      return 'El porcentaje de descuento debe estar entre 0 y 100.';
    return null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (isEditing && product) {
        const payload: UpdateProductDto = {
          name: form.name.trim(),
          description: form.description.trim(),
          slug: form.slug.trim() || undefined,
          model: form.model.trim(),
          sku: form.sku.trim() || undefined,
          codigoBarra: form.codigoBarra.trim() || undefined,
          warranty: form.warranty.trim() || undefined,
          datasheetUrl: form.datasheetUrl.trim() || undefined,
          stock: Math.max(0, Math.trunc(toNumber(form.stock))),
          includes: form.includes,
          specifications: form.specifications,
          originalPrice,
          discountPercentage: Math.trunc(discountPercentage),
          discountCash,
          isFeatured: form.isFeatured,
          isBestSeller: form.isBestSeller,
          isActive: form.isActive,
          brandId: Number(form.brandId),
          categoryId: Number(categoryId),
        };
        if (form.connections.length) payload.connections = form.connections;
        // Si se subieron imágenes nuevas, la API reemplaza por completo el set anterior.
        if (form.images.length) {
          payload.images = form.images;
        } else {
          // Si no hay imágenes nuevas, enviamos el set final (reordenado y/o con eliminaciones)
          // solo si cambió respecto al original; las que ya no aparecen aquí se eliminan en la API.
          const originalOrder = (product.images ?? [])
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((image) => image.id);
          const currentOrder = existingImages.map((image) => image.id);
          const changed =
            currentOrder.length !== originalOrder.length ||
            currentOrder.some((imageId, index) => imageId !== originalOrder[index]);
          if (changed) payload.imagesOrder = currentOrder;
        }

        await productsService.update(product.id, payload);
        toast.success('Producto actualizado correctamente.');
      } else {
        const payload: CreateProductDto = {
          name: form.name.trim(),
          description: form.description.trim(),
          slug: form.slug.trim() || undefined,
          model: form.model.trim(),
          sku: form.sku.trim() || undefined,
          codigoBarra: form.codigoBarra.trim() || undefined,
          warranty: form.warranty.trim() || undefined,
          datasheetUrl: form.datasheetUrl.trim() || undefined,
          stock: Math.max(0, Math.trunc(toNumber(form.stock))),
          includes: form.includes,
          specifications: form.specifications,
          originalPrice,
          isFeatured: form.isFeatured,
          isBestSeller: form.isBestSeller,
          brandId: Number(form.brandId),
          categoryId: Number(categoryId),
          images: form.images,
        };
        if (form.connections.length) payload.connections = form.connections;

        await productsService.create(payload);
        toast.success('Producto creado correctamente.');
      }
      navigate(LIST_PATH);
    } catch (err) {
      const msg = extractApiError(err) ?? 'Error al guardar el producto.';
      setError(msg);
      toast.error(msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const pageTitle = isEditing ? 'Editar Producto' : 'Nuevo Producto';

  if (loadingProduct) {
    return (
      <>
        <PageMeta title={`${pageTitle} | GSP`} description="Formulario de producto GSP" />
        <PageBreadCrumb pageTitle={pageTitle} />
        <div className="flex h-64 items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      </>
    );
  }

  if (loadError) {
    return (
      <>
        <PageMeta title={`${pageTitle} | GSP`} description="Formulario de producto GSP" />
        <PageBreadCrumb pageTitle={pageTitle} />
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center dark:border-white/[0.05] dark:bg-white/[0.03]">
          <p className="text-sm text-red-500">{loadError}</p>
          <Link
            to={LIST_PATH}
            className="mt-4 inline-block text-sm font-medium text-brand-500 hover:text-brand-600"
          >
            ← Volver al catálogo
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title={`${pageTitle} | GSP`}
        description="Formulario de productos del catálogo GSP"
      />
      <PageBreadCrumb pageTitle={pageTitle} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <FormAlert message={error} />

        <FormSection
          title="Imágenes"
          description={
            isEditing
              ? 'Si subes imágenes nuevas, reemplazan por completo a las actuales. Usa las flechas para cambiar el orden o la ✕ para eliminar una, sin volver a subirlas.'
              : `Hasta ${MAX_IMAGES} imágenes · la primera será la principal`
          }
        >
          {isEditing && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                Imágenes actuales
              </p>
              {/* Si ya se agregaron imágenes nuevas, estas dejan de ser válidas: la API las
                  reemplaza por completo. Las mostramos atenuadas y sin la etiqueta "Principal"
                  para no dar la impresión de que ambos sets convivirán. */}
              {form.images.length > 0 && (
                <p className="mb-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                  Se eliminarán al guardar: subiste imágenes nuevas y estas las reemplazan por completo.
                </p>
              )}
              {existingImages.length ? (
                <ul
                  className={`grid grid-cols-2 gap-3 sm:grid-cols-5 ${
                    form.images.length > 0 ? 'opacity-40' : ''
                  }`}
                >
                  {existingImages.map((image, index) => (
                    <li
                      key={image.id}
                      className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <img
                        src={image.imagePath}
                        alt={`${product?.name ?? ''} ${index + 1}`}
                        className="mx-auto h-48 w-auto bg-white object-contain dark:bg-gray-800"
                      />
                      {index === 0 && form.images.length === 0 && (
                        <span className="absolute left-1 top-1 rounded bg-brand-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          Principal
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeExistingImage(image.id)}
                        disabled={saving || form.images.length > 0 || existingImages.length === 1}
                        title="Eliminar imagen"
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        ✕
                      </button>
                      <div className="flex items-center justify-between gap-1 bg-white px-2 py-1 dark:bg-gray-900">
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">
                          Posición {index + 1}
                        </span>
                        <span className="flex shrink-0 gap-0.5">
                          <button
                            type="button"
                            onClick={() => moveExistingImage(index, index - 1)}
                            disabled={saving || form.images.length > 0 || index === 0}
                            title="Mover antes"
                            className="rounded px-1 text-xs text-gray-500 transition hover:text-brand-500 disabled:opacity-30"
                          >
                            ←
                          </button>
                          <button
                            type="button"
                            onClick={() => moveExistingImage(index, index + 1)}
                            disabled={
                              saving || form.images.length > 0 || index === existingImages.length - 1
                            }
                            title="Mover después"
                            className="rounded px-1 text-xs text-gray-500 transition hover:text-brand-500 disabled:opacity-30"
                          >
                            →
                          </button>
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-sm text-gray-400">Sin imágenes registradas.</span>
              )}
            </div>
          )}
          <ImageDropzone
            label={isEditing ? 'Reemplazar imágenes (opcional)' : 'Imágenes del producto'}
            required={!isEditing}
            reorderable
            maxFiles={MAX_IMAGES}
            files={form.images}
            onChange={(images) => update('images', images)}
            hint={
              isEditing
                ? `Deja esto vacío para conservar las imágenes actuales. Si subes al menos una, se reemplaza TODO el set anterior por este (la primera será la nueva principal) · hasta ${MAX_IMAGES} imágenes · máx. 5 MB c/u`
                : `Hasta ${MAX_IMAGES} imágenes · máx. 5 MB c/u · usa las flechas para ordenarlas`
            }
            disabled={saving}
          />
        </FormSection>

        <FormSection
          title="Datos generales"
          description="Nombre, modelo, URL y descripción del producto"
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TextField
              label="Nombre"
              required
              value={form.name}
              onChange={(value) => update('name', value)}
              placeholder="Impresora Térmica Epson TM-T20III"
              disabled={saving}
            />
            <TextField
              label="Modelo"
              required
              value={form.model}
              onChange={(value) => update('model', value)}
              placeholder="CBX-1501W"
              disabled={saving}
            />
            <TextField
              label="Slug (Opcional)"
              hint={
                form.slug.trim()
                  ? `Se guardará como: /${form.slug.trim()}`
                  : 'Se genera automáticamente desde el nombre'
              }
              value={form.slug}
              onChange={(value) => {
                update('slug', value);
                setSlugEdited(value.trim().length > 0);
              }}
              placeholder="impresora-termica-epson-tm-t20iii"
              disabled={saving}
            />
            <TextAreaField
              label="Descripción"
              required
              rows={4}
              className="lg:col-span-2"
              value={form.description}
              onChange={(value) => update('description', value)}
              placeholder="Impresora térmica de tickets para punto de venta."
              disabled={saving}
            />
          </div>
        </FormSection>

        <FormSection
          title="Identificadores"
          description="El producto se puede identificar por SKU o por código de barra. Ambos son únicos y se pueden usar para buscarlo."
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <TextField
                label="SKU"
                hint="Código interno único. Se propone automáticamente y puedes editarlo; si lo dejas vacío, la API genera uno."
                value={form.sku}
                onChange={(value) => update('sku', value)}
                placeholder="GSP-A1B2C3D4E5"
                disabled={saving}
              />
              <button
                type="button"
                onClick={() => update('sku', generateSku())}
                disabled={saving}
                className="mt-1 text-xs font-medium text-brand-500 transition hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Generar nuevo SKU
              </button>
            </div>
            <TextField
              label="Código de barra"
              hint="Identificador EAN/UPC u otro código de barras. Debe ser único si se registra."
              value={form.codigoBarra}
              onChange={(value) => update('codigoBarra', value)}
              placeholder="7891234567895"
              disabled={saving}
            />
          </div>
        </FormSection>

        <FormSection
          title="Garantía y ficha técnica"
          description="Información adicional de soporte del producto (opcional)"
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TextField
              label="Garantía (Opcional)"
              value={form.warranty}
              onChange={(value) => update('warranty', value)}
              placeholder="36 meses de garantía"
              disabled={saving}
            />
            <TextField
              label="Ficha técnica · URL (Opcional)"
              value={form.datasheetUrl}
              onChange={(value) => update('datasheetUrl', value)}
              placeholder="https://ejemplo.com/ficha-tecnica.pdf"
              disabled={saving}
            />
          </div>
        </FormSection>

        <FormSection title="Clasificación" description="Marca y categoría a la que pertenece">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SelectField
              label="Marca"
              required
              value={form.brandId}
              onChange={(value) => update('brandId', value)}
              options={brandOptions}
              placeholder="Selecciona una marca"
              disabled={saving}
            />
            <SelectField
              label="Categoría"
              required
              value={form.categoryParentId}
              onChange={handleParentCategoryChange}
              options={categoryParentOptions}
              placeholder="Selecciona una categoría"
              disabled={saving}
            />
            {subCategories.length > 0 && (
              <SelectField
                label="Subcategoría"
                required
                value={form.categorySubId}
                onChange={(value) => update('categorySubId', value)}
                options={categorySubOptions}
                placeholder="Selecciona una subcategoría"
                hint="Esta categoría tiene subcategorías: el producto debe asignarse a una de ellas."
                disabled={saving}
              />
            )}
          </div>
        </FormSection>

        <FormSection
          title="Precio y stock"
          description={
            isEditing
              ? 'El precio final se calcula a partir de los descuentos'
              : 'Al crear, el precio final es igual al precio original'
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <TextField
              label="Precio original"
              required
              type="number"
              min={0}
              step="0.01"
              value={form.originalPrice}
              onChange={(value) => update('originalPrice', value)}
              placeholder="450.00"
              disabled={saving}
            />
            <TextField
              label="Stock"
              type="number"
              min={0}
              value={form.stock}
              onChange={(value) => update('stock', value)}
              disabled={saving}
            />
            <TextField
              label="Descuento (%)"
              type="number"
              min={0}
              step="1"
              value={form.discountPercentage}
              onChange={(value) => update('discountPercentage', value)}
              disabled={saving || !isEditing}
              hint={!isEditing ? 'Solo disponible al editar' : undefined}
            />
            <TextField
              label="Descuento (S/)"
              type="number"
              min={0}
              step="0.01"
              value={form.discountCash}
              onChange={(value) => update('discountCash', value)}
              disabled={saving || !isEditing}
              hint={!isEditing ? 'Solo disponible al editar' : undefined}
            />
          </div>
          <div className="mt-4 rounded-lg bg-gray-50 px-4 py-3 text-sm dark:bg-gray-800">
            <span className="text-gray-500 dark:text-gray-400">Precio final: </span>
            <span className="font-semibold text-gray-800 dark:text-white">
              {formatCurrency(isEditing ? finalPrice : originalPrice)}
            </span>
          </div>
        </FormSection>

        <FormSection
          title="Detalle del producto"
          description="Listas que se muestran en la ficha de la tienda"
        >
          <div className="flex flex-col gap-5">
            <TagsInput
              label="Elementos incluidos"
              required
              values={form.includes}
              onChange={(values) => update('includes', values)}
              placeholder="Cable USB"
              hint="Al menos un elemento"
              disabled={saving}
            />
            <TagsInput
              label="Especificaciones"
              required
              values={form.specifications}
              onChange={(values) => update('specifications', values)}
              placeholder="Velocidad: 200 mm/s"
              hint="Al menos una especificación"
              disabled={saving}
            />
            <TagsInput
              label="Conexiones"
              values={form.connections}
              onChange={(values) => update('connections', values)}
              placeholder="USB"
              hint="Opcional"
              disabled={saving}
            />
          </div>
        </FormSection>

        <FormSection title="Visibilidad" description="Cómo se destaca el producto en la tienda">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ToggleField
              label="Destacado"
              description="Se muestra en el inicio de la página"
              checked={form.isFeatured}
              onChange={(value) => update('isFeatured', value)}
              disabled={saving}
            />
            <ToggleField
              label="Más vendido"
              description="Aparece en la sección de más vendidos"
              checked={form.isBestSeller}
              onChange={(value) => update('isBestSeller', value)}
              disabled={saving}
            />
            {isEditing && (
              <ToggleField
                label="Activo"
                description="Visible en la tienda"
                checked={form.isActive}
                onChange={(value) => update('isActive', value)}
                disabled={saving}
              />
            )}
          </div>
        </FormSection>

        {/* Barra de acciones pegada al viewport para no perder los botones en un formulario largo */}
        <div className="sticky bottom-0 z-30 -mx-4 flex items-center justify-end gap-3 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6 dark:border-gray-800 dark:bg-gray-900/95">
          <Button variant="outline" onClick={() => navigate(LIST_PATH)} disabled={saving}>
            Cancelar
          </Button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-3.5 text-sm text-white shadow-theme-xs transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </div>
      </form>
    </>
  );
}
