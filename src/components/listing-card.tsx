import Link from "next/link";
import type { Category, Listing, User } from "@prisma/client";
import { LISTING_TYPE_LABEL } from "@/lib/config";

type Props = { listing: Listing & { category: Category; provider: Pick<User, "name"> } };

export function ListingCard({ listing }: Props) {
  return (
    <Link href={`/anzeige/${listing.id}`} className="card flex flex-col gap-3 p-0 overflow-hidden transition hover:shadow-md">
      <div className="aspect-[4/3] bg-slate-100">
        {listing.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center bg-primary/10 font-heading text-4xl font-bold text-primary">
            {listing.category.name.charAt(0)}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 px-4 pb-4">
        <div className="flex flex-wrap gap-1.5">
          <span className="badge bg-primary/10 text-primary">{listing.category.name}</span>
          {listing.type === "GREETING_VIDEO" && (
            <span className="badge bg-accent/15 text-accent">{LISTING_TYPE_LABEL.GREETING_VIDEO}</span>
          )}
        </div>
        <h3 className="line-clamp-2 font-semibold">{listing.title}</h3>
        <p className="text-sm text-slate-500">
          {listing.provider.name} · {listing.postalCode} {listing.city}
        </p>
        <p className="mt-auto font-heading text-lg font-bold text-primary">{listing.priceCredits} Credits</p>
      </div>
    </Link>
  );
}
