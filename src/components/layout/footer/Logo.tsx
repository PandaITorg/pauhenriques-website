import Link from "next/link";
import logo from "@/assets/pauhenriques-lightest-green.png";
import Image from "next/image";

const Logo = () => {
  return (
    <div className="md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left">
      <Link href="/" className="mb-4 group">
        <Image
          src={logo}
          alt="Pau Henriques Logo"
          height={48}
          style={{ width: "auto" }}
          className="transition-opacity duration-300 group-hover:opacity-80"
        />
      </Link>
      <p className="font-cormorant italic text-base text-text-main/50 tracking-wide">
        Vive sin toxicos, vive plenamente.
      </p>
    </div>
  );
};

export default Logo;
