/**
 * PATCH /api/orders/[id]
 *
 * Actualiza el estado de una orden manualmente desde el panel de admin.
 *
 * ¿Por qué requiere auth de admin?
 * Sin protección, cualquier usuario podía hacer PATCH a esta ruta con
 * { estado: "pagado" } y marcar una orden como pagada sin haber pagado.
 * Esto es un fraude directo. Solo el admin puede cambiar estados manualmente.
 */
import { NextRequest, NextResponse } from "next/server";
import { processOrderUpdate } from "@/lib/orders";
import { requireAdminAuth } from "@/lib/auth-helpers";

const STATUS_PRIORITY: Record<string, number> = {
  pendiente: 0,
  pagado: 1,
  enviado: 2,
  entregado: 3,
  rechazado: 4,
  reembolsado: 4,
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Solo un admin puede cambiar el estado de una orden manualmente
  const { error } = await requireAdminAuth(req);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await req.json();
    const { estado } = body;

    if (!estado || STATUS_PRIORITY[estado] === undefined) {
      return NextResponse.json(
        { error: `Estado inválido. Valores permitidos: ${Object.keys(STATUS_PRIORITY).join(", ")}` },
        { status: 400 }
      );
    }

    // 2. Usar la lógica unificada (maneja anti-downgrade y restauración de inventario)
    try {
      const result = await processOrderUpdate({
        orderId: id,
        paymentId: "manual-" + Date.now(), // ID ficticio para cambios manuales
        mpStatus: estado === "pagado" ? "approved" : (estado === "rechazado" ? "rejected" : (estado === "reembolsado" ? "refunded" : "pending")),
        mpStatusDetail: "manual_admin_update",
        forceInternalStatus: estado,
      });

      if (result.isDowngrade) {
        return NextResponse.json({ error: "No se puede retroceder el estado del pedido." }, { status: 400 });
      }

    } catch (orderError: any) {
      if (orderError.message === "ORDER_NOT_FOUND") {
        return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
      }
      throw orderError;
    }

    return NextResponse.json({
      success: true,
      orderId: id,
      nuevoEstado: estado,
    });

  } catch (error: any) {
    console.error("Error actualizando pedido:", error?.message || error);
    return NextResponse.json(
      { error: "Error en el servidor al actualizar el pedido." },
      { status: 500 }
    );
  }
}
