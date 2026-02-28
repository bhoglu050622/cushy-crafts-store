import { useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/integrations/firebase/config";

const BUCKET_PATH = "product-images";

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File, productId: string): Promise<string | null> => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${productId}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const storageRef = ref(storage, `${BUCKET_PATH}/${fileName}`);
      await uploadBytes(storageRef, file, { cacheControl: "3600" });
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error) {
      console.error("Upload failed:", error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const uploadMultiple = async (files: File[], productId: string): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
      const url = await uploadImage(file, productId);
      if (url) urls.push(url);
    }
    return urls;
  };

  return { uploadImage, uploadMultiple, uploading };
};
