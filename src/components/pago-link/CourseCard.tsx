import Image from "next/image";
import { FaCheckCircle, FaVideo, FaMobileAlt } from "react-icons/fa";
import type { CourseConfig } from "@/lib/pago-link/course";

interface CourseCardProps {
  course: CourseConfig;
}

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <div className="bg-surface-card border border-border-subtle rounded-xl overflow-hidden">
      <div className="relative aspect-[16/10] bg-surface-elevated">
        <Image
          src={course.image}
          alt={course.name}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 520px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />
        <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium tracking-[0.15em] uppercase px-2.5 py-1 rounded-full">
          Curso online
        </span>
      </div>

      <div className="p-5 sm:p-6">
        <h2 className="font-cormorant text-2xl sm:text-3xl font-semibold text-text-main leading-tight">
          {course.name}
        </h2>
        <p className="mt-2 text-sm text-text-main/60 leading-relaxed">
          {course.shortDescription}
        </p>

        <ul className="mt-5 space-y-2.5">
          <li className="flex items-start gap-2.5 text-sm text-text-main/70">
            <FaCheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>Acceso desde cualquier dispositivo</span>
          </li>
          <li className="flex items-start gap-2.5 text-sm text-text-main/70">
            <FaVideo className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>Taller en vivo</span>
          </li>
          <li className="flex items-start gap-2.5 text-sm text-text-main/70">
            <FaMobileAlt className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>Recibes el enlace en tu correo tras el pago</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
