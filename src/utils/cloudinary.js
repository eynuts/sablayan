const CLOUDINARY_CLOUD_NAME = "dcr0eagj8";
const CLOUDINARY_UNSIGNED_PRESET = "unsigned";

export const uploadToCloudinaryUnsigned = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UNSIGNED_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Cloudinary upload failed: ${response.status} ${errorBody}`);
  }

  return response.json();
};

