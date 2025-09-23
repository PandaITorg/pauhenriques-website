import { useRef, useState, useMemo, useEffect } from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import type { CountryCode } from "libphonenumber-js";
import 'react-phone-number-input/style.css';
import { Country, State, City } from "country-state-city";
import type { ICountry, IState, ICity } from "country-state-city";
import { FaInstagram, FaFacebook, FaTiktok, FaLinkedin, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

const socialPlatforms = [
  { id: "instagram", name: "Instagram", url: "https://instagram.com/", icon: FaInstagram },
  { id: "facebook", name: "Facebook", url: "https://facebook.com/", icon: FaFacebook },
  { id: "tiktok", name: "TikTok", url: "https://tiktok.com/@", icon: FaTiktok },
  { id: "x", name: "X", url: "https://x.com/", icon: FaXTwitter },
  { id: "linkedin", name: "LinkedIn", url: "https://linkedin.com/in/", icon: FaLinkedin },
  { id: "youtube", name: "YouTube", url: "https://youtube.com/", icon: FaYoutube },
];

const ProgramaAfiliados = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    website: "",
    socials: [{ platform: "instagram", username: "" }],
    message: "",
  });
  
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState<ICountry | null>(Country.getCountryByCode("EC")!);
  const [region, setRegion] = useState<IState | null>(null);
  const [city, setCity] = useState<ICity | null>(null);

  const [noSocials, setNoSocials] = useState(false);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    region: "",
    city: "",
    message: "",
    profilePicture: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [animationClass, setAnimationClass] = useState('opacity-0');

  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => setAnimationClass('opacity-100'), 100);
      return () => clearTimeout(timer);
    }
  }, [submitted]);

  const americanCountries = useMemo(() => 
    Country.getAllCountries().filter((c) => 
      c.timezones?.some(tz => tz.zoneName.startsWith("America/"))
    ),
    []
  );

  const statesOfCountry: IState[] = useMemo(() => 
    country ? State.getStatesOfCountry(country.isoCode) : [],
  [country]);

  const citiesOfState: ICity[] = useMemo(() => 
    country && region ? City.getCitiesOfState(country.isoCode, region.isoCode) : [],
  [country, region]);


  const CLOUDINARY_UPLOAD_PRESET = "perfiles_afiliados_pau_henriques";
  const CLOUDINARY_CLOUD_NAME = "dro8ckpco";
  const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  const GOOGLE_APPS_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbw0sdRnBFNV_Q2iJkK6vqPS60nkviycka2rN5cQq2cVsRIlHUQdWGWERiLXW4ohpamjVw/exec";

  const scrollToForm = () => {
    sectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (errors[id as keyof typeof errors]) {
        setErrors(prev => ({...prev, [id]: ""}));
    }
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const countryCode = e.target.value;
    const newCountry = Country.getCountryByCode(countryCode);
    setCountry(newCountry || null);
    setRegion(null); // Reset region
    setCity(null); // Reset city
    setPhone(""); // Reset phone number
    if (errors.country || errors.region || errors.city || errors.phone) {
        setErrors(prev => ({...prev, country: "", region: "", city: "", phone: ""}));
    }
  };

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const regionCode = e.target.value;
    const newRegion = State.getStateByCodeAndCountry(regionCode, country!.isoCode);
    setRegion(newRegion || null);
    setCity(null); // Reset city
    if (errors.region || errors.city) {
        setErrors(prev => ({...prev, region: "", city: ""}));
    }
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cityName = e.target.value;
    const newCity = citiesOfState.find(c => c.name === cityName);
    setCity(newCity || null);
    if (errors.city) {
        setErrors(prev => ({...prev, city: ""}));
    }
  };

  const handlePhoneChange = (value: string | undefined) => {
    setPhone(value || '');
    if (errors.phone) {
        setErrors(prev => ({...prev, phone: ""}));
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePicture(e.target.files[0]);
      if (errors.profilePicture) {
        setErrors(prev => ({...prev, profilePicture: ""}));
      }
    }
  };

  const handleNoSocialsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setNoSocials(isChecked);
    if (isChecked) {
      setFormData(prev => ({ ...prev, socials: [{ platform: "instagram", username: "" }] }));
    }
  };

  const handleSocialChange = (index: number, field: 'platform' | 'username', value: string) => {
    const newSocials = [...formData.socials];
    newSocials[index][field] = value;
    setFormData((prev) => ({ ...prev, socials: newSocials }));
  };

  const addSocialField = () => {
    setFormData((prev) => ({ ...prev, socials: [...prev.socials, { platform: "instagram", username: "" }] }));
  };

  const removeSocialField = (index: number) => {
    const newSocials = formData.socials.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, socials: newSocials }));
  };

  const validateForm = () => {
    const newErrors = { name: "", email: "", phone: "", country: "", region: "", city: "", message: "", profilePicture: "" };
    let isValid = true;

    if (!formData.name) {
      newErrors.name = "El nombre completo es obligatorio.";
      isValid = false;
    }
    if (!formData.email) {
      newErrors.email = "El correo electrónico es obligatorio.";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "El formato del correo no es válido.";
        isValid = false;
    }
    if (!phone) {
        newErrors.phone = "El número de teléfono es obligatorio.";
        isValid = false;
    } else if (!isValidPhoneNumber(phone)) {
        newErrors.phone = "El número de teléfono no es válido.";
        isValid = false;
    }
    if (!country) {
        newErrors.country = "El país es obligatorio.";
        isValid = false;
    }
    if (!region) {
        newErrors.region = "La provincia/estado es obligatoria.";
        isValid = false;
    }
    if (!city) {
        newErrors.city = "La ciudad es obligatoria.";
        isValid = false;
    }
    if (!formData.message) {
      newErrors.message = "Por favor, cuéntanos por qué quieres unirte.";
      isValid = false;
    }
    if (!profilePicture) {
      newErrors.profilePicture = "La foto de perfil es obligatoria.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    let profilePictureUrl = "";

    try {
      if (profilePicture) {
        const cloudinaryFormData = new FormData();
        cloudinaryFormData.append("file", profilePicture);
        cloudinaryFormData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const response = await fetch(CLOUDINARY_URL, { method: "POST", body: cloudinaryFormData });
        if (!response.ok) throw new Error("Error al subir la imagen.");
        const data = await response.json();
        profilePictureUrl = data.secure_url;
      }

      const googleFormData = new URLSearchParams();
      googleFormData.append("name", formData.name);
      googleFormData.append("email", formData.email);
      googleFormData.append("phone", phone);
      googleFormData.append("country", country?.name || "");
      googleFormData.append("region", region?.name || "");
      googleFormData.append("city", city?.name || "");
      googleFormData.append("website", formData.website);
      
      if (!noSocials) {
        formData.socials.forEach(social => {
          if (social.username) {
            const platformInfo = socialPlatforms.find(p => p.id === social.platform);
            if (platformInfo) {
              googleFormData.append(social.platform, social.username);
            }
          }
        });
      }
      googleFormData.append("message", formData.message);
      googleFormData.append("profilePictureUrl", profilePictureUrl);

      await fetch(GOOGLE_APPS_SCRIPT_URL, { method: "POST", mode: "no-cors", body: googleFormData });

      setSubmitted(true);
      
      if (formRef.current) {
        formRef.current.reset();
      }
      setFormData({ name: "", email: "", website: "", socials: [{ platform: "instagram", username: "" }], message: "" });
      setPhone("");
      setCountry(Country.getCountryByCode("EC")!);
      setRegion(null);
      setCity(null);
      setProfilePicture(null);
      setNoSocials(false);

    } catch (err) {
      console.error("Form submission error:", err);
      setErrors(prev => ({...prev, name: "Hubo un error al enviar tu solicitud. Por favor, inténtalo de nuevo."}));
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="bg-tertiary text-text-inverted py-8 px-4">
        {/* Hero Section */}
        <div className="flex flex-col justify-end bg-cover bg-center text-text-main min-h-[75vh] p-8" style={{backgroundImage: "url('/src/assets/equipo-de-ventas.jpg')"}}>
          <div className="container mx-auto text-center bg-background p-8 rounded-lg">
            <h1 className="text-5xl font-bold mb-4">Conviértete en Afiliado de Pau Henriques</h1>
            <p className="text-xl mb-8">Promueve un estilo de vida saludable y sin tóxicos y obtén comisiones por cada venta.</p>
            <button onClick={scrollToForm} className="bg-primary text-text-inverted font-bold py-3 px-8 rounded-full hover:brightness-90 transition duration-300">Únete Ahora</button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">

          {/* How it Works Section */}
          <section className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-8 text-text-inverted">¿Cómo Funciona?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 bg-white rounded-lg shadow-md text-text-inverted">
                <h3 className="text-2xl font-bold mb-4 text-primary">1. Regístrate</h3>
                <p>Completa nuestro formulario de solicitud. Es rápido, fácil y gratuito.</p>
              </div>
              <div className="p-8 bg-white rounded-lg shadow-md text-text-inverted">
                <h3 className="text-2xl font-bold mb-4 text-primary">2. Promociona</h3>
                <p>Comparte tus enlaces de afiliado y códigos de descuento en tus redes sociales, blog o con tus amigos.</p>
              </div>
              <div className="p-8 bg-white rounded-lg shadow-md text-text-inverted">
                <h3 className="text-2xl font-bold mb-4 text-primary">3. Gana Comisiones</h3>
                <p>Recibe una comisión por cada cliente que compre a través de tus enlaces.</p>
              </div>
            </div>
          </section>

          {/* Benefits Section */}
          <section className="mb-16 bg-white p-8 rounded-lg shadow-md text-text-inverted">
            <h2 className="text-4xl font-bold text-center mb-8">Beneficios del Programa</h2>
            <ul className="grid md:grid-cols-2 gap-8 text-lg">
              <li className="flex items-start"><span className="text-primary mr-2">✔</span> <span>Comisiones competitivas por cada venta.</span></li>
              <li className="flex items-start"><span className="text-primary mr-2">✔</span> <span>Acceso a material de marketing y soporte.</span></li>
              <li className="flex items-start"><span className="text-primary mr-2">✔</span> <span>Dashboard para seguir tus referidos y ganancias.</span></li>
              <li className="flex items-start"><span className="text-primary mr-2">✔</span> <span>Pagos puntuales y transparentes.</span></li>
              <li className="flex items-start"><span className="text-primary mr-2">✔</span> <span>Forma parte de una comunidad apasionada por el bienestar.</span></li>
              <li className="flex items-start"><span className="text-primary mr-2">✔</span> <span>Promociona productos de alta calidad en los que confías.</span></li>
            </ul>
          </section>

          {/* Form Section */}
          <section ref={sectionRef} className="bg-white p-8 rounded-lg shadow-md text-text-inverted">
            <h2 className="text-4xl font-bold text-center mb-8">Únete a Nuestro Equipo</h2>
            
            {submitted ? (
              <div className={`text-center transition-opacity duration-500 ${animationClass}`}>
                <h3 className="text-2xl font-bold text-primary mb-4">¡Gracias por tu solicitud!</h3>
                <p>Hemos recibido tu información y la revisaremos pronto. Nos pondremos en contacto contigo.</p>
              </div>
            ) : (
              <>
                <p className="text-center mb-8">Completa el formulario para aplicar al programa de afiliados.</p>
                <form ref={formRef} onSubmit={handleSubmit} noValidate className="max-w-xl mx-auto">
                  <div className="mb-4">
                    <label htmlFor="name" className="block font-bold mb-2">Nombre Completo</label>
                    <input type="text" id="name" value={formData.name} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-lg bg-gray-100 border-primary focus:outline-none focus:border-secondary" />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>
                  <div className="mb-4">
                    <label htmlFor="email" className="block font-bold mb-2">Correo Electrónico</label>
                    <input type="email" id="email" value={formData.email} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-lg bg-gray-100 border-primary focus:outline-none focus:border-secondary" />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="country" className="block font-bold mb-2">País</label>
                        <select 
                            id="country"
                            value={country?.isoCode || ""}
                            onChange={handleCountryChange}
                            className="w-full px-3 py-2 border rounded-lg bg-gray-100 border-primary focus:outline-none focus:border-secondary"
                        >
                            <option value="">Selecciona un país</option>
                            {americanCountries.map(c => (
                                <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
                            ))}
                        </select>
                        {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
                    </div>
                    <div>
                        <label htmlFor="region" className="block font-bold mb-2">Provincia / Estado</label>
                        <select
                            id="region"
                            value={region?.isoCode || ""}
                            onChange={handleRegionChange}
                            disabled={!country}
                            className="w-full px-3 py-2 border rounded-lg bg-gray-100 border-primary focus:outline-none focus:border-secondary disabled:bg-gray-200"
                        >
                            <option value="">Selecciona una provincia/estado</option>
                            {statesOfCountry.map(s => (
                                <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
                            ))}
                        </select>
                        {errors.region && <p className="text-red-500 text-sm mt-1">{errors.region}</p>}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="city" className="block font-bold mb-2">Ciudad</label>
                    <select
                        id="city"
                        value={city?.name || ""}
                        onChange={handleCityChange}
                        disabled={!region}
                        className="w-full px-3 py-2 border rounded-lg bg-gray-100 border-primary focus:outline-none focus:border-secondary disabled:bg-gray-200"
                    >
                        <option value="">Selecciona una ciudad</option>
                        {citiesOfState.map(c => (
                            <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                    </select>
                    {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                  </div>
                  <div className="mb-4">
                    <label htmlFor="phone" className="block font-bold mb-2">Número de Teléfono</label>
                    <PhoneInput
                      key={country?.isoCode || 'default'}
                      id="phone"
                      value={phone}
                      onChange={handlePhoneChange}
                      defaultCountry={country?.isoCode as CountryCode | undefined}
                      countries={americanCountries.map(c => c.isoCode) as CountryCode[]}
                      disabled={!country}
                      className="w-full px-3 py-2 border rounded-lg bg-gray-100 border-primary focus:outline-none focus:border-secondary disabled:bg-gray-200"
                      />
                      {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                  </div>
                  <div className="mb-4">
                    <label htmlFor="profile-picture" className="block font-bold mb-2">Foto de Perfil</label>
                    <input type="file" id="profile-picture" accept="image/*" onChange={handleFileChange} required className="w-full px-3 py-2 border rounded-lg bg-gray-100 border-primary focus:outline-none focus:border-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-text-inverted hover:file:brightness-90" />
                    {errors.profilePicture && <p className="text-red-500 text-sm mt-1">{errors.profilePicture}</p>}
                  </div>
                  <div className="mb-4">
                    <label htmlFor="website" className="block font-bold mb-2">Sitio Web Personal (opcional)</label>
                    <input type="text" id="website" value={formData.website} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg bg-gray-100 border-primary focus:outline-none focus:border-secondary" placeholder="tu-pagina.com" />
                  </div>

                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex items-center mb-4">
                        <input type="checkbox" id="no-socials" checked={noSocials} onChange={handleNoSocialsChange} className="h-4 w-4 accent-primary focus:ring-primary border-gray-300 rounded" />
                        <label htmlFor="no-socials" className="ml-2 block text-sm font-bold">No tengo redes sociales</label>
                    </div>
                    <fieldset disabled={noSocials} className="disabled:opacity-50">
                        <label className="block font-bold mb-2">Perfiles de Redes Sociales</label>
                        {formData.socials.map((social, index) => (
                          <div key={index} className="flex items-center mb-2 gap-2">
                            <div className="flex items-center gap-2">
                                {socialPlatforms.map(p => (
                                    <button
                                        type="button"
                                        key={p.id}
                                        title={p.name}
                                        onClick={() => handleSocialChange(index, 'platform', p.id)}
                                        className={`p-3 border rounded-lg transition-colors ${ 
                                            social.platform === p.id
                                                ? 'bg-primary text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        <p.icon className="w-5 h-5" />
                                    </button>
                                ))}
                            </div>
                            <input
                              type="text"
                              value={social.username}
                              onChange={(e) => handleSocialChange(index, 'username', e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg bg-gray-100 border-primary focus:outline-none focus:border-secondary"
                              placeholder="TuUsuario"
                            />
                            {formData.socials.length > 1 && (
                              <button type="button" onClick={() => removeSocialField(index)} className="text-red-500 font-bold p-2">X</button>
                            )}
                          </div>
                        ))}
                        <button type="button" onClick={addSocialField} className="text-sm text-primary font-semibold mt-2">+ Agregar otra red social</button>
                    </fieldset>
                  </div>

                  <div className="mb-4 mt-4">
                    <label htmlFor="message" className="block font-bold mb-2">¿Por qué quieres unirte a nuestro programa?</label>
                    <textarea id="message" value={formData.message} rows={4} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-lg bg-gray-100 border-primary focus:outline-none focus:border-secondary"></textarea>
                    {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message}</p>}
                  </div>
                  
                  <div className="text-center">
                    <button type="submit" disabled={isLoading} className="bg-primary text-text-inverted font-bold py-3 px-8 rounded-full hover:brightness-90 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                      {isLoading ? "Enviando..." : "Enviar Solicitud"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>

        </div>
      </div>
  );
};

export default ProgramaAfiliados;