      import Link from "next/link";
      import logo from "@/assets/pauhenriques-lightest-green.png";
      import Image from "next/image";
      
      const Logo = () => {
        return (
          <div className="col-span-2 md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left">
            <Link href="/" className="mb-4">
              <Image src={logo} alt="Pau Henriques Logo" height={56} style={{ width: 'auto' }} />
            </Link>
            <p className="text-sm">Vive sin tóxicos, vive plenamente.</p>
          </div>
        );
      };
      
      export default Logo;
