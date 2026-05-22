import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-pclink-bg text-pclink-muted">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm font-medium text-pclink-cyan transition hover:text-pclink-cyan-light"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a la App
          </Link>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel overflow-hidden rounded-2xl border border-pclink-border/50 bg-pclink-surface/50 p-8 sm:p-12"
        >
          <h1 className="mb-8 text-3xl font-black text-white">Políticas de Privacidad</h1>
          <p className="mb-8 text-sm">Última actualización: Mayo 2026</p>

          <div className="space-y-8 text-base leading-relaxed">
            <section>
              <h2 className="mb-4 text-xl font-bold text-white">1. Información que recopilamos</h2>
              <p>
                En PClink, recopilamos información personal básica (como nombre, correo electrónico y dirección de envío) exclusivamente cuando te registras o realizas una compra a través de nuestra aplicación móvil.
                Si eliges iniciar sesión con Google, recibiremos tu nombre público y dirección de correo electrónico asociados a tu cuenta.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-bold text-white">2. Cómo usamos tu información</h2>
              <p>
                La información que recopilamos se utiliza de las siguientes maneras:
              </p>
              <ul className="mt-4 list-inside list-disc space-y-2">
                <li>Para procesar tus transacciones y enviarte las compras.</li>
                <li>Para brindarte soporte y servicio al cliente.</li>
                <li>Para enviarte notificaciones sobre el estado de tu pedido.</li>
                <li>Para informarte sobre ofertas relevantes (si has aceptado recibir notificaciones).</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-bold text-white">3. Seguridad de Pagos (MercadoPago)</h2>
              <p>
                PClink no almacena ni procesa la información de tus tarjetas de crédito. Todo el procesamiento de pagos se realiza de forma externa y segura a través de los servidores cifrados de <strong>MercadoPago</strong>.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-bold text-white">4. Protección de Datos de Cuenta</h2>
              <p>
                Toda tu información está alojada de forma segura en los servidores en la nube de Google (Firebase). Los datos de autenticación viajan mediante conexiones encriptadas de extremo a extremo. Los administradores del sistema no tienen acceso a tus contraseñas bajo ninguna circunstancia.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-bold text-white">5. Derechos del Usuario</h2>
              <p>
                Tienes el derecho permanente de solicitar la eliminación total de tu cuenta y todos tus datos personales asociados enviando una solicitud formal a través de los canales de soporte en la aplicación o contactando al administrador.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
