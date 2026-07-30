import { useEffect, useState } from 'react';
import type { Product } from '../../types';
import { formatCurrency, formatDate, toNumber } from '../../utils/format';
import { Modal } from '../../components/ui/modal';
import Button from '../../components/ui/button/Button';
import StatusBadge from '../../components/crud/StatusBadge';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

function SpecCard({ title, items }: { title: string; items: string[] | null | undefined }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/70 p-3 dark:border-slate-700/60 dark:bg-slate-900/40">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-400">
        {title}
      </p>
      {items?.length ? (
        <ul className="mt-2 space-y-1">
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="flex items-start gap-2 text-sm leading-snug text-gray-700 dark:text-slate-200"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
              <span className="min-w-0 break-words">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-gray-400 dark:text-slate-500">Sin registros.</p>
      )}
    </div>
  );
}

export default function ProductDetailModal({
  isOpen,
  onClose,
  product,
}: ProductDetailModalProps) {
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    setActiveImage(0);
  }, [product]);

  if (!product) return null;

  const images = [...(product.images ?? [])].sort((a, b) => a.order - b.order);
  const hasDiscount =
    toNumber(product.discountPercentage) > 0 || toNumber(product.discountCash) > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl p-5 sm:p-6">
      <h4 className="mb-4 pr-10 text-base font-semibold text-gray-800 dark:text-white">
        Detalle del Producto
      </h4>

      {/* Cabecera compacta: galería + info */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr]">
        {/* Galería — altura fija controlada, sin aspect-square */}
        <div className="min-w-0">
          {images.length > 0 ? (
            <>
              <div className="flex h-48 w-full items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50 dark:border-slate-700/60 dark:bg-slate-800/50 lg:h-72">
                <img
                  src={images[activeImage]?.imagePath}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain p-3"
                />
              </div>
              {images.length > 1 && (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setActiveImage(index)}
                      className={`h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                        index === activeImage
                          ? 'border-brand-500 ring-1 ring-brand-500/40'
                          : 'border-transparent hover:border-gray-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <img
                        src={image.imagePath}
                        alt={`${product.name} ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 text-sm text-gray-400 dark:border-slate-700/60 dark:bg-slate-800/50 dark:text-slate-500 lg:h-56">
              Sin imágenes
            </div>
          )}
        </div>

        {/* Información clave */}
        <div className="flex min-w-0 flex-col gap-3">
          <div>
            <p className="text-xl font-bold leading-tight text-gray-800 dark:text-white">
              {product.name}
            </p>
            <p className="mt-0.5 text-sm text-slate-400">/{product.slug}</p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <StatusBadge size="md" tone={product.isActive ? 'success' : 'danger'}>
              {product.isActive ? 'Activo' : 'Inactivo'}
            </StatusBadge>
            {product.isFeatured && (
              <StatusBadge size="md" tone="warning">
                Destacado
              </StatusBadge>
            )}
            {product.isBestSeller && (
              <StatusBadge size="md" tone="warning">
                Más vendido
              </StatusBadge>
            )}
          </div>

          {/* Precio y stock separados */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/80 px-3.5 py-2.5 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-700/70 dark:text-emerald-400/70">
                Precio
              </p>
              <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <p className="text-2xl font-extrabold leading-none text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(product.finalPrice)}
                </p>
                {hasDiscount && (
                  <>
                    <span className="text-sm text-gray-400 line-through dark:text-slate-500">
                      {formatCurrency(product.originalPrice)}
                    </span>
                    <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                      −{toNumber(product.discountPercentage)}% ·{' '}
                      {formatCurrency(product.discountCash)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {product.stock > 0 ? (
              <div className="rounded-lg border border-blue-100 bg-blue-50/80 px-3.5 py-2.5 dark:border-blue-500/20 dark:bg-blue-500/10">
                <p className="text-[11px] font-medium uppercase tracking-wide text-blue-700/70 dark:text-blue-400/70">
                  Stock
                </p>
                <p className="mt-0.5 text-2xl font-extrabold leading-none text-blue-600 dark:text-blue-400">
                  {product.stock}
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-red-100 bg-red-50/80 px-3.5 py-2.5 dark:border-red-500/20 dark:bg-red-500/10">
                <p className="text-[11px] font-medium uppercase tracking-wide text-red-700/70 dark:text-red-400/70">
                  Stock
                </p>
                <p className="mt-0.5 text-base font-bold leading-tight text-red-600 dark:text-red-400">
                  Sin stock
                </p>
              </div>
            )}
          </div>

          {/* Marca / categoría */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 dark:border-slate-700/50 dark:bg-slate-800/40">
              <p className="text-[11px] text-gray-400 dark:text-slate-400">Marca</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {product.brand?.name ?? '—'}
              </p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 dark:border-slate-700/50 dark:bg-slate-800/40">
              <p className="text-[11px] text-gray-400 dark:text-slate-400">Categoría</p>
              {product.category?.parent ? (
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  <span className="font-normal text-gray-500 dark:text-slate-400">
                    {product.category.parent.name} ›{' '}
                  </span>
                  {product.category.name}
                </p>
              ) : (
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {product.category?.name ?? '—'}
                </p>
              )}
            </div>
          </div>

          {/* Descripción debajo de marca y categoría */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-400">
              Descripción
            </p>
            <p className="mt-1 text-sm leading-relaxed text-gray-700 dark:text-slate-200">
              {product.description}
            </p>
          </div>
        </div>
      </div>

      {/* Especificaciones — items-start evita que las cards cortas se estiren */}
      <div className="mt-4 grid grid-cols-1 items-start gap-2.5 border-t border-gray-100 pt-3 dark:border-slate-700/50 sm:grid-cols-3">
        <SpecCard title="Incluye" items={product.includes} />
        <SpecCard title="Especificaciones" items={product.specifications} />
        <SpecCard title="Conexiones" items={product.connections} />
      </div>

      {/* Auditoría + cierre en una sola fila */}
      <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-3 dark:border-slate-700/50 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
          <div>
            <p className="text-[12px] text-gray-400 dark:text-slate-400">Modificado por</p>
            <p className="text-sm capitalize text-gray-600 dark:text-slate-300">
              {product.user?.fullName ?? 'Sin datos'}
              {product.user?.role ? ` · ${product.user.role}` : ''}
            </p>
          </div>
          <div>
            <p className="text-[12px] text-gray-400 dark:text-slate-400">Creado</p>
            <p className="text-sm text-gray-600 dark:text-slate-300">
              {formatDate(product.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-[12px] text-gray-400 dark:text-slate-400">Actualizado</p>
            <p className="text-sm text-gray-600 dark:text-slate-300">
              {formatDate(product.updatedAt)}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onClose} className="shrink-0 self-end">
          Cerrar
        </Button>
      </div>
    </Modal>
  );
}
