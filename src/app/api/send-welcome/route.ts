import { NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email, nombre } = await request.json();

    if (!email || !nombre) {
      return NextResponse.json(
        { error: 'Email y nombre son requeridos' },
        { status: 400 }
      );
    }

    const result = await sendWelcomeEmail(email, nombre);

    if (result.success) {
      return NextResponse.json({ message: 'Correo de bienvenida enviado' });
    } else {
      return NextResponse.json(
        { error: 'Error al enviar el correo' },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}
