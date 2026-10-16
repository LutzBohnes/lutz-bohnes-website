import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteListingPhoto, moveListingPhoto, toggleListing, updateListing, uploadListingPhotos } from "@/app/actions/listings";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { PageHeader, Panel, StatusBadge } from "@/components/dashboard";
import { Icon } from "@/components/icon";
import { ListingFields } from "@/components/listing-fields";
import { PhotoPicker } from "@/components/photo-picker";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { MAX_PHOTOS_PER_LISTING } from "@/lib/storage";

export const metadata = { title: "Anzeige bearbeiten" };

export default async function EditListingPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ neu?: string; fehler?: string }>;
}) {
  const [{ id }, { neu, fehler }, user] = await Promise.all([params, searchParams, requireUser()]);
  const listing = await db.listing.findUnique({ where: { id }, include: { images: { orderBy: { position: "asc" } } } });
  if (!listing || (listing.providerId !== user.id && user.role !== "ADMIN")) notFound();
  const categories = await db.category.findMany({ orderBy: { name: "asc" } });
  const { images } = listing;

  return (
    <>
      <PageHeader
        title="Anzeige bearbeiten"
        subtitle={<span className="flex items-center gap-2">{listing.title} <StatusBadge status={listing.active ? "ACTIVE" : "PAUSED"} /></span>}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href={`/anzeige/${listing.id}`} className="btn btn-ghost"><Icon name="eye" size={18} /> Ansehen</Link>
            <form action={toggleListing}>
              <input type="hidden" name="id" value={listing.id} />
              <button className="btn btn-ghost">{listing.active ? "Pausieren" : "Aktivieren"}</button>
            </form>
          </div>
        }
      />
      {neu && <p className="rounded-lg bg-emerald-50 px-4 py-3 text-emerald-800">Deine Anzeige ist angelegt. Du kannst hier jederzeit Fotos und Texte ändern.</p>}
      {fehler && <p className="rounded-lg bg-red-50 px-4 py-3 text-red-700">{fehler}</p>}

      <Panel title={`Fotos (${images.length} von ${MAX_PHOTOS_PER_LISTING})`}>
        {images.length > 0 && (
          <ul className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((img, i) => (
              <li key={img.id} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="aspect-[4/3] w-full object-cover" />
                {i === 0 && <span className="absolute left-2 top-2 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-white">Titelbild</span>}
                <div className="absolute right-2 top-2">
                  <PhotoButton id={img.id} action={deleteListingPhoto} label="Foto löschen" danger>×</PhotoButton>
                </div>
                <div className="flex items-center gap-1 border-t border-slate-200 bg-white px-2 py-1.5">
                  <PhotoButton id={img.id} action={moveListingPhoto} direction="left" label="Nach links" disabled={i === 0}>‹</PhotoButton>
                  <PhotoButton id={img.id} action={moveListingPhoto} direction="right" label="Nach rechts" disabled={i === images.length - 1}>›</PhotoButton>
                  {i > 0 && <span className="ml-auto"><PhotoButton id={img.id} action={moveListingPhoto} direction="cover" label="Als Titelbild" wide>Als Titelbild</PhotoButton></span>}
                </div>
              </li>
            ))}
          </ul>
        )}
        <ActionForm action={uploadListingPhotos} resetOnSuccess className="space-y-3">
          <input type="hidden" name="id" value={listing.id} />
          <PhotoPicker max={MAX_PHOTOS_PER_LISTING} existing={images.length} />
          {images.length < MAX_PHOTOS_PER_LISTING && <SubmitButton>Fotos hochladen</SubmitButton>}
        </ActionForm>
      </Panel>

      <Panel title="Angebot">
        <ActionForm action={updateListing} className="space-y-4">
          <input type="hidden" name="id" value={listing.id} />
          <ListingFields categories={categories} listing={listing} />
          <SubmitButton>Änderungen speichern</SubmitButton>
        </ActionForm>
      </Panel>
    </>
  );
}

function PhotoButton({ id, action, direction, label, children, disabled, danger, wide }: {
  id: string;
  action: (fd: FormData) => Promise<void>;
  direction?: string;
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  wide?: boolean;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="imageId" value={id} />
      {direction && <input type="hidden" name="direction" value={direction} />}
      <button
        disabled={disabled}
        aria-label={label}
        title={label}
        className={`h-7 rounded-md text-sm font-medium transition disabled:opacity-30 ${wide ? "px-2" : danger ? "rounded-full" : "w-7"} ${
          danger ? "w-7 bg-black/60 text-base text-white hover:bg-red-600" : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        {children}
      </button>
    </form>
  );
}
