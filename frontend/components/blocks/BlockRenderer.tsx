"use client";

import { Block, Product } from "@/lib/data";
import BannerBlock from "./BannerBlock";
import FeaturesBlock from "./FeaturesBlock";
import ImageLeftTextRight from "./ImageLeftTextRight";
import ImageRightTextLeft from "./ImageRightTextLeft";
import GalleryBlock from "./GalleryBlock";
import TestimonialsBlock from "./TestimonialsBlock";
import CTABlock from "./CTABlock";
import VideoBlock from "./VideoBlock";
import PricingBlock from "./PricingBlock";
import CountdownBlock from "./CountdownBlock";

interface BlockRendererProps {
  blocks: Block[];
  product?: Product;
}

export default function BlockRenderer({ blocks, product }: BlockRendererProps) {
  return (
    <>
      {blocks.map((block, index) => {
        switch (block.type) {
          case "banner":
            return (
              <BannerBlock
                key={index}
                title={block.title as string}
                subtitle={block.subtitle as string}
                image={block.image as string}
                product={product}
              />
            );

          case "features":
            return (
              <FeaturesBlock
                key={index}
                title={block.title as string}
                columns={block.columns as 2 | 3 | 4 | undefined}
                items={
                  block.items as Array<{
                    icon?: string;
                    image?: string;
                    title: string;
                    text: string;
                  }>
                }
              />
            );

          case "image_left_text_right":
            return (
              <ImageLeftTextRight
                key={index}
                image={block.image as string}
                title={block.title as string}
                text={block.text as string}
              />
            );

          case "image_right_text_left":
            return (
              <ImageRightTextLeft
                key={index}
                image={block.image as string}
                title={block.title as string}
                text={block.text as string}
              />
            );

          case "gallery":
            return (
              <GalleryBlock key={index} title={block.title as string} images={block.images as import('./GalleryBlock').GalleryImage[]} />
            );

          case "testimonials":
            return (
              <TestimonialsBlock
                key={index}
                title={block.title as string | undefined}
                productSlug={product?.slug}
                items={
                  block.items as Array<{
                    id: string;
                    name: string;
                    city: string;
                    date: string;
                    rating: number;
                    text: string;
                  }>
                }
              />
            );

          case "cta":
            return (
              <CTABlock
                key={index}
                text={(block.text as string) ?? (block.title as string) ?? ""}
                bgColor={block.bgColor as string | undefined}
                textColor={block.textColor as string | undefined}
                buttonText={
                  (block.buttonText as string) ??
                  ((block.cta as { label?: string } | undefined)?.label as
                    | string
                    | undefined)
                }
                cartButtonText={block.cartButtonText as string | undefined}
                product={product}
              />
            );

          case "video":
            return (
              <VideoBlock
                key={index}
                videoUrl={block.videoUrl as string}
                title={block.title as string | undefined}
              />
            );

          case "pricing":
            return (
              <PricingBlock
                key={index}
                tiers={
                  block.tiers as Array<{
                    name: string;
                    price: number;
                    description: string;
                    features: string[];
                    notIncluded?: string[];
                    recommended?: boolean;
                    cta: string;
                  }>
                }
              />
            );

          case "countdown":
            return (
              <CountdownBlock
                key={index}
                endDate={(block.deadline ?? block.endDate ?? (block.settings as Record<string, unknown> | undefined)?.deadline ?? '') as string}
                title={block.title as string | undefined}
                subtitle={block.subtitle as string | undefined}
                discountType={block.discountType as string | undefined}
                discountValue={block.discountValue as number | undefined}
                buttonText={block.buttonText as string | undefined}
                productSlug={product?.slug}
                basePrice={product?.price}
              />
            );

          default:
            console.warn(`Unknown block type: ${block.type}`);
            return null;
        }
      })}
    </>
  );
}
