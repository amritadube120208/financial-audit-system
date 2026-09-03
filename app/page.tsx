import { Hero } from "@/components/home/hero";
import { UploadDropzone } from "@/components/home/upload-dropzone";

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col">
      <Hero />
      <UploadDropzone />
    </div>
  );
}
