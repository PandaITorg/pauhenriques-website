import { FaLock, FaShieldAlt } from "react-icons/fa";

interface OtpPanelProps {
  otpCode: string;
  setOtpCode: (code: string) => void;
  otpError: string | null;
  otpSubmitting: boolean;
  submitOtp: () => void;
  onCancel: () => void;
}

export function OtpPanel({
  otpCode,
  setOtpCode,
  otpError,
  otpSubmitting,
  submitOtp,
  onCancel,
}: OtpPanelProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-surface-card border border-border-subtle rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-border-subtle flex items-center gap-3">
            <FaShieldAlt className="w-4 h-4 text-primary" />
            <div>
              <p className="font-semibold text-text-main text-sm">
                Verificación de seguridad
              </p>
              <p className="text-text-main/50 text-xs">
                Tu banco ha enviado un código a tu teléfono
              </p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-text-main/70 text-center">
              Ingresa el código de verificación (OTP) que recibiste por SMS de tu banco.
            </p>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={8}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              placeholder="Código OTP"
              className="w-full text-center text-2xl tracking-[0.3em] font-mono border border-border-default rounded-lg py-3 px-4 bg-background text-text-main placeholder:text-text-main/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") submitOtp();
              }}
            />
            {otpError && (
              <p className="text-error text-xs text-center">{otpError}</p>
            )}
            <button
              onClick={submitOtp}
              disabled={otpSubmitting || !otpCode.trim()}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {otpSubmitting ? (
                <>
                  <div className="simple-spinner w-5! h-5! border-2! border-white! border-b-transparent!" />
                  Verificando...
                </>
              ) : (
                <>
                  <FaLock className="w-3.5 h-3.5" />
                  Verificar código
                </>
              )}
            </button>
            <button
              onClick={onCancel}
              disabled={otpSubmitting}
              className="w-full text-sm text-text-main/50 hover:text-text-main transition-colors py-2"
            >
              Cancelar
            </button>
          </div>
        </div>
        <p className="text-center text-xs text-text-main/40 mt-3">
          No cierres esta página. Conexión segura con tu banco.
        </p>
      </div>
    </div>
  );
}
