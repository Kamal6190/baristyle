import { Metadata } from "next";
import ProductPageClient from "./ProductPageClient";

async function getProduct(id: string) {
  try {
    // Dynamic request-time fetch from the backend API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const res = await fetch(`${apiUrl}/products/${id}`, {
      next: { revalidate: 10 } // Cache and revalidate every 10 seconds for real-time inventory updates
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch product details on Next.js Server Side:", err);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: "Product Not Found | BariStyle",
      description: "The requested luxury fragrance was not found in our collections.",
    };
  }

  const translations = product.translations || {};
  // Retrieve the correct product title, falling back logically to the available languages
  const title = translations.de || translations.en || translations.ar || "Luxury Fragrance";
  const desc = product.short_description?.de || product.short_description?.en || "Exquisite luxury niche fragrance from BariStyle.";

  return {
    title: `${title} | BariStyle`,
    description: desc,
    openGraph: {
      title: `${title} | BariStyle`,
      description: desc,
      images: product.image_url ? [{ url: product.image_url }] : [],
    }
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const product = await getProduct(id);

  return <ProductPageClient initialProduct={product} id={id} />;
}
