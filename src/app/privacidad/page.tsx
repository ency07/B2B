import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidad — Portal de Clientes",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-stone-50 py-16 px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link
          href="/portal"
          className="text-xs font-mono text-stone-500 hover:text-stone-900 underline underline-offset-2"
        >
          &larr; Volver al portal
        </Link>

        <div className="rounded-2xl border border-stone-200 bg-white p-8 sm:p-12 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Política de Privacidad
          </h1>
          <p className="text-xs text-stone-500 mt-1 font-mono">
            Última actualización: Julio 2026
          </p>

          <div className="mt-8 space-y-6 text-sm text-stone-700 leading-relaxed">
            <section className="space-y-2">
              <h2 className="font-bold text-stone-900 text-base">
                1. Datos que recopilamos
              </h2>
              <p>
                A través del portal de clientes, recopilamos los siguientes datos
                personales y empresariales: nombre o razón social, NIT, dirección
                de correo electrónico, teléfono de contacto, historial de
                facturación, órdenes de trabajo, tickets de soporte y mensajes
                de la bitácora de atención.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-stone-900 text-base">
                2. Finalidad del tratamiento
              </h2>
              <p>
                Los datos recopilados se utilizan exclusivamente para la
                prestación de los servicios contratados: fabricación de
                maquinaria industrial, servicio técnico, facturación,
                gestión de garantías y atención al cliente.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-stone-900 text-base">
                3. Derechos ARCO
              </h2>
              <p>
                De conformidad con la Ley 1581 de 2012 y el Decreto 1377 de
                2013, usted tiene derecho a conocer, actualizar, rectificar y
                solicitar la supresión de sus datos personales, así como a
                oponerse al tratamiento de los mismos.
              </p>
              <p>
                Para ejercer sus derechos ARCO, puede escribir a nuestro
                oficial de protección de datos a través del formulario de
                contacto en el portal o enviando un correo a
                {" "}<span className="font-mono text-stone-900">datos@ventitech.com</span>.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-stone-900 text-base">
                4. Almacenamiento local
              </h2>
              <p>
                El portal utiliza almacenamiento local del navegador
                (localStorage) únicamente para recordar sus preferencias de
                visualización (tema de color). No utilizamos cookies de
                rastreo ni compartimos datos con terceros no operadores.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-stone-900 text-base">
                5. Contacto
              </h2>
              <p>
                Si tiene preguntas sobre el tratamiento de sus datos, puede
                contactarnos en:{" "}
                <span className="font-mono text-stone-900">datos@ventitech.com</span>
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
