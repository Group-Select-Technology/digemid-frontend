import { useEffect, useMemo, useState } from 'react';
import type { Bundle, BundleItem } from '../../types';
import { formatCurrency, formatDate, toNumber } from '../../utils/format';
import {
  BUNDLE_TYPE_LABELS,
  normalizeConnection,
  primaryImagePath,
  uniqueBundleBrands,
  uniqueBundleConnections,
} from '../../utils/bundle';
import { Modal } from '../../components/ui/modal';
import Button from '../../components/ui/button/Button';
import StatusBadge from '../../components/crud/StatusBadge';

interface BundleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  bundle: Bundle | null;
}

type GallerySlide =
  | { kind: 'kit'; imagePath: string | null; label: string }
  | { kind: 'product'; imagePath: string | null; label: string };

export default function BundleDetailModal({ isOpen, onClose, bundle }: BundleDetailModalProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState<BundleItem | null>(null);

  useEffect(() => {
    setActiveIndex(0);
    setSelectedItem(null);
  }, [bundle, isOpen]);

  const slides = useMemo<GallerySlide[]>(() => {
    if (!bundle) return [];
    return [
      { kind: 'kit', imagePath: bundle.imagePath || null, label: `${bundle.title} · imagen principal` },
      ...bundle.items.map((item) => ({
        kind: 'product' as const,
        imagePath: primaryImagePath(item.product.images),
        label: item.product.name,
      })),
    ];
  }, [bundle]);

  if (!bundle) return null;

  const activeSlide = slides[activeIndex] ?? slides[0];
  const viewerImage = activeSlide?.imagePath ?? bundle.imagePath;
  const viewerAlt = activeSlide?.label ?? bundle.title;
  const brands = uniqueBundleBrands(bundle.items);
  const connections = uniqueBundleConnections(bundle.items);
  const hasDiscount =
    toNumber(bundle.discountPercentage) > 0 || toNumber(bundle.discountCash) > 0;
  const totalUnits = bundle.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => {
          if (selectedItem) return;
          onClose();
        }}
        className="max-w-4xl p-5 sm:p-6"
      >
        <h4 className="mb-4 pr-10 text-base font-semibold text-gray-800 dark:text-white">
          Detalle del {BUNDLE_TYPE_LABELS[bundle.type] ?? 'combo'}
        </h4>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr]">
          <div className="min-w-0">
            <div className="flex h-48 w-full items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50 dark:border-slate-700/60 dark:bg-slate-800/50 lg:h-72">
              {viewerImage ? (
                <img
                  src={viewerImage}
                  alt={viewerAlt}
                  className="max-h-full max-w-full object-contain p-3"
                />
              ) : (
                <span className="text-sm text-gray-400 dark:text-slate-500">Sin imagen</span>
              )}
            </div>

            {slides.length > 1 && (
              <div className="mt-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-400">
                  Imágenes
                </p>
                <div className="flex flex-wrap gap-2">
                  {slides.map((slide, index) => (
                    <button
                      key={`${slide.kind}-${index}`}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      title={slide.label}
                      className={`h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                        index === activeIndex
                          ? 'border-brand-500 ring-1 ring-brand-500/40'
                          : 'border-transparent hover:border-gray-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {slide.imagePath ? (
                        <img
                          src={slide.imagePath}
                          alt={slide.label}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center bg-gray-100 text-[10px] text-gray-400 dark:bg-slate-800">
                          {slide.kind === 'kit' ? 'Kit' : 'P'}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <p className="mt-2 truncate text-xs text-gray-500 dark:text-slate-400">
                  {activeSlide?.label}
                </p>
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-3">
            <div>
              <p className="text-xl font-bold leading-tight text-gray-800 dark:text-white">
                {bundle.title}
              </p>
              <p className="mt-0.5 text-sm text-slate-400">/{bundle.slug}</p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <StatusBadge size="md" tone="info">
                {BUNDLE_TYPE_LABELS[bundle.type] ?? bundle.type}
              </StatusBadge>
              <StatusBadge size="md" tone={bundle.isActive ? 'success' : 'danger'}>
                {bundle.isActive ? 'Activo' : 'Inactivo'}
              </StatusBadge>
              {bundle.isFeatured && (
                <StatusBadge size="md" tone="warning">
                  Destacado
                </StatusBadge>
              )}
              {bundle.isBestSeller && (
                <StatusBadge size="md" tone="warning">
                  Más vendido
                </StatusBadge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/80 px-3.5 py-2.5 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-700/70 dark:text-emerald-400/70">
                  Precio
                </p>
                <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <p className="text-2xl font-extrabold leading-none text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(bundle.finalPrice)}
                  </p>
                  {hasDiscount && (
                    <>
                      <span className="text-sm text-gray-400 line-through dark:text-slate-500">
                        {formatCurrency(bundle.originalPrice)}
                      </span>
                      <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                        {toNumber(bundle.discountPercentage) > 0
                          ? `−${toNumber(bundle.discountPercentage)}%`
                          : `−${formatCurrency(bundle.discountCash)}`}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-blue-100 bg-blue-50/80 px-3.5 py-2.5 dark:border-blue-500/20 dark:bg-blue-500/10">
                <p className="text-[11px] font-medium uppercase tracking-wide text-blue-700/70 dark:text-blue-400/70">
                  Contenido
                </p>
                <p className="mt-0.5 text-2xl font-extrabold leading-none text-blue-600 dark:text-blue-400">
                  {bundle.items.length}
                </p>
                <p className="mt-1 text-[11px] text-blue-700/70 dark:text-blue-400/70">
                  productos · {totalUnits} unidades
                </p>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-400">
                Marcas
              </p>
              {brands.length ? (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {brands.map((brand) => (
                    <StatusBadge key={brand} tone="neutral">
                      {brand}
                    </StatusBadge>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-sm text-gray-400">Sin marcas</p>
              )}
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-400">
                Conexiones
              </p>
              {connections.length ? (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {connections.map((connection) => (
                    <StatusBadge key={connection} tone="neutral">
                      {connection}
                    </StatusBadge>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-sm text-gray-400">Sin conexiones</p>
              )}
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-400">
                Descripción
              </p>
              <p className="mt-1 text-sm leading-relaxed text-gray-700 dark:text-slate-200">
                {bundle.description}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-gray-100 pt-3 dark:border-slate-700/50">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-400">
            Productos del combo
          </p>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {bundle.items.map((item) => {
              const cover = primaryImagePath(item.product.images);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className="flex w-full items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/70 p-2.5 text-left transition hover:border-gray-300 dark:border-slate-700/60 dark:bg-slate-900/40 dark:hover:border-slate-500"
                  >
                    {cover ? (
                      <img
                        src={cover}
                        alt={item.product.name}
                        className="h-12 w-12 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-gray-200 text-xs text-gray-500 dark:bg-slate-800">
                        {item.product.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                        {item.product.name}
                      </p>
                      <p className="truncate text-xs text-gray-400 dark:text-slate-500">
                        {item.product.brand || 'Sin marca'}
                        {item.product.model ? ` · ${item.product.model}` : ''}
                      </p>
                    </div>
                    <StatusBadge tone="info">x{item.quantity}</StatusBadge>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-3 dark:border-slate-700/50 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
            <div>
              <p className="text-[12px] text-gray-400 dark:text-slate-400">Modificado por</p>
              <p className="text-sm capitalize text-gray-600 dark:text-slate-300">
                {bundle.user?.fullName ?? 'Sin datos'}
                {bundle.user?.role ? ` · ${bundle.user.role}` : ''}
              </p>
            </div>
            <div>
              <p className="text-[12px] text-gray-400 dark:text-slate-400">Creado</p>
              <p className="text-sm text-gray-600 dark:text-slate-300">{formatDate(bundle.createdAt)}</p>
            </div>
            <div>
              <p className="text-[12px] text-gray-400 dark:text-slate-400">Actualizado</p>
              <p className="text-sm text-gray-600 dark:text-slate-300">
                {formatDate(bundle.updatedAt)}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onClose} className="shrink-0 self-end">
            Cerrar
          </Button>
        </div>
      </Modal>

      <BundleProductModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </>
  );
}

function BundleProductModal({
  item,
  onClose,
}: {
  item: BundleItem | null;
  onClose: () => void;
}) {
  const product = item?.product;
  const cover = product ? primaryImagePath(product.images) : null;
  const connections = (product?.connections ?? []).map(normalizeConnection).filter(Boolean);

  return (
    <Modal nested isOpen={!!item} onClose={onClose} className="max-w-lg p-5 sm:p-6">
      <h4 className="mb-4 pr-10 text-base font-semibold text-gray-800 dark:text-white">
        Detalle del producto
      </h4>

      {product && item && (
        <div className="flex flex-col gap-4">
          <div className="flex h-48 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50 dark:border-slate-700/60 dark:bg-slate-800/50">
            {cover ? (
              <img
                src={cover}
                alt={product.name}
                className="max-h-full max-w-full object-contain p-3"
              />
            ) : (
              <span className="text-sm text-gray-400">Sin imagen</span>
            )}
          </div>

          <div>
            <p className="text-lg font-bold leading-tight text-gray-800 dark:text-white">
              {product.name}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">{product.id}</p>
          </div>

          <p className="text-sm leading-relaxed text-gray-700 dark:text-slate-200">
            {product.description || 'Sin descripción'}
          </p>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 dark:border-slate-700/50 dark:bg-slate-800/40">
              <p className="text-[11px] text-gray-400 dark:text-slate-400">Marca</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {product.brand || '—'}
              </p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 dark:border-slate-700/50 dark:bg-slate-800/40">
              <p className="text-[11px] text-gray-400 dark:text-slate-400">Modelo</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {product.model || '—'}
              </p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 dark:border-slate-700/50 dark:bg-slate-800/40">
              <p className="text-[11px] text-gray-400 dark:text-slate-400">Cantidad en el combo</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">x{item.quantity}</p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 dark:border-slate-700/50 dark:bg-slate-800/40">
              <p className="text-[11px] text-gray-400 dark:text-slate-400">Conexiones</p>
              {connections.length ? (
                <div className="mt-1 flex flex-wrap gap-1">
                  {connections.map((connection) => (
                    <StatusBadge key={connection} tone="neutral">
                      {connection}
                    </StatusBadge>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">—</p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
