import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";

const CLOUDINARY_CLOUD_NAME = "dcr0eagj8";
const CLOUDINARY_UNSIGNED_PRESET = "unsigned";

const firebaseConfig = {
  apiKey: "AIzaSyCHKl8109OLW6Arj_DhIwtsCuemiordDMM",
  authDomain: "sablayan-50836.firebaseapp.com",
  projectId: "sablayan-50836",
  storageBucket: "sablayan-50836.firebasestorage.app",
  messagingSenderId: "844276897561",
  appId: "1:844276897561:web:c7a135a00b65d09b741788",
  measurementId: "G-DEXD2ZLX9W",
  databaseURL: "https://sablayan-50836-default-rtdb.firebaseio.com/",
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const roomsToSeed = [
  {
    id: "carolina",
    file: "CAROLINA.webp",
    title: "CAROLINA",
    subtitle: "Fan Room",
    price: 1500,
    capacity: "2 Guests",
    size: "20 sqm",
    category: "duplex",
    description: "Carolina is a small duplex house with porch per room (fan room)",
    features: ["Fan Room", "Small Duplex House", "Private Porch", "Free WiFi"],
    popular: false,
    status: "available",
  },
  {
    id: "enriqueta",
    file: "ENRIQUETA.webp",
    title: "ENRIQUETA",
    subtitle: "Deluxe Room",
    price: 4500,
    capacity: "2 Guests",
    size: "30 sqm",
    category: "house",
    description: "Enriqueta House is a Deluxe aircon room.",
    features: ["Air Conditioning", "Deluxe Room", "Hot & Cold Shower", "Free WiFi", "TV"],
    popular: true,
    status: "available",
  },
  {
    id: "maria",
    file: "MARIA.webp",
    title: "MARIA",
    subtitle: "Large Duplex",
    price: 5500,
    capacity: "4 Guests",
    size: "45 sqm",
    category: "duplex",
    description: "Maria is a large duplex house with aircon and front porch",
    features: ["Air Conditioning", "Large Duplex House", "Front Porch", "Hot & Cold Shower", "Free WiFi", "TV"],
    popular: true,
    status: "available",
  },
  {
    id: "elvira",
    file: "ELVIRA.webp",
    title: "ELVIRA",
    subtitle: "Standard Room",
    price: 3500,
    capacity: "2 Guests",
    size: "25 sqm",
    category: "room",
    description: "Elvira is a standard aircon room",
    features: ["Air Conditioning", "Standard Room", "Hot & Cold Shower", "Free WiFi", "TV"],
    popular: false,
    status: "maintenance",
  },
  {
    id: "carmen",
    file: "CARMEN.webp",
    title: "CARMEN",
    subtitle: "Dormitory",
    price: 8000,
    capacity: "8+ Guests",
    size: "60 sqm",
    category: "house",
    description: "Carmen House is a Dormitory type with double deck beds and single beds.",
    features: ["Air Conditioning", "Dormitory Type", "Double Deck Beds", "Single Beds", "Common Bathroom", "Free WiFi"],
    popular: false,
    status: "available",
  },
];

const mimeByExt = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

const uploadUnsigned = async (absolutePath, filename) => {
  const ext = path.extname(filename).toLowerCase();
  const mimeType = mimeByExt[ext] || "application/octet-stream";
  const fileBuffer = await fs.readFile(absolutePath);
  const blob = new Blob([fileBuffer], { type: mimeType });
  const formData = new FormData();
  formData.append("file", blob, filename);
  formData.append("upload_preset", CLOUDINARY_UNSIGNED_PRESET);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Upload failed for ${filename}: ${response.status} ${errorBody}`);
  }

  return response.json();
};

const run = async () => {
  console.log("Seeding rooms: uploading to Cloudinary and writing to Firebase...");
  const app = initializeApp(firebaseConfig);
  const database = getDatabase(app);

  for (const room of roomsToSeed) {
    const absoluteImagePath = path.join(rootDir, "src", "assets", "images", "rooms", room.file);
    const uploadResult = await uploadUnsigned(absoluteImagePath, room.file);

    await set(ref(database, `rooms/${room.id}`), {
      title: room.title,
      subtitle: room.subtitle,
      image: uploadResult.secure_url,
      price: room.price,
      capacity: room.capacity,
      size: room.size,
      category: room.category,
      description: room.description,
      features: room.features,
      popular: room.popular,
      status: room.status,
      createdAt: new Date().toISOString(),
      cloudinaryPublicId: uploadResult.public_id,
    });

    console.log(`Seeded room: ${room.id} (${uploadResult.secure_url})`);
  }

  console.log("Done.");
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

