import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

interface InfoCardProps {
  href: string;
  imgSrc: string;
  imgAlt: string;
  title: string;
  description: string;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  href,
  imgSrc,
  imgAlt,
  title,
  description,
}) => (
  <Link href={href} className="block transition-transform hover:scale-[1.02]">
    <Card className="flex items-center gap-4 p-4 hover:bg-gray-100 transition-colors flex-row">
      <div className="w-12 h-12 flex-shrink-0">
        <Image
          src={imgSrc}
          alt={imgAlt}
          className="w-full h-full object-contain"
          width={48}
          height={48}
        />
      </div>
      <CardContent className="p-0 flex-1">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </CardContent>
      <ArrowRight className="text-gray-400" />
    </Card>
  </Link>
);
