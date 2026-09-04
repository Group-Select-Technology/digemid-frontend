import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import toast from 'react-hot-toast';
import { extractApiError } from '../../utils/apiError';
import { formatCurrency, slugify, toNumber } from '../../utils/format';
import {
  BUNDLE_TYPE_HINTS,
  BUNDLE_TYPE_LABELS,
  BUNDLE_TYPES,
  primaryImagePath,
  typeCountHint,
} from '../../utils/bundle';
import { bundlesService } from '../../services/bundlesService';
import { productsService } from '../../services/productsService';
import type { Bundle, BundleType, CreateBundleDto, Product, UpdateBundleDto } from '../../types';
import PageBreadCrumb from '../../components/common/PageBreadCrumb';
import PageMeta from '../../components/common/PageMeta';
import FormSection from '../../components/crud/FormSection';
import {
  FormAlert,
  SelectField,
  TextAreaField,
  TextField,
  ToggleField,
  inputClass,
} from '../../components/crud/FormControls';
import ImageDropzone from '../../components/crud/ImageDropzone';
import Button from '../../components/ui/button/Button';
import StatusBadge from '../../components/crud/StatusBadge';

const LIST_PATH = '/gsp/kits';
const SEARCH_LIMIT = 8;

interface SelectedItem {
  productId: string;
  name: string;
  slug: string;
  codigoBarra: string | null;
  brand: string;
  imagePath: string | null;
  quantity: string;
}

interface BundleForm {
  title: string;
  description: string;
  slug: string;
  type: BundleType | '';
  originalPrice: string;
  discountPercentage: string;
  discountCash: string;
  isFeatured: boolean;
  isBestSeller: boolean;
  isActive: boolean;
  image: File[];
  items: SelectedItem[];
}

const emptyForm: BundleForm = {
  title: '',
  description: '',
  slug: '',
  type: '',
  originalPrice: '',
  discountPercentage: '0',
  discountCash: '0',
  isFeatured: false,
  isBestSeller: false,
  isActive: true,
  image: [],
  items: [],
};

const toSelectedItem = (
  product: Pick<Product, 'id' | 'name' | 'slug' | 'codigoBarra' | 'brand' | 'images'>,
  quantity: number
): SelectedItem => ({
  productId: product.id,
  name: product.name,
  slug: product.slug ?? '',
  codigoBarra: product.codigoBarra ?? null,
  brand: product.brand?.name ?? '',
  imagePath: primaryImagePath(product.images),
  quantity: String(quantity),
});

const toFormState = (bundle: Bundle): BundleForm => ({
  title: bundle.title,
  description: bundle.description,
  slug: bundle.slug,
  type: bundle.type,
  originalPrice: String(toNumber(bundle.originalPrice)),
  discountPercentage: String(toNumber(bundle.discountPercentage)),
  discountCash: String(toNumber(bundle.discountCash)),
  isFeatured: bundle.isFeatured,
  isBestSeller: bundle.isBestSeller,
  isActive: bundle.isActive,
  image: [],
  items: (bundle.items ?? []).map((item) => ({
    productId: item.product.id,
    name: item.product.name,
    slug: item.product.slug ?? '',
    codigoBarra: item.product.codigoBarra ?? null,
    brand: item.product.brand ?? '',
    imagePath: primaryImagePath(item.product.images),
    quantity: String(item.quantity),
  })),
});

