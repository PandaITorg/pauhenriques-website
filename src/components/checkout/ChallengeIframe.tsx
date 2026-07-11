import { FaShieldAlt } from "react-icons/fa";

interface ThreeDSChallenge {
  html: string;
  isDeviceFingerprint: boolean;
}

interface ChallengeIframeProps {
  threeDSChallenge: ThreeDSChallenge;
  challengeVerifying: boolean;
}

export function ChallengeIframe({
  threeDSChallenge,
  challengeVerifying,
}: ChallengeIframeProps) {
  if (challengeVerifying) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-5">
        <div className="bg-surface-card border border-border-subtle rounded-xl p-8 max-w-sm w-full shadow-xl">
          <FaShieldAlt className="w-8 h-8 text-primary mx-auto mb-4" />
          <div className="simple-spinner w-8! h-8! border-3! mx-auto mb-4" />
          <h2 className="font-cormorant text-xl font-semibold text-text-main mb-2">
            Verificando con tu banco
          </h2>
          <p className="text-text-main/50 text-sm">
            Estamos confirmando tu autenticación. Esto puede tomar unos segundos...
          </p>
        </div>
        <p className="text-center text-xs text-text-main/40 mt-3">
          No cierres esta página.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="bg-surface-card border border-border-subtle rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-border-subtle flex items-center gap-3">
            <FaShieldAlt className="w-4 h-4 text-primary" />
            <div>
              <p className="font-semibold text-text-main text-sm">
                Verificación de seguridad del banco
              </p>
              <p className="text-text-main/50 text-xs">
                {threeDSChallenge.isDeviceFingerprint
                  ? "Verificando tu dispositivo..."
                  : "Tu banco requiere verificación adicional"}
              </p>
            </div>
          </div>
          <div className="relative">
            <iframe
              srcDoc={threeDSChallenge.html}
              className="w-full border-0"
              style={{
                height: threeDSChallenge.isDeviceFingerprint ? "1px" : "600px",
              }}
              title="Autenticación 3DS"
              sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation allow-popups"
            />
            {threeDSChallenge.isDeviceFingerprint && (
              <div className="flex flex-col items-center gap-3 py-10">
                <div className="simple-spinner" />
                <p className="text-sm text-text-main/60">
                  Verificando tu dispositivo...
                </p>
              </div>
            )}
          </div>
        </div>
        <p className="text-center text-xs text-text-main/40 mt-3">
          No cierres esta página. Conexión segura con tu banco.
        </p>
      </div>
    </div>
  );
}
