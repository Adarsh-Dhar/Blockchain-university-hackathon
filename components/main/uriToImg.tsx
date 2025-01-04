import { useState, useEffect } from 'react';

/**
 * Converts a URI to a Blob URL or base64 string
 * @param uri - The URI of the image to convert
 * @param format - The desired output format ('blob' | 'base64')
 * @returns The converted image URL or null if conversion fails
 */
const useUriToImage = (
  uri: string,
  format: 'blob' | 'base64' = 'blob'
): {
  imageUrl: string | null;
  loading: boolean;
  error: Error | null;
} => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const convertUriToImage = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(uri);
        const blob = await response.blob();

        if (format === 'blob') {
          const url = URL.createObjectURL(blob);
          setImageUrl(url);
        } else {
          const reader = new FileReader();
          reader.onloadend = () => {
            setImageUrl(reader.result as string);
          };
          reader.readAsDataURL(blob);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to convert image'));
        setImageUrl(null);
      } finally {
        setLoading(false);
      }
    };

    convertUriToImage();

    // Cleanup function to revoke Blob URL
    return () => {
      if (imageUrl && format === 'blob') {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [uri, format]);

  return { imageUrl, loading, error };
};

export default useUriToImage;