export default function BundleFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditing = !!id;

  const bundleFromState = (location.state as { bundle?: Bundle } | null)?.bundle ?? null;

  const [bundle, setBundle] = useState<Bundle | null>(bundleFromState);
  const [form, setForm] = useState<BundleForm>(
    bundleFromState ? toFormState(bundleFromState) : emptyForm
  );
  const [loadingBundle, setLoadingBundle] = useState(isEditing && !bundleFromState);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [productQuery, setProductQuery] = useState('');
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);

  useEffect(() => {
    if (!isEditing || bundleFromState || !id) return;
    let cancelled = false;

    (async () => {
      setLoadingBundle(true);
      setLoadError(null);
      try {
        const data = await bundlesService.getOne(id);
        if (cancelled) return;
        setBundle(data);
        setForm(toFormState(data));
      } catch (err) {
        if (!cancelled) setLoadError(extractApiError(err) ?? 'No se encontró el kit, pack o minipack.');
      } finally {
        if (!cancelled) setLoadingBundle(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, isEditing, bundleFromState]);

  useEffect(() => {
    const term = productQuery.trim();
    if (term.length < 2) {
      setProductResults([]);
      setSearchingProducts(false);
      return;
    }

    let cancelled = false;
    setSearchingProducts(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await productsService.getAll({
          search: term,
          isActive: '1',
          limit: SEARCH_LIMIT,
          offset: 0,
        });
        if (!cancelled) setProductResults(response.data);
      } catch {
        if (!cancelled) setProductResults([]);
      } finally {
        if (!cancelled) setSearchingProducts(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [productQuery]);

  const update = <K extends keyof BundleForm>(key: K, value: BundleForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const selectedIds = useMemo(() => new Set(form.items.map((item) => item.productId)), [form.items]);

  const uniqueBrands = useMemo(() => {
    const names = form.items.map((item) => item.brand.trim()).filter(Boolean);
    return [...new Set(names)];
  }, [form.items]);

  const addProduct = (product: Product) => {
    if (selectedIds.has(product.id)) return;
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, toSelectedItem(product, 1)],
    }));
    setProductQuery('');
    setProductResults([]);
  };

  const removeProduct = (productId: string) =>
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.productId !== productId),
    }));

  const updateQuantity = (productId: string, raw: string) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.productId === productId ? { ...item, quantity: raw } : item
      ),
    }));
  };

  const originalPrice = toNumber(form.originalPrice);
  const discountPercentage = toNumber(form.discountPercentage);
  const discountCash = toNumber(form.discountCash);
  const finalPrice = Math.max(
    0,
    Number(
      (
        originalPrice -
        (discountPercentage > 0 ? (originalPrice * discountPercentage) / 100 : discountCash)
      ).toFixed(2)
    )
  );

  const typeHint = form.type ? typeCountHint(form.type, form.items.length) : null;

  const typeOptions = useMemo(
    () => BUNDLE_TYPES.map((type) => ({ value: type, label: BUNDLE_TYPE_LABELS[type] })),
    []
  );

  const availableResults = useMemo(
    () => productResults.filter((product) => !selectedIds.has(product.id)),
    [productResults, selectedIds]
  );

  const validate = (): string | null => {
    if (form.title.trim().length < 2) return 'El título debe tener al menos 2 caracteres.';
    if (form.description.trim().length < 2)
      return 'La descripción debe tener al menos 2 caracteres.';
    if (form.description.trim().length > 600)
      return 'La descripción no puede superar los 600 caracteres.';
    if (!form.type) return 'Debes seleccionar el tipo (kit, pack o minipack).';
    if (!form.originalPrice || originalPrice < 0)
      return 'El precio original debe ser un número mayor o igual a cero.';
    if (form.items.length === 0) return 'Debes agregar al menos un producto.';
    if (
      form.items.some((item) => {
        const quantity = Math.trunc(toNumber(item.quantity));
        return item.quantity.trim() === '' || quantity < 1;
      })
    )
      return 'La cantidad de cada producto debe ser al menos 1.';
    if (!isEditing && form.image.length === 0) return 'Debes subir la imagen del combo.';
    if (discountPercentage < 0 || discountPercentage > 100)
      return 'El porcentaje de descuento debe estar entre 0 y 100.';
    if (discountPercentage > 0 && discountCash > 0)
      return 'Solo se admite un tipo de descuento a la vez.';
    return null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const items = form.items.map((item) => ({
      id: item.productId,
      quantity: Math.trunc(toNumber(item.quantity)),
    }));

    setSaving(true);
    setError(null);
    try {
      if (isEditing && bundle) {
        const payload: UpdateBundleDto = {
          title: form.title.trim(),
          description: form.description.trim(),
          slug: form.slug.trim() || undefined,
          type: form.type as BundleType,
          originalPrice,
          isFeatured: form.isFeatured,
          isBestSeller: form.isBestSeller,
          isActive: form.isActive,
          items,
        };
        if (discountPercentage > 0) {
          payload.discountPercentage = Math.trunc(discountPercentage);
          payload.discountCash = 0;
        } else {
          payload.discountPercentage = 0;
          payload.discountCash = discountCash;
        }
        if (form.image[0]) payload.image = form.image[0];

        await bundlesService.update(bundle.id, payload);
        toast.success('Combo actualizado correctamente.');
      } else {
        const payload: CreateBundleDto = {
          title: form.title.trim(),
          description: form.description.trim(),
          slug: form.slug.trim() || undefined,
          type: form.type as BundleType,
          originalPrice,
          isFeatured: form.isFeatured,
          isBestSeller: form.isBestSeller,
          items,
          image: form.image[0],
        };
        await bundlesService.create(payload);
        toast.success('Combo creado correctamente.');
      }
      navigate(LIST_PATH);
    } catch (err) {
      const msg = extractApiError(err) ?? 'Error al guardar el combo.';
      setError(msg);
      toast.error(msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const pageTitle = isEditing ? 'Editar kit / pack' : 'Nuevo kit / pack';
  const slugPreview = form.slug.trim() || slugify(form.title);

  if (loadingBundle) {
    return (
      <>
        <PageMeta title={`${pageTitle} | GSP`} description="Formulario de kits GSP" />
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
        <PageMeta title={`${pageTitle} | GSP`} description="Formulario de kits GSP" />
        <PageBreadCrumb pageTitle={pageTitle} />
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center dark:border-white/[0.05] dark:bg-white/[0.03]">
          <p className="text-sm text-red-500">{loadError}</p>
          <Link
            to={LIST_PATH}
            className="mt-4 inline-block text-sm font-medium text-brand-500 hover:text-brand-600"
          >
            ← Volver al listado
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title={`${pageTitle} | GSP`}
        description="Formulario de kits, packs y minipacks del catálogo GSP"
      />
      <PageBreadCrumb pageTitle={pageTitle} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <FormAlert message={error} />

        <FormSection
          title="Imagen del combo"
          description="Una sola imagen representa al kit, pack o minipack. Las fotos de los productos se toman de cada ficha (imagen principal)."
        >
          <ImageDropzone
            label={isEditing ? 'Reemplazar imagen (opcional)' : 'Imagen del combo'}
            required={!isEditing}
            maxFiles={1}
            files={form.image}
            onChange={(images) => update('image', images)}
            currentImageUrl={isEditing ? bundle?.imagePath : null}
            hint={
              isEditing
                ? 'Deja esto vacío para conservar la imagen actual · máx. 5 MB'
                : 'JPG, PNG o WebP · máx. 5 MB'
            }
            disabled={saving}
          />
        </FormSection>

        <FormSection title="Datos generales" description="Título, tipo y descripción del combo">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TextField
              label="Título"
              required
              value={form.title}
              onChange={(value) => update('title', value)}
              placeholder="KIT 1 - MINI CPU 15"
              disabled={saving}
            />
            <SelectField
              label="Tipo"
              required
              value={form.type}
              onChange={(value) => update('type', value as BundleType | '')}
              options={typeOptions}
              placeholder="Selecciona el tipo"
              hint={form.type ? BUNDLE_TYPE_HINTS[form.type] : 'Kit: 4+ · Pack: 3 · Minipack: 2'}
              disabled={saving}
            />
            <TextField
              label="Slug (Opcional)"
              hint={slugPreview ? `Se guardará como: /${slugPreview}` : 'Se genera desde el título'}
              value={form.slug}
              onChange={(value) => update('slug', value)}
              placeholder="kit-1-mini-cpu-15"
              disabled={saving}
            />
            <TextAreaField
              label="Descripción"
              required
              rows={3}
              className="lg:col-span-2"
              value={form.description}
              onChange={(value) => update('description', value)}
              placeholder="Combo de mini cpu con impresora térmica y rollos de papel incluidos."
              disabled={saving}
            />
          </div>
        </FormSection>

        <FormSection
          title="Productos incluidos"
          description="Busca productos activos por nombre, ID, slug o código de barras y define la cantidad de cada uno. Las marcas se deducen de los productos, sin repetir."
        >
          <div className="relative">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Agregar producto
            </label>
            <input
              type="text"
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              placeholder="Buscar por nombre, ID, slug o código de barras..."
              disabled={saving}
              className={inputClass}
            />
            {productQuery.trim().length >= 2 && (
              <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                {searchingProducts ? (
                  <p className="px-3 py-2 text-sm text-gray-400">Buscando...</p>
                ) : availableResults.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-gray-400">
                    {productResults.length
                      ? 'Esos productos ya están en el combo.'
                      : 'No hay productos activos que coincidan.'}
                  </p>
                ) : (
                  <ul>
                    {availableResults.map((product) => {
                      const cover = primaryImagePath(product.images);
                      return (
                        <li key={product.id}>
                          <button
                            type="button"
                            onClick={() => addProduct(product)}
                            className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            {cover ? (
                              <img
                                src={cover}
                                alt=""
                                className="h-10 w-10 shrink-0 rounded-md object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gray-100 text-xs text-gray-400 dark:bg-gray-800">
                                {product.name.charAt(0)}
                              </div>
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-gray-800 dark:text-white">
                                {product.name}
                              </span>
                              <span className="block truncate text-xs text-gray-400">
                                {product.brand?.name ?? 'Sin marca'}
                                {product.slug ? ` · /${product.slug}` : ''}
                              </span>
                              <span className="block truncate text-[11px] text-gray-400">
                                {product.codigoBarra
                                  ? `Barras: ${product.codigoBarra}`
                                  : 'Sin código de barras'}
                                {' · '}
                                {product.id}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>

          {form.items.length === 0 ? (
            <p className="mt-4 text-sm text-gray-400">Aún no hay productos en este combo.</p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 dark:divide-gray-800 dark:border-gray-700">
              {form.items.map((item) => (
                <li key={item.productId} className="flex items-center gap-3 bg-white p-3 dark:bg-transparent">
                  {item.imagePath ? (
                    <img
                      src={item.imagePath}
                      alt={item.name}
                      className="h-12 w-12 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-gray-100 text-xs text-gray-400 dark:bg-gray-800">
                      {item.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                      {item.name}
                    </p>
                    <p className="truncate text-xs text-gray-400">
                      {item.brand || 'Sin marca'}
                      {item.slug ? ` · /${item.slug}` : ''}
                    </p>
                    <p className="truncate text-[11px] text-gray-400">
                      {item.codigoBarra ? `Barras: ${item.codigoBarra}` : 'Sin código de barras'}
                      {' · '}
                      {item.productId}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-400">Cant.</label>
                    <input
                      type="number"
                      min={1}
                      step="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.productId, e.target.value)}
                      disabled={saving}
                      className={`${inputClass} w-20`}
                    />
                    <button
                      type="button"
                      onClick={() => removeProduct(item.productId)}
                      disabled={saving}
                      title="Quitar producto"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-400">
              {form.items.length} producto{form.items.length === 1 ? '' : 's'}
            </span>
            {uniqueBrands.length > 0 && (
              <>
                <span className="text-xs text-gray-300 dark:text-gray-600">·</span>
                <span className="text-xs text-gray-400">Marcas:</span>
                {uniqueBrands.map((brand) => (
                  <StatusBadge key={brand} tone="neutral">
                    {brand}
                  </StatusBadge>
                ))}
              </>
            )}
          </div>
          {typeHint && <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">{typeHint}</p>}
        </FormSection>

        <FormSection
          title="Precio"
          description={
            isEditing
              ? 'El precio final se calcula con un único tipo de descuento (porcentaje o monto, nunca ambos)'
              : 'Al crear, el precio final es igual al precio original'
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              label="Descuento (%)"
              type="number"
              min={0}
              step="1"
              value={form.discountPercentage}
              onChange={(value) => {
                update('discountPercentage', value);
                if (toNumber(value) > 0) update('discountCash', '0');
              }}
              disabled={saving || !isEditing || discountCash > 0}
              hint={!isEditing ? 'Solo disponible al editar' : 'Excluye el descuento en S/'}
            />
            <TextField
              label="Descuento (S/)"
              type="number"
              min={0}
              step="0.01"
              value={form.discountCash}
              onChange={(value) => {
                update('discountCash', value);
                if (toNumber(value) > 0) update('discountPercentage', '0');
              }}
              disabled={saving || !isEditing || discountPercentage > 0}
              hint={!isEditing ? 'Solo disponible al editar' : 'Excluye el descuento porcentual'}
            />
          </div>
          <div className="mt-4 rounded-lg bg-gray-50 px-4 py-3 text-sm dark:bg-gray-800">
            <span className="text-gray-500 dark:text-gray-400">Precio final: </span>
            <span className="font-semibold text-gray-800 dark:text-white">
              {formatCurrency(isEditing ? finalPrice : originalPrice)}
            </span>
          </div>
        </FormSection>

        <FormSection title="Visibilidad" description="Cómo se destaca el combo en la tienda">
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

        <div className="sticky bottom-0 z-30 -mx-4 flex items-center justify-end gap-3 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6 dark:border-gray-800 dark:bg-gray-900/95">
          <Button variant="outline" onClick={() => navigate(LIST_PATH)} disabled={saving}>
            Cancelar
          </Button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-3.5 text-sm text-white shadow-theme-xs transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear combo'}
          </button>
        </div>
      </form>
    </>
  );
}
