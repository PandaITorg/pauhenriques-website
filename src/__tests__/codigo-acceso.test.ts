import { describe, expect, it } from "vitest";
import { CODIGO_INTENTOS_MAX, coincide, evaluarCodigo, huella } from "@/lib/auth/codigo-acceso";

const ahora = new Date("2026-10-19T12:00:00Z");
const vigente = new Date(ahora.getTime() + 60_000);

describe("código de acceso al panel", () => {
  it("entra con el código correcto y vigente", () => {
    expect(evaluarCodigo({ venceEn: vigente, intentos: 0 }, true, ahora).resultado).toBe("ok");
  });

  it("rechaza un código vencido aunque sea correcto", () => {
    expect(evaluarCodigo({ venceEn: ahora, intentos: 0 }, true, ahora).resultado).toBe("vencido");
  });

  it("se agota después del máximo de intentos, aunque el último sea correcto", () => {
    const r = evaluarCodigo({ venceEn: vigente, intentos: CODIGO_INTENTOS_MAX }, true, ahora);
    expect(r.resultado).toBe("agotado");
  });

  it("la huella depende del correo: el mismo código no sirve en otro buzón", () => {
    const h = huella("123456", "administrador@wellme.ec");
    expect(coincide(h, "123456", "administrador@wellme.ec")).toBe(true);
    expect(coincide(h, "123456", "administrador@pauhenriques.com")).toBe(false);
    expect(coincide(h, "654321", "administrador@wellme.ec")).toBe(false);
  });
});
