import { Link } from "react-router";
import logo from "../../assets/pauhenriques-lightest-green.png";

const Logo = () => {
  return (
    <div className="md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left">
      <Link to="/" className="mb-4">
        <img src={logo} alt="Pau Henriques Logo" className="h-14" />
      </Link>
      <p className="text-sm">Vive sin tóxicos, vive plenamente.</p>
    </div>
  );
};

export default Logo;
