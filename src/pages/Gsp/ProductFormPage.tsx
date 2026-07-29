import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import toast from 'react-hot-toast';
import { extractApiError } from '../../utils/apiError';
import { formatCurrency, slugify, toNumber } from '../../utils/format';
import { productsService } from '../../services/productsService';
import { brandsService } from '../../services/brandsService';
import { categoriesService } from '../../services/categoriesService';
import type { Brand, Category, CreateProductDto, Product, UpdateProductDto } from '../../types';
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
  categoryId: string;
  images: File[];
}

const emptyForm: ProductForm = {
  name: '',
  description: '',
  slug: '',
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
  categoryId: '',
  images: [],
};

const toFormState = (product: Product): ProductForm => ({
  name: product.name,
  description: product.description,
  slug: product.slug,
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
  categoryId: product.category ? String(product.category.id) : '',
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
  const [form, setForm] = useState<ProductForm>(
    productFromState ? toFormState(productFromState) : emptyForm
  );
  const [loadingProduct, setLoadingProduct] = useState(isEditing && !productFromState);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

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

  const brandOptions = useMemo(
    () => brands.map((brand) => ({ value: String(brand.id), label: brand.name })),
    [brands]
  );

  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        value: String(category.id),
        label: category.parent ? `${category.parent.name} › ${category.name}` : category.name,
      })),
    [categories]
  );

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
    if (!form.brandId) return 'Debes seleccionar una marca.';
    if (!form.categoryId) return 'Debes seleccionar una categoría.';
    if (!form.originalPrice || originalPrice < 0)
      return 'El precio original debe ser un número mayor o igual a cero.';
    if (form.includes.length === 0) return 'Agrega al menos un elemento incluido.';
    if (form.specifications.length === 0) return 'Agrega al menos una especificación.';
    if (!isEditing && form.images.length === 0) return 'Debes subir al menos una imagen.';
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
          stock: Math.max(0, Math.trunc(toNumber(form.stock))),
          includes: form.includes,
          specifications: form.specifications,
          originalPrice,
          discountPercentage: Math.trunc(discountPercentage),
          discountCash,
          finalPrice,
          isFeatured: form.isFeatured,
          isBestSeller: form.isBestSeller,
          isActive: form.isActive,
          brandId: Number(form.brandId),
          categoryId: Number(form.categoryId),
        };
        if (form.connections.length) payload.connections = form.connections;

        await productsService.update(product.id, payload);
        toast.success('Producto actualizado correctamente.');
      } else {
        const payload: CreateProductDto = {
          name: form.name.trim(),
          description: form.description.trim(),
          slug: form.slug.trim() || undefined,
          stock: Math.max(0, Math.trunc(toNumber(form.stock))),
          includes: form.includes,
          specifications: form.specifications,
          originalPrice,
          isFeatured: form.isFeatured,
          isBestSeller: form.isBestSeller,
          brandId: Number(form.brandId),
          categoryId: Number(form.categoryId),
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
  const slugPreview = form.slug.trim() || slugify(form.name);

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

        {isEditing && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
            La API todavía no implementa <code>PATCH /products/:id</code>. El formulario ya envía el
            payload correcto, pero los cambios no se guardarán hasta que backend complete el método.
          </div>
        )}

        <FormSection
          title="Datos generales"
          description="Nombre, URL amigable y descripción del producto"
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
              label="Slug (Opcional)"
              hint={slugPreview ? `Se guardará como: /${slugPreview}` : 'Se genera desde el nombre'}
              value={form.slug}
              onChange={(value) => update('slug', value)}
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
              value={form.categoryId}
              onChange={(value) => update('categoryId', value)}
              options={categoryOptions}
              placeholder="Selecciona una categoría"
              disabled={saving}
            />
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
              description="Se muestra en la portada"
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

        <FormSection
          title="Imágenes"
          description={
            isEditing
              ? 'La API aún no permite modificar las imágenes de un producto existente'
              : `Hasta ${MAX_IMAGES} imágenes · la primera será la principal`
          }
        >
          {isEditing ? (
            <div className="flex flex-wrap gap-2">
              {product?.images?.length ? (
                [...product.images]
                  .sort((a, b) => a.order - b.order)
                  .map((image) => (
                    <img
                      key={image.id}
                      src={image.imagePath}
                      alt={`${product.name} ${image.order + 1}`}
                      className="h-24 w-24 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                    />
                  ))
              ) : (
                <span className="text-sm text-gray-400">Sin imágenes registradas.</span>
              )}
            </div>
          ) : (
            <ImageDropzone
              label="Imágenes del producto"
              required
              reorderable
              maxFiles={MAX_IMAGES}
              files={form.images}
              onChange={(images) => update('images', images)}
              hint={`Hasta ${MAX_IMAGES} imágenes · máx. 5 MB c/u · usa las flechas para ordenarlas`}
              disabled={saving}
            />
          )}
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
