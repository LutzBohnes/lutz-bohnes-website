import Link from "next/link";
import type { Category, Listing, ListingImage, User } from "@prisma/client";
import { Avatar } from "./avatar";
import { Icon } from "./icon";

type Props = {
  listing: Listing & { category: Category; provider: Pick<User, "name" | "avatarUrl">; images: Pick<ListingImage, "url">[] };
};

export function ListingCard({ listing }: Props) {
  const cover = listing.images[0]?.url;
  return (
    <Link
      href={`/anzeige/${listing.id}`}
      className="group flex flex-col overflow-hidden border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(15,23,42,.35)]"
      style={{ borderRadius: "var(--brand-radius)" }}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-primary/10">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center font-heading text-5xl font-bold text-primary/70">{listing.category.name.charAt(0)}</div>
        )}
        {cover && <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 to-transparent" />}
        <span className="absolute bottom-3 left-3 rounded-full bg-white px-3 py-1 font-heading text-sm font-bold tabular-nums text-slate-900 shadow">
          {listing.priceCredits} Credits
        </span>
        {listing.type === "GREETING_VIDEO" && (
          <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-white shadow">Grußvideo</span>
        )}
        {listing.images.length > 1 && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-xs text-white">
            <Icon name="image" size={13} /> {listing.images.length}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">{listing.category.name}</span>
        <h3 className="line-clamp-2 font-semibold leading-snug">{listing.title}</h3>
        <div className="mt-auto flex items-center gap-2 pt-2 text-sm text-slate-500">
          <Avatar name={listing.provider.name} url={listing.provider.avatarUrl} size={26} />
          <span className="truncate">{listing.provider.name}</span>
          <span className="ml-auto flex flex-none items-center gap-1"><Icon name="pin" size={14} />{listing.city}</span>
        </div>
      </div>
    </Link>
  );
}
