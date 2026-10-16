import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const CATEGORIES = [
  ["einkaufshilfe", "Einkaufshilfe", "bag"],
  ["haushalt", "Haushalt & Putzen", "broom"],
  ["kinderbetreuung", "Kinderbetreuung", "baby"],
  ["seniorenhilfe", "Seniorenhilfe", "heart"],
  ["nachhilfe", "Nachhilfe", "book"],
  ["tierbetreuung", "Tierbetreuung", "paw"],
  ["garten", "Garten", "leaf"],
  ["beauty", "Beauty & Friseur", "scissors"],
  ["naehen", "Nähen & Reparaturen", "needle"],
  ["kochen", "Kochen & Backen", "pot"],
  ["gruesse", "Grußvideos", "video"],
];

async function main() {
  for (const [slug, name, icon] of CATEGORIES) {
    await db.category.upsert({ where: { slug }, update: {}, create: { slug, name, icon } });
  }
  await db.siteSettings.upsert({ where: { id: "site" }, update: {}, create: { id: "site" } });
  const PLATFORMS = [
    ["Instagram", "instagram.com"],
    ["TikTok", "tiktok.com"],
    ["YouTube", "youtube.com, youtu.be"],
    ["Facebook", "facebook.com, fb.com"],
  ];
  for (const [i, [name, domains]] of PLATFORMS.entries()) {
    await db.socialPlatform.upsert({ where: { name }, update: {}, create: { name, domains, position: i } });
  }

  if (process.env.SEED_DEMO !== "1") return;

  const passwordHash = await bcrypt.hash("demo1234", 12);
  const admin = await db.user.upsert({
    where: { email: "admin@neighbours.test" },
    update: {},
    create: { email: "admin@neighbours.test", name: "Admin", passwordHash, role: "ADMIN" },
  });
  const anna = await db.user.upsert({
    where: { email: "anna@neighbours.test" },
    update: {},
    create: {
      email: "anna@neighbours.test",
      name: "Anna",
      passwordHash,
      role: "PROVIDER",
      verification: "VERIFIED",
      city: "Köln",
      postalCode: "50667",
      bio: "Rentnerin mit viel Zeit und Herz – ich helfe gern beim Einkaufen und im Garten.",
      languages: ["Deutsch"],
      experienceYears: 12,
    },
  });
  const lena = await db.user.upsert({
    where: { email: "lena@neighbours.test" },
    update: {},
    create: {
      email: "lena@neighbours.test",
      name: "Lena",
      passwordHash,
      role: "PROVIDER",
      verification: "VERIFIED",
      city: "Berlin",
      postalCode: "10115",
      bio: "Lehramtsstudentin, Mathe & Englisch. Außerdem nehme ich gern persönliche Grußvideos auf.",
      chatPrice: 3,
      languages: ["Deutsch", "Englisch"],
      experienceYears: 3,
    },
  });
  await db.user.upsert({
    where: { email: "kunde@neighbours.test" },
    update: {},
    create: { email: "kunde@neighbours.test", name: "Max", passwordHash, credits: 500 },
  });

  if ((await db.listing.count()) > 0) return;
  const cat = async (slug: string) => (await db.category.findUniqueOrThrow({ where: { slug } })).id;
  await db.listing.createMany({
    data: [
      {
        providerId: anna.id, categoryId: await cat("einkaufshilfe"), title: "Wocheneinkauf für Senior:innen",
        description: "Ich erledige Ihren Wocheneinkauf im Veedel und bringe alles bis an die Haustür. Einkaufsliste genügt!",
        priceCredits: 80, city: "Köln", postalCode: "50667",
      },
      {
        providerId: anna.id, categoryId: await cat("garten"), title: "Rasen mähen & Hecke schneiden",
        description: "Kleinere Gartenarbeiten rund um Köln-Innenstadt. Werkzeug bringe ich mit, Grünschnitt nehme ich mit.",
        priceCredits: 150, city: "Köln", postalCode: "50668",
      },
      {
        providerId: lena.id, categoryId: await cat("nachhilfe"), title: "Mathe-Nachhilfe 5.–10. Klasse (60 Min.)",
        description: "Geduldige Nachhilfe in Mathe für die Mittelstufe, bei euch zu Hause in Berlin-Mitte oder online.",
        priceCredits: 200, city: "Berlin", postalCode: "10115",
      },
      {
        providerId: lena.id, categoryId: await cat("gruesse"), type: "GREETING_VIDEO",
        title: "Persönliches Geburtstags-Grußvideo",
        description: "Ich nehme ein persönliches Video (ca. 1 Minute) für Geburtstag, Jubiläum oder Prüfung auf – mit Namen und euren Wünschen.",
        priceCredits: 120, city: "Berlin", postalCode: "10115",
      },
    ],
  });
  console.log("Demo-Daten angelegt. Logins (Passwort demo1234):", admin.email, anna.email, lena.email, "kunde@neighbours.test");
}

main().finally(() => db.$disconnect());
