import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertTransition } from "@/lib/transfer-machine";

/**
 * MTN MoMo Disbursement callback (X-Callback-Url).
 * Body typically mirrors TransferResult: status SUCCESSFUL | FAILED | PENDING.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      externalId?: string;
      status?: string;
      financialTransactionId?: string;
      reason?: { code?: string; message?: string };
    };

    const reference = body.externalId;
    if (!reference) {
      return NextResponse.json({ error: "externalId manquant" }, { status: 400 });
    }

    const transfer = await prisma.transfer.findFirst({
      where: { reference },
    });
    if (!transfer) {
      return NextResponse.json({ received: true, matched: false });
    }

    await prisma.transferEvent.create({
      data: {
        transferId: transfer.id,
        type: "momo_callback",
        message: `Callback MoMo: ${body.status ?? "unknown"} ${
          body.financialTransactionId ?? ""
        }`.trim(),
      },
    });

    if (body.status === "SUCCESSFUL" && transfer.status !== "delivered") {
      if (
        transfer.status === "payout_sent" ||
        transfer.status === "payout_queued"
      ) {
        try {
          if (transfer.status === "payout_queued") {
            assertTransition("payout_queued", "payout_sent");
            await prisma.transfer.update({
              where: { id: transfer.id },
              data: { status: "payout_sent" },
            });
          }
          assertTransition("payout_sent", "delivered");
          await prisma.transfer.update({
            where: { id: transfer.id },
            data: {
              status: "delivered",
              deliveredAt: new Date(),
              payoutRef: body.financialTransactionId ?? transfer.payoutRef,
            },
          });
          await prisma.transferEvent.create({
            data: {
              transferId: transfer.id,
              type: "delivered",
              message: "Livré via callback MoMo",
            },
          });
        } catch {
          /* transition ignored if already advanced */
        }
      }
    }

    if (body.status === "FAILED") {
      await prisma.transfer.update({
        where: { id: transfer.id },
        data: {
          status: "payout_failed",
          failureReason:
            body.reason?.message ?? body.reason?.code ?? "MoMo FAILED",
        },
      });
      await prisma.transferEvent.create({
        data: {
          transferId: transfer.id,
          type: "payout_failed",
          message: body.reason?.message ?? "Échec MoMo (callback)",
        },
      });
    }

    return NextResponse.json({ received: true, matched: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
